from django.utils import timezone
from django.db import models
from ..utils.uuid_utils import uuid7


class ContactInfo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    social_media_links = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'contact_info'
        verbose_name = "Contact Information"
        verbose_name_plural = "Contact Information"

    def __str__(self):
        return "Contact Information"


class VisitorCount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'visitor_counts'
        verbose_name = "Visitor Count"
        verbose_name_plural = "Visitor Counts"

    def __str__(self):
        return f"Total Visitors: {self.count}"


class Visit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    date = models.DateField(default=timezone.now, unique=True, db_index=True)
    count = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'visits'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date'], name='visits_date_idx'),
        ]

    def __str__(self):
        return f"Visit on {self.date}: {self.count}"


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at'], name='feedback_created_idx'),
            models.Index(fields=['email'], name='feedback_email_idx'),
        ]

    def __str__(self):
        return f"Feedback from {self.name}"