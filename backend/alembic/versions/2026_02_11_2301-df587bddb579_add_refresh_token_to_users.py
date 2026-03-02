"""add_refresh_token_to_users

Revision ID: df587bddb579
Revises: 965b65736522
Create Date: 2026-02-11 23:01:37.371180

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'df587bddb579'
down_revision: Union[str, Sequence[str], None] = '965b65736522'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('refresh_token', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'refresh_token')
