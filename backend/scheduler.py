

import logging
import threading
from datetime import datetime, time, date, timedelta, timezone
from typing import List, Dict, Any
import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from sqlalchemy import and_
from sqlalchemy.orm import Session

import models
from database import SessionLocal
from email_service import send_revision_reminder_email, is_email_configured

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
_scheduler_lock = threading.Lock()


def get_db() -> Session:
    return SessionLocal()


def get_questions_due_for_user(db: Session, user_id: int) -> List[Dict]:
    today = date.today()
    
    schedules = db.query(models.Schedule).filter(
        and_(
            models.Schedule.user_id == user_id,
            models.Schedule.next_review_date <= today
        )
    ).all()
    
    questions = []
    for sch in schedules:
        question = db.query(models.Question).filter(
            models.Question.id == sch.question_id
        ).first()
        
        if not question:
            continue

        tags = db.query(models.Tag.name).join(
            models.QuestionTag,
            models.Tag.id == models.QuestionTag.tag_id
        ).filter(
            models.QuestionTag.question_id == question.id
        ).all()
        
        questions.append({
            "question_id": question.id,
            "title": question.title,
            "link": question.link,
            "platform": question.platform,
            "notes": question.notes,
            "tags": [tag[0] for tag in tags]
        })
    
    return questions


def send_reminder_for_user(user: models.User, db: Session) -> bool:
    try:
        questions = get_questions_due_for_user(db, int(user.id))
        
        if not questions:
            logger.debug(f"No questions due for user {user.email}, skipping email.")
            return True
        
        success = send_revision_reminder_email(
            to_email=str(user.email),
            user_name=str(user.name) if user.name else "User",
            questions=questions
        )
        
        if success:
            logger.info(f"Sent reminder email to {user.email} with {len(questions)} questions")
        else:
            logger.warning(f"Failed to send reminder email to {user.email}")
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending reminder for user {user.id}: {str(e)}")
        return False


async def check_and_send_reminders():
    if not is_email_configured():
        logger.debug("Email service not configured, skipping reminder check.")
        return
    
    db = get_db()
    try:
        now_utc = datetime.now(timezone.utc)

        users = db.query(models.User).filter(
            models.User.email_notifications_enabled == True,
            models.User.email_reminder_time.isnot(None)
        ).all()
        
        for user in users:
            try:
                user_tz = pytz.timezone(str(user.timezone) if user.timezone else "UTC")
                user_now = now_utc.replace(tzinfo=pytz.UTC).astimezone(user_tz)
                reminder_time = user.email_reminder_time

                # Per-minute granularity: trigger only when hour and minute both match
                if (user_now.hour == reminder_time.hour and 
                    user_now.minute == reminder_time.minute):
                    
                    logger.info(f"Triggering reminder for user {user.email} at their preferred time {reminder_time}")
                    send_reminder_for_user(user, db)
                    
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error in check_and_send_reminders: {str(e)}")
    finally:
        db.close()


async def send_immediate_reminder(user_id: int) -> Dict[str, Any]:
    db = get_db()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        questions = get_questions_due_for_user(db, user_id)
        
        if not questions:
            return {"success": True, "message": "No questions due for revision"}
        
        logger.info(f"Sending email to {user.email} with {len(questions)} questions.")
        
        success = send_revision_reminder_email(
            to_email=str(user.email),
            user_name=str(user.name) if user.name else "User",
            questions=questions
        )
        
        if success:
            return {"success": True, "message": f"Email sent with {len(questions)} questions"}
        else:
            return {"success": False, "message": "Failed to send email"}
            
    except Exception as e:
        logger.error(f"Error sending immediate reminder: {str(e)}")
        return {"success": False, "message": str(e)}
    finally:
        db.close()


def job_listener(event):
    if event.exception:
        logger.error(f"Job {event.job_id} failed with exception: {event.exception}")
    else:
        logger.debug(f"Job {event.job_id} executed successfully")


def start_scheduler():
    with _scheduler_lock:
        if scheduler.running:
            logger.info("Scheduler is already running")
            return

        scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

        scheduler.add_job(
            check_and_send_reminders,
            trigger=IntervalTrigger(minutes=1),
            id="email_reminder_checker",
            name="Check and send email reminders",
            replace_existing=True
        )

        scheduler.start()
        logger.info("Email reminder scheduler started")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Email reminder scheduler stopped")