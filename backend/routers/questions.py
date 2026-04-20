from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, case, or_
from datetime import date, timedelta, datetime
import logging

import models
from schemas import QuestionCreate
from deps import get_current_user, get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/questions")
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    new_question = models.Question(
        user_id=user_id,
        title=question.title,
        link=str(question.link),
        platform=question.platform,
        notes=question.notes
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    for tag_name in question.tags:
        tag_name = tag_name.strip().lower()
        if not tag_name:
            continue

        tag = db.query(models.Tag).filter(func.lower(models.Tag.name) == tag_name).first()
        if not tag:
            tag = models.Tag(name=tag_name)
            db.add(tag)
            db.commit()
            db.refresh(tag)

        question_tag = models.QuestionTag(
            question_id=new_question.id,
            tag_id=tag.id
        )
        db.add(question_tag)

    log = models.QuestionLog(
        question_id=new_question.id,
        user_id=user_id,
        status=question.status,
        is_revision=False
    )
    db.add(log)
    
    logger.info(f"Added question log for user {user_id}, question {new_question.id}")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    days_done = user.reminder_days_done if user and isinstance(user.reminder_days_done, int) else 12
    days_help = user.reminder_days_help if user and isinstance(user.reminder_days_help, int) else 5
    days_fail = user.reminder_days_fail if user and isinstance(user.reminder_days_fail, int) else 3

    if question.status == "done":
        days_until_review = days_done
    elif question.status == "help":
        days_until_review = days_help
    else:
        days_until_review = days_fail
    
    schedule = models.Schedule(
        question_id=new_question.id,
        user_id=user_id,
        next_review_date=date.today() + timedelta(days=days_until_review)
    )
    db.add(schedule)

    db.commit()

    return {"message": "Question added and scheduled successfully"}


@router.get("/questions/all")
def get_all_questions(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):

    questions = db.query(models.Question).filter(
        models.Question.user_id == user_id
    ).order_by(models.Question.created_at.desc()).limit(500).all()

    result = []
    for q in questions:
        result.append({
            "id": q.id,
            "title": q.title,
            "link": q.link,
            "platform": q.platform,
            "notes": q.notes,
            "created_at": q.created_at,
            "tags": [tag.name for tag in q.tags]
        })

    return result


@router.get("/questions/history")
def get_history_questions(
    search: str = Query("", max_length=200),
    mastery_level: str = Query("all", pattern="^(all|low|medium|high)$"),
    tag: str = Query("all", max_length=100),
    sort: str = Query("last_reviewed_desc", pattern="^(last_reviewed_desc|last_reviewed_asc|mastery_desc|mastery_asc|created_desc|created_asc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    done_count = func.coalesce(
        func.sum(case((models.QuestionLog.status == "done", 1), else_=0)),
        0,
    )

    logs_agg = (
        db.query(
            models.QuestionLog.question_id.label("question_id"),
            func.max(models.QuestionLog.timestamp).label("last_reviewed_at"),
            func.count(models.QuestionLog.id).label("total_reviews"),
            done_count.label("done_reviews"),
        )
        .filter(models.QuestionLog.user_id == user_id)
        .group_by(models.QuestionLog.question_id)
        .subquery()
    )

    total_reviews = func.coalesce(logs_agg.c.total_reviews, 0)
    done_reviews = func.coalesce(logs_agg.c.done_reviews, 0)

    mastery_expr = case(
        (total_reviews > 0, (done_reviews * 100.0) / total_reviews),
        else_=0.0,
    )

    query = (
        db.query(
            models.Question,
            logs_agg.c.last_reviewed_at,
            mastery_expr.label("mastery_percent"),
        )
        .outerjoin(logs_agg, logs_agg.c.question_id == models.Question.id)
        .filter(models.Question.user_id == user_id)
        .options(selectinload(models.Question.tags))
    )

    if search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Question.title.ilike(search_term),
                models.Question.notes.ilike(search_term),
                models.Question.platform.ilike(search_term),
            )
        )

    if tag != "all":
        query = query.filter(models.Question.tags.any(func.lower(models.Tag.name) == tag.lower()))

    if mastery_level == "low":
        query = query.filter(mastery_expr < 40)
    elif mastery_level == "medium":
        query = query.filter(mastery_expr >= 40, mastery_expr < 80)
    elif mastery_level == "high":
        query = query.filter(mastery_expr >= 80)

    if sort == "mastery_desc":
        query = query.order_by(mastery_expr.desc(), models.Question.created_at.desc())
    elif sort == "mastery_asc":
        query = query.order_by(mastery_expr.asc(), models.Question.created_at.desc())
    elif sort == "last_reviewed_asc":
        query = query.order_by(logs_agg.c.last_reviewed_at.asc().nullsfirst(), models.Question.created_at.desc())
    elif sort == "created_asc":
        query = query.order_by(models.Question.created_at.asc())
    elif sort == "created_desc":
        query = query.order_by(models.Question.created_at.desc())
    else:
        query = query.order_by(logs_agg.c.last_reviewed_at.desc().nullslast(), models.Question.created_at.desc())

    total = query.order_by(None).count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    safe_page = min(page, total_pages)

    rows = (
        query.offset((safe_page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    available_tags = (
        db.query(models.Tag.name)
        .join(models.QuestionTag, models.Tag.id == models.QuestionTag.tag_id)
        .join(models.Question, models.Question.id == models.QuestionTag.question_id)
        .filter(models.Question.user_id == user_id)
        .distinct()
        .order_by(models.Tag.name.asc())
        .all()
    )

    items = []
    for question, last_reviewed_at, mastery_percent in rows:
        items.append(
            {
                "id": question.id,
                "title": question.title,
                "preview": (question.notes or "")[:120],
                "notes": question.notes or "",
                "link": question.link,
                "platform": question.platform,
                "tags": [t.name for t in question.tags],
                "mastery_percent": int(round(float(mastery_percent or 0))),
                "last_reviewed_at": last_reviewed_at.isoformat() if last_reviewed_at else None,
                "created_at": question.created_at.isoformat() if question.created_at else None,
            }
        )

    return {
        "items": items,
        "page": safe_page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "available_tags": [row[0] for row in available_tags],
    }