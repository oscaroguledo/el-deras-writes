"""
Enhanced serializers for frontend integration with improved error handling
"""

from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Article, Comment, Category, Tag, CustomUser
from .utils.input_validation import InputValidator, validate_input_field
import json


class FrontendErrorMixin:
    """
    Mixin to provide enhanced error handling for frontend consumption
    """
    
    def to_internal_value(self, data):
        """
        Override to provide better error handling
        """
        try:
            return super().to_internal_value(data)
        except ValidationError as e:
            # Enhance validation errors with field-specific messages
            enhanced_errors = self.enhance_validation_errors(e.detail)
            raise ValidationError(enhanced_errors)
    
    def enhance_validation_errors(self, errors):
        """
        Enhance validation errors with more descriptive messages
        """
        if isinstance(errors, dict):
            enhanced = {}
            for field, field_errors in errors.items():
                enhanced[field] = self.enhance_field_errors(field, field_errors)
            return enhanced
        elif isinstance(errors, list):
            return [self.enhance_error_message(error) for error in errors]
        else:
            return self.enhance_error_message(errors)
    
    def enhance_field_errors(self, field_name, errors):
        """
        Enhance field-specific errors
        """
        if isinstance(errors, list):
            return [self.enhance_field_error_message(field_name, error) for error in errors]
        else:
            return [self.enhance_field_error_message(field_name, errors)]
    
    def enhance_field_error_message(self, field_name, error):
        """
        Enhance individual field error message
        """
        error_str = str(error)
        
        # Common error message enhancements
        if 'required' in error_str.lower():
            return f"{field_name.replace('_', ' ').title()} is required"
        elif 'blank' in error_str.lower():
            return f"{field_name.replace('_', ' ').title()} cannot be blank"
        elif 'unique' in error_str.lower():
            return f"This {field_name.replace('_', ' ')} already exists"
        elif 'invalid' in error_str.lower():
            return f"Please enter a valid {field_name.replace('_', ' ')}"
        elif 'max_length' in error_str.lower():
            return f"{field_name.replace('_', ' ').title()} is too long"
        elif 'min_length' in error_str.lower():
            return f"{field_name.replace('_', ' ').title()} is too short"
        else:
            return error_str
    
    def enhance_error_message(self, error):
        """
        Enhance general error message
        """
        return str(error)


class FrontendArticleSerializer(FrontendErrorMixin, serializers.ModelSerializer):
    """
    Enhanced article serializer for frontend with better error handling
    """
    author = serializers.StringRelatedField(read_only=True)
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    category = serializers.StringRelatedField(read_only=True)
    tags = serializers.StringRelatedField(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    # Frontend-specific fields
    reading_time = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'image_base64',
            'author', 'category', 'category_name', 'tags', 'tag_names',
            'status', 'featured', 'views', 'likes', 'scheduled_publish',
            'created_at', 'updated_at', 'published_at',
            'reading_time', 'is_liked_by_user', 'can_edit', 'can_delete'
        ]
        read_only_fields = ['id', 'slug', 'views', 'likes', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        """Enhanced title validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Article title is required and cannot be empty")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Article title must be at least 3 characters long")
        
        if len(value) > 255:
            raise serializers.ValidationError("Article title must be 255 characters or less")
        
        try:
            sanitized = validate_input_field(value, 'title')
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_content(self, value):
        """Enhanced content validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Article content is required and cannot be empty")
        
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Article content must be at least 10 characters long")
        
        try:
            sanitized = validate_input_field(value, 'content')
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_category_name(self, value):
        """Enhanced category name validation"""
        if value and len(value.strip()) > 100:
            raise serializers.ValidationError("Category name must be 100 characters or less")
        
        if value:
            try:
                sanitized = validate_input_field(value, 'text')
                return sanitized
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        
        return value
    
    def validate_tag_names(self, value):
        """Enhanced tag names validation"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tag names must be a list")
        
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed per article")
        
        validated_tags = []
        for tag_name in value:
            if not tag_name or not tag_name.strip():
                continue  # Skip empty tag names
            
            if len(tag_name.strip()) > 50:
                raise serializers.ValidationError(f"Tag '{tag_name}' is too long (maximum 50 characters)")
            
            try:
                sanitized = validate_input_field(tag_name, 'text')
                if sanitized and sanitized not in validated_tags:
                    validated_tags.append(sanitized)
            except DjangoValidationError:
                continue  # Skip invalid tag names
        
        return validated_tags
    
    def get_reading_time(self, obj):
        """Calculate estimated reading time"""
        if obj.content:
            word_count = len(obj.content.split())
            # Average reading speed: 200 words per minute
            reading_time = max(1, round(word_count / 200))
            return reading_time
        return 1
    
    def get_is_liked_by_user(self, obj):
        """Check if current user has liked this article"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # This would require a likes tracking system
            # For now, return False as placeholder
            return False
        return False
    
    def get_can_edit(self, obj):
        """Check if current user can edit this article"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_staff or obj.author == request.user
        return False
    
    def get_can_delete(self, obj):
        """Check if current user can delete this article"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_staff or obj.author == request.user
        return False


class FrontendCommentSerializer(FrontendErrorMixin, serializers.ModelSerializer):
    """
    Enhanced comment serializer for frontend with better error handling
    """
    author = serializers.StringRelatedField(read_only=True)
    author_avatar = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'author_avatar', 'parent',
            'approved', 'is_flagged', 'created_at', 'updated_at',
            'can_edit', 'can_delete', 'replies', 'reply_count'
        ]
        read_only_fields = ['id', 'approved', 'is_flagged', 'created_at', 'updated_at']
    
    def validate_content(self, value):
        """Enhanced content validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment content is required and cannot be empty")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Comment must be at least 3 characters long")
        
        if len(value) > 1000:
            raise serializers.ValidationError("Comment must be 1000 characters or less")
        
        try:
            sanitized = validate_input_field(value, 'content')
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def get_author_avatar(self, obj):
        """Get author avatar URL or placeholder"""
        if obj.author and hasattr(obj.author, 'avatar_url') and obj.author.avatar_url:
            return obj.author.avatar_url
        return None
    
    def get_can_edit(self, obj):
        """Check if current user can edit this comment"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_staff or obj.author == request.user
        return False
    
    def get_can_delete(self, obj):
        """Check if current user can delete this comment"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.is_staff or obj.author == request.user
        return False
    
    def get_replies(self, obj):
        """Get comment replies"""
        if hasattr(obj, 'replies'):
            replies = obj.replies.filter(approved=True).order_by('created_at')
            return FrontendCommentSerializer(replies, many=True, context=self.context).data
        return []
    
    def get_reply_count(self, obj):
        """Get count of approved replies"""
        if hasattr(obj, 'replies'):
            return obj.replies.filter(approved=True).count()
        return 0


class FrontendUserSerializer(FrontendErrorMixin, serializers.ModelSerializer):
    """
    Enhanced user serializer for frontend with better error handling
    """
    full_name = serializers.SerializerMethodField()
    article_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'bio', 'user_type', 'is_active', 'date_joined', 'last_active',
            'article_count', 'comment_count', 'is_online'
        ]
        read_only_fields = ['id', 'date_joined', 'last_active']
    
    def validate_username(self, value):
        """Enhanced username validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Username is required and cannot be empty")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long")
        
        if len(value) > 150:
            raise serializers.ValidationError("Username must be 150 characters or less")
        
        # Check for invalid characters
        if not value.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError("Username can only contain letters, numbers, underscores, and hyphens")
        
        try:
            sanitized = validate_input_field(value, 'username')
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_email(self, value):
        """Enhanced email validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Email address is required")
        
        if '@' not in value or '.' not in value:
            raise serializers.ValidationError("Please enter a valid email address")
        
        if len(value) > 254:
            raise serializers.ValidationError("Email address must be 254 characters or less")
        
        try:
            sanitized = validate_input_field(value, 'email')
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def get_full_name(self, obj):
        """Get user's full name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        return obj.username
    
    def get_article_count(self, obj):
        """Get user's published article count"""
        return obj.articles.filter(status='published').count()
    
    def get_comment_count(self, obj):
        """Get user's approved comment count"""
        return obj.comments.filter(approved=True).count()
    
    def get_is_online(self, obj):
        """Check if user is currently online"""
        if obj.last_active:
            from django.utils import timezone
            from datetime import timedelta
            
            # Consider user online if active within last 15 minutes
            online_threshold = timezone.now() - timedelta(minutes=15)
            return obj.last_active > online_threshold
        return False


class FrontendCategorySerializer(FrontendErrorMixin, serializers.ModelSerializer):
    """
    Enhanced category serializer for frontend with better error handling
    """
    article_count = serializers.IntegerField(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children = serializers.SerializerMethodField()
    breadcrumb = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'parent', 'parent_name',
            'article_count', 'children', 'breadcrumb'
        ]
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Enhanced name validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Category name is required and cannot be empty")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Category name must be at least 2 characters long")
        
        if len(value) > 100:
            raise serializers.ValidationError("Category name must be 100 characters or less")
        
        try:
            sanitized = validate_input_field(value, 'text')
            
            # Check for uniqueness
            existing = Category.objects.filter(name__iexact=sanitized)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(f"A category with the name '{sanitized}' already exists")
            
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def get_children(self, obj):
        """Get child categories"""
        if hasattr(obj, 'children'):
            children = obj.children.all()
            return FrontendCategorySerializer(children, many=True, context=self.context).data
        return []
    
    def get_breadcrumb(self, obj):
        """Get category breadcrumb path"""
        breadcrumb = []
        current = obj
        
        while current:
            breadcrumb.insert(0, {
                'id': str(current.id),
                'name': current.name
            })
            current = current.parent
        
        return breadcrumb


class FrontendTagSerializer(FrontendErrorMixin, serializers.ModelSerializer):
    """
    Enhanced tag serializer for frontend with better error handling
    """
    article_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'article_count']
        read_only_fields = ['id']
    
    def validate_name(self, value):
        """Enhanced name validation"""
        if not value or not value.strip():
            raise serializers.ValidationError("Tag name is required and cannot be empty")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Tag name must be at least 2 characters long")
        
        if len(value) > 50:
            raise serializers.ValidationError("Tag name must be 50 characters or less")
        
        try:
            sanitized = validate_input_field(value, 'text')
            
            # Check for uniqueness
            existing = Tag.objects.filter(name__iexact=sanitized)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(f"A tag with the name '{sanitized}' already exists")
            
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))