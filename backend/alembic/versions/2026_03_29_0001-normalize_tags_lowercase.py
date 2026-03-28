"""normalize_tags_to_lowercase

Revision ID: normalize_tags_lowercase
Revises: set_default_reminder_time
Create Date: 2026-03-29 01:43:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'normalize_tags_lowercase'
down_revision: Union[str, Sequence[str], None] = 'set_default_reminder_time'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Normalize all tag names to lowercase and merge duplicates.

    For example, if both 'Array' (id=1) and 'array' (id=2) exist:
      1. Re-point question_tags from id=2 to id=1 (skip if already linked)
      2. Delete orphaned question_tags for id=2
      3. Delete tag id=2
      4. Rename tag id=1 from 'Array' to 'array'
    """
    conn = op.get_bind()

    tags = conn.execute(sa.text("SELECT id, name FROM tags ORDER BY id")).fetchall()

    # Group tags by lowercase form: lowercase -> [(id, original_name), ...]
    groups = {}
    for tag_id, name in tags:
        key = name.strip().lower()
        groups.setdefault(key, []).append((tag_id, name))

    for lower_name, entries in groups.items():
        if len(entries) == 1:
            tag_id, original_name = entries[0]
            if original_name != lower_name:
                conn.execute(
                    sa.text("UPDATE tags SET name = :new_name WHERE id = :tag_id"),
                    {"new_name": lower_name, "tag_id": tag_id},
                )
        else:
            # Multiple tags map to same lowercase — merge into the first (lowest id)
            canonical_id = entries[0][0]
            canonical_name = entries[0][1]
            duplicates = entries[1:]

            # Rename canonical to lowercase if needed
            if canonical_name != lower_name:
                conn.execute(
                    sa.text("UPDATE tags SET name = :new_name WHERE id = :tag_id"),
                    {"new_name": lower_name, "tag_id": canonical_id},
                )

            for dup_id, dup_name in duplicates:
                # Get all question links for this duplicate tag
                links = conn.execute(
                    sa.text("SELECT question_id FROM question_tags WHERE tag_id = :dup_id"),
                    {"dup_id": dup_id},
                ).fetchall()

                for (question_id,) in links:
                    # Check if question already linked to canonical tag
                    existing = conn.execute(
                        sa.text(
                            "SELECT 1 FROM question_tags "
                            "WHERE question_id = :qid AND tag_id = :canonical_id"
                        ),
                        {"qid": question_id, "canonical_id": canonical_id},
                    ).fetchone()

                    if existing:
                        # Already linked via canonical — just drop the duplicate link
                        conn.execute(
                            sa.text(
                                "DELETE FROM question_tags "
                                "WHERE question_id = :qid AND tag_id = :dup_id"
                            ),
                            {"qid": question_id, "dup_id": dup_id},
                        )
                    else:
                        # Re-point to canonical
                        conn.execute(
                            sa.text(
                                "UPDATE question_tags SET tag_id = :canonical_id "
                                "WHERE question_id = :qid AND tag_id = :dup_id"
                            ),
                            {"canonical_id": canonical_id, "qid": question_id, "dup_id": dup_id},
                        )

                # Delete the orphaned duplicate tag
                conn.execute(
                    sa.text("DELETE FROM tags WHERE id = :dup_id"),
                    {"dup_id": dup_id},
                )


def downgrade() -> None:
    """No-op: tag case information is lost after normalization, cannot be reversed."""
    pass
