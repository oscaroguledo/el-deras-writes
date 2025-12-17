"""
Migration to add performance optimization indexes.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0004_alter_comment_moderation_notes'),
    ]

    operations = [
        # Add performance indexes for common queries
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_article_status_published ON blog_article (status, published_at DESC) WHERE status = 'published';",
            reverse_sql="DROP INDEX IF EXISTS idx_article_status_published;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_article_views_desc ON blog_article (views DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_article_views_desc;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_article_likes_desc ON blog_article (likes DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_article_likes_desc;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_comment_approved_created ON blog_comment (approved, created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_comment_approved_created;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_user_active_joined ON blog_customuser (is_active, date_joined DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_user_active_joined;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_analytics_type_timestamp ON blog_analytics (metric_type, timestamp DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_analytics_type_timestamp;"
        ),
    ]