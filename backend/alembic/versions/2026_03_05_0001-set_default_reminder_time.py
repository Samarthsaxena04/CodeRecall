"""set_default_reminder_time

Revision ID: set_default_reminder_time
Revises: add_reminder_intervals
Create Date: 2026-03-05 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'set_default_reminder_time'
down_revision: Union[str, Sequence[str], None] = 'add_reminder_intervals'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set default reminder time of 09:00 for existing users with no reminder time set,
    and add server_default so new rows also get 09:00 by default."""
    # Backfill existing NULL rows
    op.execute("UPDATE users SET email_reminder_time = '09:00:00' WHERE email_reminder_time IS NULL")
    # Set column server_default for future rows
    op.alter_column(
        'users',
        'email_reminder_time',
        existing_type=sa.Time(),
        server_default='09:00:00',
        nullable=False
    )


def downgrade() -> None:
    """Revert: remove server_default and allow NULL again."""
    op.alter_column(
        'users',
        'email_reminder_time',
        existing_type=sa.Time(),
        server_default=None,
        nullable=True
    )
