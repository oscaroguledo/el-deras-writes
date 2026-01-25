from django.db import models
from ..utils.uuid_utils import uuid7


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=50, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'tags'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name'], name='tags_name_idx'),
            models.Index(fields=['created_at'], name='tags_created_idx'),
        ]

    def __str__(self):
        return self.name