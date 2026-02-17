from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

# Azure PostgreSQL Flexible Server configuration
# Append sslmode=require if not already present in the URL
if "sslmode" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Connection pool settings sized for Azure tiers:
# - PostgreSQL Flexible Server B1MS: max ~50 connections
# - App Service F1: limited resources (1 worker)
if ENVIRONMENT == "production":
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,  # Recycle connections every 30 min (Azure idle timeout)
        pool_pre_ping=True,  # Verify connections before use
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()