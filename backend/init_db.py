"""
Database initialization script.

DEPRECATED: Use Alembic migrations instead.
For initial setup or upgrades, use: alembic upgrade head
For new migrations, use: alembic revision --autogenerate -m "description"

This script is kept for backward compatibility but migrations are recommended.
"""

from database import engine, Base
import models


def init_database():
    """
    DEPRECATED: Use 'alembic upgrade head' instead.
    
    This creates all tables using SQLAlchemy metadata.
    Alembic migrations provide better version control and schema evolution.
    """
    print("WARNING: Using Base.metadata.create_all() is deprecated.")
    print("Please use 'alembic upgrade head' for proper migration management.")
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_database()
    print("Database tables created successfully!")
    print("\nFor future schema changes, use Alembic:")
    print("  - Apply migrations: alembic upgrade head")
    print("  - Create new migration: alembic revision --autogenerate -m 'description'")
