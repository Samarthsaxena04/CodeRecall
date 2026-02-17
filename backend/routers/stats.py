from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import pytz

import models
from deps import get_current_user, get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# 📊 Weak topics with actual success rates
@router.get("/stats/weak-topics")
def stats_weak_topics(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    tag_stats = defaultdict(lambda: {'total': 0, 'success': 0, 'fail': 0})
    
    # Single query: join questions -> question_tags -> tags -> logs
    rows = db.query(
        models.Tag.name,
        models.QuestionLog.status
    ).join(
        models.QuestionTag,
        models.Tag.id == models.QuestionTag.tag_id
    ).join(
        models.Question,
        models.Question.id == models.QuestionTag.question_id
    ).join(
        models.QuestionLog,
        models.QuestionLog.question_id == models.Question.id
    ).filter(
        models.QuestionLog.user_id == user_id
    ).all()
    
    for tag_name, status in rows:
        tag_stats[tag_name]['total'] += 1
        if status == 'done':
            tag_stats[tag_name]['success'] += 1
        else:
            tag_stats[tag_name]['fail'] += 1
    
    # Calculate success rates and sort by lowest
    result = []
    for tag, stats in tag_stats.items():
        if stats['total'] > 0:
            success_rate = round((stats['success'] / stats['total']) * 100)
            result.append({
                'name': tag,
                'success_rate': success_rate,
                'total_attempts': stats['total'],
                'failed_attempts': stats['fail']
            })
    
    # Sort by lowest success rate (weakest topics first)
    result.sort(key=lambda x: x['success_rate'])
    
    # Return top 3 weakest topics
    return result[:3]


# 📊 Overall status count
@router.get("/stats/overview")
def stats_overview(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):

    result = db.query(
        models.QuestionLog.status,
        func.count(models.QuestionLog.id)
    ).filter(
        models.QuestionLog.user_id == user_id
    ).group_by(
        models.QuestionLog.status
    ).all()

    return {status: count for status, count in result}


# 📊 Weak tags (where you needed help or failed)
@router.get("/stats/tags")
def stats_by_tags(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):

    result = db.query(
        models.Tag.name,
        func.count(models.QuestionLog.id)
    ).join(
        models.QuestionTag,
        models.Tag.id == models.QuestionTag.tag_id
    ).join(
        models.Question,
        models.Question.id == models.QuestionTag.question_id
    ).join(
        models.QuestionLog,
        models.QuestionLog.question_id == models.Question.id
    ).filter(
        models.QuestionLog.user_id == user_id,
        models.QuestionLog.status.in_(["help", "fail"])
    ).group_by(
        models.Tag.name
    ).order_by(
        func.count(models.QuestionLog.id).desc()
    ).all()

    return {tag: count for tag, count in result}


# 📅 Daily activity heatmap - TIMEZONE AWARE VERSION
@router.get("/stats/heatmap")
def stats_heatmap(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # Get user's timezone
    user = db.query(models.User).filter(models.User.id == user_id).first()
    try:
        user_tz = pytz.timezone(user.timezone) if user and user.timezone else pytz.UTC
    except pytz.exceptions.UnknownTimeZoneError:
        user_tz = pytz.UTC

    # Get all question logs for this user
    logs = db.query(models.QuestionLog).filter(
        models.QuestionLog.user_id == user_id
    ).all()
    
    # Group by date in user's timezone
    date_counts = defaultdict(int)
    
    for log in logs:
        if log.timestamp:
            # Treat DB timestamp as UTC, convert to user's timezone
            utc_time = log.timestamp.replace(tzinfo=pytz.UTC)
            local_time = utc_time.astimezone(user_tz)
            date_key = local_time.date().isoformat()
            date_counts[date_key] += 1
    
    # Convert to list of dicts
    heatmap_data = [
        {
            "date": date_str,
            "count": count
        }
        for date_str, count in sorted(date_counts.items())
    ]
    
    logger.debug(f"Heatmap data for user {user_id}: {len(heatmap_data)} entries")
    
    return heatmap_data