from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
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
        tag_name = tag_name.strip()

        tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
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
    days_done = user.reminder_days_done if user and user.reminder_days_done is not None else 12
    days_help = user.reminder_days_help if user and user.reminder_days_help is not None else 5
    days_fail = user.reminder_days_fail if user and user.reminder_days_fail is not None else 3

    if question.status == "done":
        days_until_review = days_done
    elif question.status == "help":
        days_until_review = days_help
    else:  # fail
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
    # Tags are eagerly loaded via the relationship (lazy="selectin").
    # .limit(500) prevents a single user with thousands of questions from
    # loading everything into memory at once and crashing the server.
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