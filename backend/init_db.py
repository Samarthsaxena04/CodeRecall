

from database import engine, Base
import models


def init_database():

    print("WARNING: Using Base.metadata.create_all() is deprecated.")
    print("Please use 'alembic upgrade head' for proper migration management.")
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_database()
    print("Database tables created successfully!")
    print("\nFor future schema changes, use Alembic:")
    print("  - Apply migrations: alembic upgrade head")
    print("  - Create new migration: alembic revision --autogenerate -m 'description'")
