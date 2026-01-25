from django.utils import timezone
from django.db import models
from django.utils.text import slugify
from ..utils.uuid_utils import uuid7


class Article(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid7, editable=False)
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True, db_index=True)
    content = models.TextField()
    excerpt = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True, help_text="URL to article image")
    readTime = models.PositiveIntegerField(default=0, help_text="Estimated read time in minutes")
    
    author = models.ForeignKey('blog.CustomUser', on_delete=models.CASCADE, related_name='articles')
    category = models.ForeignKey('blog.Category', on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField('blog.Tag', blank=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', db_index=True)
    featured = models.BooleanField(default=False, db_index=True)
    views = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = 'articles'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at'], name='articles_status_pub_idx'),
            models.Index(fields=['featured', 'status'], name='articles_featured_idx'),
            models.Index(fields=['author', 'status'], name='articles_author_idx'),
            models.Index(fields=['category'], name='articles_category_idx'),
            models.Index(fields=['created_at'], name='articles_created_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            
        # Make slug unique
        if self.slug:
            original_slug = self.slug
            counter = 1
            while Article.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
                
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title