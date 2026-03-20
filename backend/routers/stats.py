from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, cast
from sqlalchemy import Date as sqlalchemy_date
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import pytz

import models
from deps import get_current_user, get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


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
    
    result.sort(key=lambda x: x['success_rate'])
    return result[:3]


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


@router.get("/stats/heatmap")
def stats_heatmap(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    user_tz_str = "UTC"
    timezone_value = getattr(user, "timezone", None)
    if isinstance(timezone_value, str) and timezone_value:
        try:
            pytz.timezone(timezone_value)   # validate — raises if unknown
            user_tz_str = timezone_value
        except pytz.exceptions.UnknownTimeZoneError:
            pass  # fall back to UTC

    # Previously: loaded ALL QuestionLog rows into Python, iterated, and
    # grouped manually — O(n) memory usage that grows with every log entry.
    #
    # Now: the entire GROUP BY happens inside PostgreSQL.
    # Python receives one small row per unique date — constant memory cost.
    #
    # func.timezone(tz, func.timezone('UTC', timestamp)):
    #   Step 1 — func.timezone('UTC', naive_ts)  → tells Postgres the stored
    #             timestamp is UTC, producing a timestamptz.
    #   Step 2 — func.timezone(user_tz_str, timestamptz) → converts to the
    #             user's local time before truncating to a date.
    rows = (
        db.query(
            cast(
                func.timezone(user_tz_str, func.timezone("UTC", models.QuestionLog.timestamp)),
                sqlalchemy_date
            ).label("date"),
            func.count(models.QuestionLog.id).label("count"),
        )
        .filter(models.QuestionLog.user_id == user_id)
        .group_by("date")
        .order_by("date")
        .all()
    )

    heatmap_data = [
        {"date": row.date.isoformat(), "count": row.count}
        for row in rows
    ]

    logger.debug(f"Heatmap data for user {user_id}: {len(heatmap_data)} entries")
    return heatmap_data