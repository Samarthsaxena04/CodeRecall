from sqlalchemy import Column, Integer, String, Text, Boolean, Date, Time, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.sql import func



class User(Base):
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
