"""Baseline: the schema the Django backend created.

Creates only tables that are missing, so it is a no-op on a database that already has them.
The table definitions are frozen here (not imported from models) so later revisions can alter them.

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def _tables() -> sa.MetaData:
    md = sa.MetaData()
    tz = sa.DateTime(timezone=True)
    pk = lambda: sa.Column("id", sa.Uuid, primary_key=True)  # noqa: E731

    sa.Table(
        "users", md, pk(),
        sa.Column("username", sa.String(150), nullable=False, unique=True, index=True),
        sa.Column("email", sa.String(254), nullable=False, unique=True, index=True),
        sa.Column("password", sa.String(128), nullable=False),
        sa.Column("first_name", sa.String(30), nullable=False),
        sa.Column("last_name", sa.String(150), nullable=False),
        sa.Column("bio", sa.Text, nullable=False),
        sa.Column("user_type", sa.String(10), nullable=False, index=True),
        sa.Column("is_staff", sa.Boolean, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, index=True),
        sa.Column("is_superuser", sa.Boolean, nullable=False),
        sa.Column("date_joined", tz, nullable=False, index=True),
        sa.Column("last_login", tz),
    )
    sa.Table(
        "categories", md, pk(),
        sa.Column("name", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text, nullable=False),
    )
    sa.Table(
        "tags", md, pk(),
        sa.Column("name", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("created_at", tz, nullable=False, index=True),
    )
    sa.Table(
        "articles", md, pk(),
        sa.Column("title", sa.String(200), nullable=False, index=True),
        sa.Column("slug", sa.String(200), nullable=False, unique=True, index=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("excerpt", sa.Text, nullable=False),
        sa.Column("image", sa.String(200)),
        sa.Column("readTime", sa.Integer, nullable=False),
        sa.Column("author_id", sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category_id", sa.ForeignKey("categories.id"), nullable=False, index=True),
        sa.Column("status", sa.String(10), nullable=False, index=True),
        sa.Column("featured", sa.Boolean, nullable=False, index=True),
        sa.Column("views", sa.Integer, nullable=False),
        sa.Column("created_at", tz, nullable=False, index=True),
        sa.Column("updated_at", tz, nullable=False),
        sa.Column("published_at", tz, index=True),
    )
    sa.Table(
        "articles_tags", md,
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer, "sqlite"), primary_key=True,
                  autoincrement=True),
        sa.Column("article_id", sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag_id", sa.ForeignKey("tags.id", ondelete="CASCADE"), nullable=False),
    )
    sa.Table(
        "comments", md, pk(),
        sa.Column("article_id", sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("author_id", sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("parent_id", sa.ForeignKey("comments.id", ondelete="CASCADE"), index=True),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("approved", sa.Boolean, nullable=False, index=True),
        sa.Column("is_flagged", sa.Boolean, nullable=False),
        sa.Column("created_at", tz, nullable=False, index=True),
        sa.Column("updated_at", tz, nullable=False),
    )
    sa.Table(
        "contact_info", md, pk(),
        sa.Column("address", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("social_media_links", sa.JSON, nullable=False),
    )
    sa.Table("visitor_counts", md, pk(), sa.Column("count", sa.Integer, nullable=False))
    sa.Table(
        "visits", md, pk(),
        sa.Column("date", sa.Date, nullable=False, unique=True, index=True),
        sa.Column("count", sa.Integer, nullable=False),
    )
    sa.Table(
        "feedback", md, pk(),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("created_at", tz, nullable=False, index=True),
    )
    return md


def upgrade() -> None:
    _tables().create_all(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    pass  # never drop a content database from a baseline revision
