from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Time, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func
from datetime import time



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, default="User")
    password = Column(String, nullable=True)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    

    google_id = Column(String, unique=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    signup_completed = Column(Boolean, default=False)


    email_notifications_enabled = Column(Boolean, default=True)
    email_reminder_time = Column(Time, default=time(9, 0))
    timezone = Column(String, default="UTC")

    reminder_days_done = Column(Integer, default=12)
    reminder_days_help = Column(Integer, default=5)
    reminder_days_fail = Column(Integer, default=3)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String)
    link = Column(Text)
    platform = Column(String)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    tags = relationship("Tag", secondary="question_tags", backref="questions", lazy="selectin")
    logs = relationship("QuestionLog", backref="question", lazy="selectin", cascade="all, delete-orphan")
    schedules = relationship("Schedule", backref="question", lazy="selectin", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags" 

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)


class QuestionTag(Base):
    __tablename__ = "question_tags"

    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


class QuestionLog(Base):
    __tablename__ = "question_logs"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    status = Column(String)
    is_revision = Column(Boolean)
    timestamp = Column(TIMESTAMP, server_default=func.now())


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    next_review_date = Column(Date)
