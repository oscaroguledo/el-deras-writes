"""Categories become a two-level section tree (slug, parent_id, sort_order, is_active).

Existing rows get a slug derived from their name. Safe to re-run: each column is added only if
missing.

Revision ID: 0002
Revises: 0001
"""
import re

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _slugify(text: str) -> str:
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", text.lower())).strip("-_") or "category"


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("categories")}

    with op.batch_alter_table("categories") as batch:
        if "slug" not in existing:
            batch.add_column(sa.Column("slug", sa.String(150), nullable=True))
        if "parent_id" not in existing:
            batch.add_column(sa.Column("parent_id", sa.Uuid, nullable=True))
            batch.create_foreign_key(
                "fk_categories_parent_id", "categories", ["parent_id"], ["id"], ondelete="SET NULL"
            )
            batch.create_index("ix_categories_parent_id", ["parent_id"])
        if "sort_order" not in existing:
            batch.add_column(sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"))
        if "is_active" not in existing:
            batch.add_column(sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()))

    if "slug" not in existing:
        categories = sa.table("categories", sa.column("id", sa.Uuid), sa.column("name"), sa.column("slug"))
        taken: set[str] = set()
        for row in bind.execute(sa.select(categories.c.id, categories.c.name).order_by(categories.c.name)):
            slug, n = _slugify(row.name), 1
            while slug in taken:
                slug, n = f"{_slugify(row.name)}-{n}", n + 1
            taken.add(slug)
            bind.execute(categories.update().where(categories.c.id == row.id).values(slug=slug))
        with op.batch_alter_table("categories") as batch:
            batch.alter_column("slug", existing_type=sa.String(150), nullable=False)
            batch.create_index("ix_categories_slug", ["slug"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("categories") as batch:
        batch.drop_index("ix_categories_slug")
        batch.drop_index("ix_categories_parent_id")
        batch.drop_constraint("fk_categories_parent_id", type_="foreignkey")
        for col in ("is_active", "sort_order", "parent_id", "slug"):
            batch.drop_column(col)
