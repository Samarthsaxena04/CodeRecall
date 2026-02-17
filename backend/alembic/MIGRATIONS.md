# Database Migrations with Alembic

This project uses Alembic for database migrations, providing version control for your database schema.

## Quick Start

### Apply All Migrations
```bash
alembic upgrade head
```

### Create a New Migration
After modifying your models in `models.py`:
```bash
alembic revision --autogenerate -m "description of changes"
```

### View Current Migration Status
```bash
alembic current
```

### View Migration History
```bash
alembic history --verbose
```

## Common Commands

### Upgrade Database
```bash
# Upgrade to the latest version
alembic upgrade head

# Upgrade one version forward
alembic upgrade +1

# Upgrade to a specific revision
alembic upgrade <revision_id>
```

### Downgrade Database
```bash
# Downgrade one version back
alembic downgrade -1

# Downgrade to a specific revision
alembic downgrade <revision_id>

# Downgrade all the way back
alembic downgrade base
```

### Create Migrations
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add user avatar field"

# Create empty migration file (manual changes)
alembic revision -m "custom data migration"
```

## Migration Workflow

1. **Make Changes to Models** (`models.py`)
   ```python
   class User(Base):
       __tablename__ = "users"
       id = Column(Integer, primary_key=True)
       email = Column(String, unique=True)
       avatar = Column(String)  # New field
   ```

2. **Generate Migration**
   ```bash
   alembic revision --autogenerate -m "add avatar to users"
   ```

3. **Review the Generated Migration**
   - Check the file in `alembic/versions/`
   - Verify the upgrade and downgrade functions
   - Make manual adjustments if needed

4. **Apply Migration**
   ```bash
   alembic upgrade head
   ```

## Best Practices

1. **Always Review Auto-Generated Migrations**
   - Alembic can't detect everything (e.g., table renames, data migrations)
   - Check the generated file before applying

2. **One Logical Change Per Migration**
   - Keep migrations focused and atomic
   - Easier to debug and rollback

3. **Test Migrations on Development First**
   - Apply to dev database first
   - Test both upgrade and downgrade paths

4. **Never Edit Applied Migrations**
   - Once a migration is in production, create a new migration
   - Editing old migrations breaks version history

5. **Include Data Migrations When Needed**
   - For complex changes, add data migration code
   - Use `op.execute()` for custom SQL

## Configuration

- **alembic.ini**: Main configuration file
- **alembic/env.py**: Environment setup (loads DATABASE_URL from .env)
- **alembic/versions/**: Generated migration files

## Troubleshooting

### Migration Not Detecting Changes
- Ensure models are imported in `env.py`
- Check that `target_metadata = Base.metadata` is set
- Verify database connection string in `.env`

### Migration Conflicts
```bash
# View current state
alembic current

# View history
alembic history

# If needed, stamp database to specific revision
alembic stamp head
```

### Fresh Database Setup
```bash
# For a brand new database
alembic upgrade head

# This applies all migrations from scratch
```

## Example: Custom Data Migration

```python
"""add default role to existing users

Revision ID: abc123
"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Schema changes
    op.add_column('users', sa.Column('role', sa.String(), nullable=True))
    
    # Data migration
    op.execute("UPDATE users SET role = 'user' WHERE role IS NULL")
    
    # Make column non-nullable after data migration
    op.alter_column('users', 'role', nullable=False)


def downgrade() -> None:
    op.drop_column('users', 'role')
```

## Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Auto Generate Documentation](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
- [Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
