"""add_email_notification_settings

Revision ID: add_email_settings
Revises: df587bddb579
Create Date: 2026-02-12 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_email_settings'
down_revision: Union[str, Sequence[str], None] = 'df587bddb579'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add email notification columns to users table
    op.add_column('users', sa.Column('email_notifications_enabled', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('users', sa.Column('email_reminder_time', sa.Time(), nullable=True))
    op.add_column('users', sa.Column('timezone', sa.String(), nullable=True, server_default='UTC'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'timezone')
    op.drop_column('users', 'email_reminder_time')
    op.drop_column('users', 'email_notifications_enabled')
