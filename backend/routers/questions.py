from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import logging

import models
from schemas import QuestionCreate
from deps import get_current_user, get_db

logger = logging.getLogger(__name__)

router = APIRouter()


# ➕ Add Question
@router.post("/questions")
def add_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # 1️⃣ Create Question
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

    # 2️⃣ Add Tags (create if not exist)
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

    # 3️⃣ Add Question Log (timestamp is automatically set by database)
    log = models.QuestionLog(
        question_id=new_question.id,
        user_id=user_id,
        status=question.status,
        is_revision=False
        # timestamp will be auto-set by server_default=func.now()
    )
    db.add(log)
    
    logger.info(f"Added question log for user {user_id}, question {new_question.id}")

    # 4️⃣ Schedule First Revision based on status
    if question.status == "done":
        days_until_review = 12
    elif question.status == "help":
        days_until_review = 5
    else:  # fail
        days_until_review = 3
    
    schedule = models.Schedule(
        question_id=new_question.id,
        user_id=user_id,
        next_review_date=date.today() + timedelta(days=days_until_review)
    )
    db.add(schedule)

    db.commit()

    return {"message": "Question added and scheduled successfully"}


# 📋 Get All Questions
@router.get("/questions/all")
def get_all_questions(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    # Tags are eagerly loaded via the relationship (lazy="selectin")
    questions = db.query(models.Question).filter(
        models.Question.user_id == user_id
    ).order_by(models.Question.created_at.desc()).all()

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