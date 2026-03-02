from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from sqlalchemy import and_

import models
from deps import get_current_user, get_db
from schemas import RevisionUpdate

router = APIRouter()


@router.get("/questions/revise")
def get_questions_to_revise(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):

    today = date.today()

    # Eager-load the question and its tags in a single query
    schedules = db.query(models.Schedule).options(
        joinedload(models.Schedule.question).joinedload(models.Question.tags)
    ).filter(
        and_(
            models.Schedule.user_id == user_id,
            models.Schedule.next_review_date <= today
        )
    ).limit(10).all()

    result = []

    for sch in schedules:
        question = sch.question
        if not question:
            continue

        result.append({
            "question_id": question.id,
            "title": question.title,
            "link": question.link,
            "notes": question.notes,
            "platform": question.platform,
            "tags": [tag.name for tag in question.tags]
        })

    return result


@router.post("/questions/{question_id}/revise")
def revise_question(
    question_id: int,
    revision: RevisionUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    schedule = db.query(models.Schedule).filter(
        models.Schedule.question_id == question_id,
        models.Schedule.user_id == user_id
    ).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Get user's custom intervals (fallback to defaults)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    days_done = user.reminder_days_done if user and user.reminder_days_done is not None else 12
    days_help = user.reminder_days_help if user and user.reminder_days_help is not None else 5
    days_fail = user.reminder_days_fail if user and user.reminder_days_fail is not None else 3

    if revision.status == "done":
        next_date = date.today() + timedelta(days=days_done)
    elif revision.status == "help":
        next_date = date.today() + timedelta(days=days_help)
    else:
        next_date = date.today() + timedelta(days=days_fail)

    schedule.next_review_date = next_date

    log = models.QuestionLog(
        question_id=question_id,
        user_id=user_id,
        status=revision.status,
        is_revision=True
    )
    db.add(log)
    db.commit()

    return {"message": "Revision recorded", "next_review": str(next_date)}