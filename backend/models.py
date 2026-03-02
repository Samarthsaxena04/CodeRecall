from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Time, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func



class User(Base):#base is the declarative base from database.py that we use to define our models. It provides the necessary functionality to map our Python classes to database tables and manage the schema.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, default="User")
    password = Column(String, nullable=True)  # Nullable for Google signup before completion
    refresh_token = Column(Text, nullable=True)  # Store hashed refresh token
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Google OAuth fields
    google_id = Column(String, unique=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    signup_completed = Column(Boolean, default=False)  # False until user sets name + password

    # Email notification settings
    email_notifications_enabled = Column(Boolean, default=True)
    email_reminder_time = Column(Time, nullable=True)  # User's preferred reminder time (HH:MM)
    timezone = Column(String, default="UTC")

    # Custom spaced repetition intervals (in days)
    reminder_days_done = Column(Integer, default=12)  # Interval when solved
    reminder_days_help = Column(Integer, default=5)   # Interval when needed help
    reminder_days_fail = Column(Integer, default=3)   # Interval when failed


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String)
    link = Column(Text)
    platform = Column(String)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    tags = relationship("Tag", secondary="question_tags", backref="questions", lazy="selectin") #many-to-many relationship for categorizing questions (e.g., arrays, dynamic programming)
    logs = relationship("QuestionLog", backref="question", lazy="selectin", cascade="all, delete-orphan") #stores history of question status changes (solved, need help, failed) with timestamps
    schedules = relationship("Schedule", backref="question", lazy="selectin", cascade="all, delete-orphan") #stores next review dates for spaced repetition based on user feedback (solved, need help, failed)
    #selectin loading strategy for efficient querying of related tags, logs, and schedules when fetching questions. Cascade deletes to clean up related records when a question is removed.
    #delete-orphan ensures that when a question is deleted, all associated logs and schedules are also removed to maintain data integrity.

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


class Schedule(Base): #stores next review dates for spaced repetition based on user feedback (solved, need help, failed)
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    next_review_date = Column(Date)
