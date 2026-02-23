from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
import hashlib
from datetime import datetime, timedelta, time, timezone
from jose import JWTError, jwt
import re
import pytz
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from schemas import (
    UserAuth, UserProfile, TokenResponse, RefreshTokenRequest,
    EmailSettingsUpdate, UserProfileWithSettings, ReminderIntervalsUpdate,
    GoogleAuthRequest, CompleteSignupRequest
)
from deps import get_current_user, get_db
from config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS, GOOGLE_CLIENT_ID, SIGNUP_TOKEN_EXPIRE_MINUTES
)
import models

router = APIRouter()

def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    return True, ""

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def hash_refresh_token(token: str) -> str:
    """Hash refresh token using SHA-256 (bcrypt has 72-byte limit, JWT tokens exceed this)"""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def verify_refresh_token_hash(token: str, hashed: str) -> bool:
    """Verify refresh token against its SHA-256 hash"""
    return hashlib.sha256(token.encode('utf-8')).hexdigest() == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_signup_token(data: dict):
    """Short-lived token for completing Google signup."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=SIGNUP_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "signup"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_refresh_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            return None
        
        # Verify the token matches what's stored in the database
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user or not user.refresh_token:
            return None
        
        # Hash the provided token and compare with stored hash
        if not verify_refresh_token_hash(token, user.refresh_token):
            return None
            
        return int(user_id)
    except JWTError:
        return None

@router.post("/register")
def register(user: UserAuth, db: Session = Depends(get_db)):
    # Validate password strength
    is_valid, error_msg = validate_password(user.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        name=user.name or "User",
        password=hash_password(user.password),
        email_verified=False,
        signup_completed=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created", "name": new_user.name}


@router.post("/google")
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verify Google ID token, create partial user, return signup token."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    
    try:
        # Verify the Google ID token
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        google_email = idinfo["email"]
        google_id = idinfo["sub"]
        email_verified = idinfo.get("email_verified", False)
        
        if not email_verified:
            raise HTTPException(status_code=400, detail="Google email is not verified")
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    # Check if user already exists with this email
    existing_user = db.query(models.User).filter(models.User.email == google_email).first()
    
    if existing_user:
        if existing_user.signup_completed:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists. Please sign in instead."
            )
        # User started Google signup but didn't complete — update google_id and let them continue
        existing_user.google_id = google_id
        existing_user.email_verified = True
        db.commit()
        
        signup_token = create_signup_token({"sub": str(existing_user.id), "email": google_email})
        return {
            "signup_token": signup_token,
            "email": google_email,
            "message": "Please complete your signup"
        }
    
    # Check if a user exists with this google_id (edge case)
    existing_google = db.query(models.User).filter(models.User.google_id == google_id).first()
    if existing_google:
        if existing_google.signup_completed:
            raise HTTPException(
                status_code=400,
                detail="An account with this Google ID already exists. Please sign in instead."
            )
        signup_token = create_signup_token({"sub": str(existing_google.id), "email": existing_google.email})
        return {
            "signup_token": signup_token,
            "email": existing_google.email,
            "message": "Please complete your signup"
        }
    
    # Create a new partial user
    new_user = models.User(
        email=google_email,
        name="User",
        password=None,
        google_id=google_id,
        email_verified=True,
        signup_completed=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    signup_token = create_signup_token({"sub": str(new_user.id), "email": google_email})
    return {
        "signup_token": signup_token,
        "email": google_email,
        "message": "Please complete your signup"
    }


@router.post("/complete-signup")
def complete_signup(request: CompleteSignupRequest, db: Session = Depends(get_db)):
    """Complete Google signup by setting name and password."""
    # Verify the signup token
    try:
        payload = jwt.decode(request.signup_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id is None or token_type != "signup":
            raise HTTPException(status_code=400, detail="Invalid signup token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired signup token")
    
    # Validate password
    is_valid, error_msg = validate_password(request.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Validate name
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    # Find the user
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.signup_completed:
        raise HTTPException(status_code=400, detail="Signup already completed")
    
    # Update user with name and password
    user.name = name
    user.password = hash_password(request.password)
    user.signup_completed = True
    db.commit()
    
    return {"message": "Signup completed successfully. Please sign in.", "name": user.name}


@router.post("/google-login", response_model=TokenResponse)
def google_login(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Login with Google. User must have completed signup."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    
    try:
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        google_email = idinfo["email"]
        google_id = idinfo["sub"]
        
        if not idinfo.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Google email is not verified")
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    # Find user by google_id or email
    db_user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not db_user:
        db_user = db.query(models.User).filter(models.User.email == google_email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="No account found. Please sign up first.")
    
    if not db_user.signup_completed:
        raise HTTPException(status_code=403, detail="Don't have an account yet ? Create one to continue.")
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
    
    db_user.refresh_token = hash_refresh_token(refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "name": db_user.name,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/login", response_model=TokenResponse)
def login(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user or not db_user.password or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not db_user.signup_completed:
        raise HTTPException(status_code=403, detail="Don't have an account yet ? Create one to continue.")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
    
    # Store hashed refresh token in database (using SHA-256, not bcrypt due to length limits)
    db_user.refresh_token = hash_refresh_token(refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "name": db_user.name,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Return expiry in seconds
    }

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"name": user.name, "email": user.email}


@router.get("/profile/settings")
def get_profile_with_settings(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Get user profile including email notification settings."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reminder_time_str = None
    if user.email_reminder_time:
        reminder_time_str = user.email_reminder_time.strftime("%H:%M")
    
    return {
        "name": user.name,
        "email": user.email,
        "email_notifications_enabled": user.email_notifications_enabled if user.email_notifications_enabled is not None else True,
        "email_reminder_time": reminder_time_str,
        "timezone": user.timezone or "UTC",
        "reminder_days_done": user.reminder_days_done if user.reminder_days_done is not None else 12,
        "reminder_days_help": user.reminder_days_help if user.reminder_days_help is not None else 5,
        "reminder_days_fail": user.reminder_days_fail if user.reminder_days_fail is not None else 3
    }

@router.put("/profile")
def update_profile(profile: UserProfile, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = profile.name
    db.commit()
    return {"message": "Profile updated", "name": user.name}


@router.put("/email-settings")
def update_email_settings(
    settings: EmailSettingsUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Update user's email notification settings."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate timezone
    try:
        pytz.timezone(settings.timezone)
    except pytz.exceptions.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {settings.timezone}")
    
    # Parse reminder time if provided
    reminder_time = None
    if settings.email_reminder_time:
        try:
            hour, minute = map(int, settings.email_reminder_time.split(":"))
            reminder_time = time(hour=hour, minute=minute)
        except (ValueError, AttributeError):
            raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM (e.g., 09:00)")
    
    user.email_notifications_enabled = settings.email_notifications_enabled
    user.email_reminder_time = reminder_time
    user.timezone = settings.timezone
    
    db.commit()
    
    return {
        "message": "Email settings updated",
        "email_notifications_enabled": user.email_notifications_enabled,
        "email_reminder_time": settings.email_reminder_time,
        "timezone": user.timezone
    }


@router.put("/reminder-intervals")
def update_reminder_intervals(
    settings: ReminderIntervalsUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Update user's custom spaced repetition intervals."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.reminder_days_done = settings.reminder_days_done
    user.reminder_days_help = settings.reminder_days_help
    user.reminder_days_fail = settings.reminder_days_fail
    
    db.commit()
    
    return {
        "message": "Reminder intervals updated",
        "reminder_days_done": user.reminder_days_done,
        "reminder_days_help": user.reminder_days_help,
        "reminder_days_fail": user.reminder_days_fail
    }


@router.post("/send-test-email")
async def send_test_email_endpoint(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    """Send a test reminder email to the authenticated user."""
    from scheduler import send_immediate_reminder
    
    result = await send_immediate_reminder(user_id)
    
    if result["success"]:
        return {"message": result["message"]}
    else:
        raise HTTPException(status_code=500, detail=result["message"])

@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    user_id = verify_refresh_token(refresh_request.refresh_token, db)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update stored refresh token (using SHA-256, not bcrypt due to length limits)
    user.refresh_token = hash_refresh_token(new_refresh_token)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/logout")
def logout(db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.refresh_token = None
        db.commit()
    return {"message": "Logged out successfully"}