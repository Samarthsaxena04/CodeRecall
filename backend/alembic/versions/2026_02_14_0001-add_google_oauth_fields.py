"""add_google_oauth_fields

Revision ID: add_google_oauth
Revises: add_email_settings
Create Date: 2026-02-14 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_google_oauth'
down_revision: Union[str, Sequence[str], None] = 'add_email_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Google OAuth fields to users table."""
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('users', sa.Column('signup_completed', sa.Boolean(), nullable=True, server_default='false'))
    
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
    
    # Mark all existing users as signup_completed (they registered the normal way)
    op.execute("UPDATE users SET signup_completed = true WHERE signup_completed IS NULL OR signup_completed = false")
    
    # Make password nullable for Google OAuth users who haven't completed signup
    op.alter_column('users', 'password', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    """Remove Google OAuth fields from users table."""
    op.alter_column('users', 'password', existing_type=sa.String(), nullable=False)
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    op.drop_column('users', 'signup_completed')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'google_id')
