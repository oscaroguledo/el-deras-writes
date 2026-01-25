from django.db import models
from ..utils.uuid_utils import uuid7


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    article = models.ForeignKey('blog.Article', on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('blog.CustomUser', on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True)
    content = models.TextField()
    
    approved = models.BooleanField(default=False, db_index=True)
    is_flagged = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['article', 'approved'], name='comments_article_approved_idx'),
            models.Index(fields=['author'], name='comments_author_idx'),
            models.Index(fields=['parent'], name='comments_parent_idx'),
            models.Index(fields=['created_at'], name='comments_created_idx'),
        ]

    def __str__(self):
        author_name = self.author.username if self.author else 'Anonymous'
        return f'Comment by {author_name} on {self.article.title}'