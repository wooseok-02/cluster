"""change_embedding_column_bytea_to_jsonb

Revision ID: 24e6df638ad1
Revises: 
Create Date: 2026-05-08 18:09:35.439873

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24e6df638ad1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        'ALTER TABLE "PEOPLE" ALTER COLUMN embedding TYPE jsonb USING embedding::text::jsonb'
    )


def downgrade() -> None:
    op.execute(
        'ALTER TABLE "PEOPLE" ALTER COLUMN embedding TYPE bytea USING embedding::text::bytea'
    )
