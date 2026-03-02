"""Initial migration

Revision ID: 965b65736522
Revises: 
Create Date: 2026-02-11 00:51:21.607840

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '965b65736522'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(op.f('ix_question_logs_id'), 'question_logs', ['id'], unique=False)
    op.drop_constraint(op.f('question_logs_question_id_fkey'), 'question_logs', type_='foreignkey')
    op.drop_constraint(op.f('question_logs_user_id_fkey'), 'question_logs', type_='foreignkey')
    op.create_foreign_key(None, 'question_logs', 'questions', ['question_id'], ['id'])
    op.create_foreign_key(None, 'question_logs', 'users', ['user_id'], ['id'])
    op.drop_constraint(op.f('question_tags_tag_id_fkey'), 'question_tags', type_='foreignkey')
    op.drop_constraint(op.f('question_tags_question_id_fkey'), 'question_tags', type_='foreignkey')
    op.create_foreign_key(None, 'question_tags', 'questions', ['question_id'], ['id'])
    op.create_foreign_key(None, 'question_tags', 'tags', ['tag_id'], ['id'])
    op.alter_column('questions', 'title',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
    op.drop_constraint(op.f('questions_user_id_fkey'), 'questions', type_='foreignkey')
    op.create_foreign_key(None, 'questions', 'users', ['user_id'], ['id'])
    op.create_index(op.f('ix_schedules_id'), 'schedules', ['id'], unique=False)
    op.drop_constraint(op.f('schedules_question_id_fkey'), 'schedules', type_='foreignkey')
    op.drop_constraint(op.f('schedules_user_id_fkey'), 'schedules', type_='foreignkey')
    op.create_foreign_key(None, 'schedules', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'schedules', 'questions', ['question_id'], ['id'])
    op.alter_column('tags', 'name',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.alter_column('users', 'password',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.drop_constraint(op.f('users_email_key'), 'users', type_='unique')
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.create_unique_constraint(op.f('users_email_key'), 'users', ['email'], postgresql_nulls_not_distinct=False)
    op.alter_column('users', 'password',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.alter_column('tags', 'name',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    op.drop_constraint(None, 'schedules', type_='foreignkey')
    op.drop_constraint(None, 'schedules', type_='foreignkey')
    op.create_foreign_key(op.f('schedules_user_id_fkey'), 'schedules', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('schedules_question_id_fkey'), 'schedules', 'questions', ['question_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_schedules_id'), table_name='schedules')
    op.drop_constraint(None, 'questions', type_='foreignkey')
    op.create_foreign_key(op.f('questions_user_id_fkey'), 'questions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.alter_column('questions', 'title',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
    op.drop_constraint(None, 'question_tags', type_='foreignkey')
    op.drop_constraint(None, 'question_tags', type_='foreignkey')
    op.create_foreign_key(op.f('question_tags_question_id_fkey'), 'question_tags', 'questions', ['question_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('question_tags_tag_id_fkey'), 'question_tags', 'tags', ['tag_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint(None, 'question_logs', type_='foreignkey')
    op.drop_constraint(None, 'question_logs', type_='foreignkey')
    op.create_foreign_key(op.f('question_logs_user_id_fkey'), 'question_logs', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(op.f('question_logs_question_id_fkey'), 'question_logs', 'questions', ['question_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_question_logs_id'), table_name='question_logs')
