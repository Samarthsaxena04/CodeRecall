from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import List, Optional, Literal
from datetime import time

class QuestionCreate(BaseModel):
    title: str
    link: HttpUrl
    platform: str
    notes: Optional[str] = None
    tags: List[str]
    status: Literal["done", "help", "fail"]

    @field_validator("title")
    @classmethod
    def title_must_be_reasonable(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 300:
            raise ValueError("Title must be 300 characters or fewer")
        return v

    @field_validator("platform")
    @classmethod
    def platform_must_be_reasonable(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Platform cannot be empty")
        if len(v) > 100:
            raise ValueError("Platform must be 100 characters or fewer")
        return v

    @field_validator("notes")
    @classmethod
    def notes_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 5000:
            raise ValueError("Notes must be 5000 characters or fewer")
        return v

    @field_validator("tags")
    @classmethod
    def tags_must_be_reasonable(cls, v: List[str]) -> List[str]:
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        cleaned = []
        for tag in v:
            tag = tag.strip()
            if tag and len(tag) <= 50:
                cleaned.append(tag)
        return cleaned

class UserAuth(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = "User"

class UserProfile(BaseModel):
    name: str
    email: str

class UserProfileWithSettings(BaseModel):
    name: str
    email: str
    email_notifications_enabled: bool
    email_reminder_time: Optional[str] = None  # Format: "HH:MM"
    timezone: str

class EmailSettingsUpdate(BaseModel):
    email_notifications_enabled: bool
    email_reminder_time: Optional[str] = None  # Format: "HH:MM" (e.g., "09:00")
    timezone: str = "UTC"

class RevisionUpdate(BaseModel):
    status: Literal["done", "help", "fail"]

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class SendTestEmailRequest(BaseModel):
    pass  # No body needed, uses authenticated user's email


class GoogleAuthRequest(BaseModel):
    token: str  # Google ID token from frontend


class CompleteSignupRequest(BaseModel):
    signup_token: str  # Temporary token issued after Google auth
    name: str
    password: str