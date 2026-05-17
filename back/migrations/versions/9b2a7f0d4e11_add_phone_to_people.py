"""add_phone_to_people

Revision ID: 9b2a7f0d4e11
Revises: 0c74af5d7572
Create Date: 2026-05-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b2a7f0d4e11'
down_revision: Union[str, Sequence[str], None] = '0c74af5d7572'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_people_columns(inspector) -> list[str]:
    try:
        return [column["name"] for column in inspector.get_columns("PEOPLE")]
    except Exception:
        return [column["name"] for column in inspector.get_columns("people")]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = get_people_columns(inspector)
    if "phone" not in columns:
        op.add_column('PEOPLE', sa.Column('phone', sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = get_people_columns(inspector)
    if "phone" in columns:
        op.drop_column('PEOPLE', 'phone')
