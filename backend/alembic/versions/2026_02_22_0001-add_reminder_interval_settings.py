"""add_reminder_interval_settings

Revision ID: add_reminder_intervals
Revises: f7b08431784c
Create Date: 2026-02-22 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_reminder_intervals'
down_revision: Union[str, Sequence[str], None] = 'f7b08431784c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add custom spaced repetition interval columns to users table."""
    op.add_column('users', sa.Column('reminder_days_done', sa.Integer(), nullable=True, server_default='12'))
    op.add_column('users', sa.Column('reminder_days_help', sa.Integer(), nullable=True, server_default='5'))
    op.add_column('users', sa.Column('reminder_days_fail', sa.Integer(), nullable=True, server_default='3'))


def downgrade() -> None:
    """Remove custom spaced repetition interval columns."""
    op.drop_column('users', 'reminder_days_fail')
    op.drop_column('users', 'reminder_days_help')
    op.drop_column('users', 'reminder_days_done')
