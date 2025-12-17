from django.utils import timezone
from django.db import models
from django.db.models import JSONField # Import JSONField
from django.core.exceptions import ValidationError
from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.hashers import make_password, check_password
try:
    from django.contrib.postgres.search import SearchVectorField
    from django.contrib.postgres.indexes import GinIndex
    from django.contrib.postgres.fields import ArrayField
    POSTGRES_AVAILABLE = True
except ImportError:
    # Fallback for non-PostgreSQL databases
    SearchVectorField = models.TextField
    GinIndex = models.Index
    ArrayField = models.TextField
    POSTGRES_AVAILABLE = False
import uuid
import base64
import io
from PIL import Image

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.password = make_password(password) # Hash password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)
TITLE_CHOICES = (
    ('Mr.', 'Mr.'),
    ('Mrs.', 'Mrs.'),
    ('Ms.', 'Ms.'),
    ('Dr.', 'Dr.'),
    ('Prof.', 'Prof.'),
    ('Sir', 'Sir'),
    ('Madam', 'Madam'),
)
class CustomUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128) # Store hashed password
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    
    title = models.CharField(max_length=10, choices=TITLE_CHOICES, blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    
    USER_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('normal', 'Normal'),
        ('guest', 'Guest'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='normal')

    # PostgreSQL-specific enhancements
    preferences = JSONField(default=dict, blank=True)  # JSONB preferences storage
    avatar_base64 = models.TextField(blank=True, null=True)  # Base64 avatar storage
    location = models.CharField(max_length=200, blank=True, null=True)  # Simplified location
    timezone = models.CharField(max_length=50, blank=True, null=True)

    ip_address = models.GenericIPAddressField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    last_active = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)  # Add last_login field for JWT compatibility

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False) # Added is_superuser field
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager() # Use custom manager

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def has_perm(self, perm, obj=None):
        return self.is_superuser # Simplified for custom model

    def has_module_perms(self, app_label):
        return self.is_superuser # Simplified for custom model

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

    def set_avatar_from_image(self, image_file):
        """Convert uploaded image to base64 and store"""
        try:
            # Open and process the image
            img = Image.open(image_file)
            
            # Resize image to reasonable size (max 200x200)
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Save to bytes
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            
            # Convert to base64
            img_str = base64.b64encode(buffer.getvalue()).decode()
            self.avatar_base64 = f"data:image/jpeg;base64,{img_str}"
            
        except Exception as e:
            raise ValidationError(f"Error processing avatar image: {str(e)}")

    class Meta:
        indexes = [
            GinIndex(fields=['preferences']) if POSTGRES_AVAILABLE else models.Index(fields=['id']),  # PostgreSQL GIN index for JSONB
        ]
class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def clean(self):
        """Validate and sanitize category fields"""
        from .utils.input_validation import InputValidator
        
        if self.name:
            # Validate and sanitize name
            if InputValidator.is_malicious_input(self.name):
                raise ValidationError({'name': 'Invalid category name detected'})
            self.name = InputValidator.sanitize_text(self.name, allow_html=False)
        
        if self.description:
            # Validate and sanitize description
            if InputValidator.is_malicious_input(self.description):
                raise ValidationError({'description': 'Invalid description detected'})
            self.description = InputValidator.sanitize_text(self.description, allow_html=True)

    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True) # Added created_at field

    def clean(self):
        """Validate and sanitize tag fields"""
        from .utils.input_validation import InputValidator
        
        if self.name:
            # Validate and sanitize name
            if InputValidator.is_malicious_input(self.name):
                raise ValidationError({'name': 'Invalid tag name detected'})
            self.name = InputValidator.sanitize_text(self.name, allow_html=False)

    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Article(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True, null=True)
    excerpt = models.TextField(blank=True, null=True)
    content = models.TextField()
    
    # PostgreSQL full-text search
    content_vector = SearchVectorField(null=True, blank=True)
    
    # Base64 image storage for embedded images
    image_base64 = models.TextField(blank=True, null=True)
    image = models.TextField(blank=True, null=True, default='/logo.png')  # Keep for backward compatibility
    
    readTime = models.CharField(max_length=50, blank=True, null=True)
    read_time = models.IntegerField(blank=True, null=True)  # Read time in minutes
    
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='articles')
    authors = models.ManyToManyField(CustomUser, related_name='co_authored_articles', blank=True)  # Multi-author support
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    featured = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    
    # Scheduling support
    scheduled_publish = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Auto-generate slug if not provided
        if not self.slug:
            from .utils.input_validation import InputValidator
            self.slug = InputValidator.generate_safe_slug(self.title)
            
        # Ensure slug is unique
        if self.slug:
            original_slug = self.slug
            counter = 1
            while Article.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{original_slug}-{counter}"
                counter += 1
            
        # Auto-publish if scheduled time has passed
        if self.scheduled_publish and timezone.now() >= self.scheduled_publish and self.status == 'draft':
            self.status = 'published'
            self.published_at = timezone.now()
            
        super().save(*args, **kwargs)

    def set_image_from_file(self, image_file):
        """Convert uploaded image to base64 and store"""
        try:
            # Open and process the image
            img = Image.open(image_file)
            
            # Resize image to reasonable size (max 800x600)
            img.thumbnail((800, 600), Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Save to bytes
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            
            # Convert to base64
            img_str = base64.b64encode(buffer.getvalue()).decode()
            self.image_base64 = f"data:image/jpeg;base64,{img_str}"
            
        except Exception as e:
            raise ValidationError(f"Error processing article image: {str(e)}")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            GinIndex(fields=['content_vector']) if POSTGRES_AVAILABLE else models.Index(fields=['id']),  # Full-text search index
            models.Index(fields=['status', '-published_at']),  # Published articles index
            models.Index(fields=['featured', '-created_at']),  # Featured articles index
        ]

    def __str__(self):
        return self.title

class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='comments', null=True, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    
    # PostgreSQL full-text search for comments
    content_vector = SearchVectorField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    
    # Enhanced moderation features
    approved = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False)
    moderation_notes = models.TextField(blank=True, default='')
    moderated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_comments')
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate comment threading constraints and input security"""
        from .utils.input_validation import InputValidator
        
        # Validate and sanitize content
        if self.content:
            if InputValidator.is_malicious_input(self.content):
                raise ValidationError({'content': 'Invalid comment content detected'})
            self.content = InputValidator.sanitize_text(self.content, allow_html=True)
        
        if self.parent:
            # Prevent deep nesting (max 3 levels)
            depth = 0
            current = self.parent
            while current and depth < 5:  # Safety limit
                if current.parent:
                    depth += 1
                    current = current.parent
                else:
                    break
            
            if depth >= 3:
                raise ValidationError("Comments cannot be nested more than 3 levels deep")
            
            # Ensure parent comment belongs to the same article
            if self.parent.article != self.article:
                raise ValidationError("Parent comment must belong to the same article")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['created_at']
        indexes = [
            GinIndex(fields=['content_vector']) if POSTGRES_AVAILABLE else models.Index(fields=['id']),  # Full-text search index
            models.Index(fields=['article', 'parent', 'created_at']),  # Threading index
            models.Index(fields=['approved', 'is_flagged', 'created_at']),  # Moderation index
        ]

    def __str__(self):
        return f'Comment by {self.author} on {self.article}'

class ContactInfo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    social_media_links = JSONField(default=dict, blank=True) # New JSONField for social media links

    class Meta:
        verbose_name = "Contact Information"
        verbose_name_plural = "Contact Information"

    def __str__(self):
        return "Site Contact Information"

    def save(self, *args, **kwargs):
        # Ensure that there's only one instance of ContactInfo
        if not self.pk and ContactInfo.objects.exists():
            raise ValidationError('There can be only one ContactInfo instance.')
        return super(ContactInfo, self).save(*args, **kwargs)

class VisitorCount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Visitor Count"
        verbose_name_plural = "Visitor Counts"

    def __str__(self):
        return f"Total Visitors: {self.count}"

    def save(self, *args, **kwargs):
        # Ensure that there's only one instance of VisitorCount
        if not self.pk and VisitorCount.objects.exists():
            raise ValidationError('There can be only one VisitorCount instance.')
        return super(VisitorCount, self).save(*args, **kwargs)

class Visit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(default=timezone.now, unique=True)
    count = models.PositiveIntegerField(default=1) # Count for the day

    def __str__(self):
        return f"Visit on {self.date}: {self.count}"

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Feedback"
        verbose_name_plural = "Feedback"

    def __str__(self):
        return f"Feedback from {self.name} ({self.email})"


class Analytics(models.Model):
    """Model for tracking blog analytics and metrics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Metrics tracking
    metric_type = models.CharField(max_length=50)  # 'page_view', 'article_view', 'user_action', etc.
    metric_value = models.JSONField(default=dict)  # Flexible metric data storage
    
    # Associated objects (optional)
    article = models.ForeignKey(Article, on_delete=models.CASCADE, null=True, blank=True, related_name='analytics')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True, related_name='analytics')
    
    # Request metadata
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    referrer = models.URLField(blank=True, null=True)
    
    # Timing
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', '-timestamp']),
            models.Index(fields=['article', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            GinIndex(fields=['metric_value']) if POSTGRES_AVAILABLE else models.Index(fields=['id']),  # PostgreSQL GIN index for JSONB
        ]
        verbose_name_plural = "Analytics"

    def __str__(self):
        return f"{self.metric_type} - {self.timestamp}"


class ArticleRevision(models.Model):
    """Model for tracking article revision history"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Associated article
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='revisions')
    
    # Revision metadata
    revision_number = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    content = models.TextField()
    excerpt = models.TextField(blank=True, null=True)
    
    # Change tracking
    changed_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='article_revisions')
    change_summary = models.CharField(max_length=500, blank=True, null=True)
    change_type = models.CharField(max_length=50, default='edit')  # 'create', 'edit', 'publish', 'archive'
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Metadata snapshot
    metadata_snapshot = models.JSONField(default=dict)  # Store category, tags, status at time of revision
    
    class Meta:
        ordering = ['-revision_number']
        unique_together = ['article', 'revision_number']
        indexes = [
            models.Index(fields=['article', '-revision_number']),
            models.Index(fields=['changed_by', '-created_at']),
            models.Index(fields=['change_type', '-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.revision_number:
            # Auto-increment revision number
            last_revision = ArticleRevision.objects.filter(article=self.article).order_by('-revision_number').first()
            self.revision_number = (last_revision.revision_number + 1) if last_revision else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.article.title} - Revision {self.revision_number}"