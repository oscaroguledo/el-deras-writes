from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount, Feedback # Import Feedback model
from .utils.input_validation import InputValidator, validate_input_field

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['user_type'] = user.user_type
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['bio'] = user.bio
        
        return token

class ContactInfoSerializer(serializers.ModelSerializer):
    social_media_links = serializers.JSONField(required=False)

    class Meta:
        model = ContactInfo
        fields = '__all__'
class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True) # Make password optional for updates and allow blank
    total_articles = serializers.IntegerField(read_only=True, required=False)
    total_comments = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'title', 'bio', 'user_type', 'password', 'is_active', 'is_staff', 'is_superuser', 'total_articles', 'total_comments', 'date_joined']

    def validate_username(self, value):
        """Validate and sanitize username"""
        try:
            sanitized = validate_input_field(value, 'username')
            if not sanitized:
                raise serializers.ValidationError("Username cannot be empty after sanitization")
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

    def validate_email(self, value):
        """Validate and sanitize email"""
        try:
            sanitized = validate_input_field(value, 'email')
            if not sanitized:
                raise serializers.ValidationError("Email cannot be empty after sanitization")
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

    def validate_first_name(self, value):
        """Validate and sanitize first name"""
        if value:
            try:
                return validate_input_field(value, 'text')
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def validate_last_name(self, value):
        """Validate and sanitize last name"""
        if value:
            try:
                return validate_input_field(value, 'text')
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def validate_bio(self, value):
        """Validate and sanitize bio"""
        if value:
            try:
                return validate_input_field(value, 'content')
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user_type = validated_data.get('user_type', 'normal')
        is_staff = user_type == 'admin'
        is_superuser = user_type == 'admin'

        # Remove is_staff and is_superuser from validated_data if they exist
        validated_data.pop('is_staff', None)
        validated_data.pop('is_superuser', None)

        user = CustomUser.objects.create(
            is_staff=is_staff,
            is_superuser=is_superuser,
            **validated_data
        )
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and password != '': # Only update password if a non-empty string is provided
            instance.set_password(password)
        instance.save()
        return instance

class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)
    total_articles = serializers.IntegerField(read_only=True)
    children = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Category
        fields = '__all__'
        extra_kwargs = {'id': {'read_only': True}}

    def get_children(self, obj):
        """Get child categories"""
        if hasattr(obj, 'children'):
            children = obj.children.all()
            return CategorySerializer(children, many=True, context=self.context).data
        return []

    def validate_name(self, value):
        # First sanitize the input
        try:
            sanitized_value = validate_input_field(value, 'text')
            if not sanitized_value:
                raise serializers.ValidationError("Category name cannot be empty after sanitization")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

        # Case-insensitive check for uniqueness
        existing_category = None
        if self.instance: # If updating an existing instance
            existing_category = Category.objects.filter(name__iexact=sanitized_value).exclude(id=self.instance.id).first()
        else: # If creating a new instance
            existing_category = Category.objects.filter(name__iexact=sanitized_value).first()

        if existing_category:
            raise serializers.ValidationError(f"Category with name '{existing_category.name}' already exists.")
        return sanitized_value

    def validate_description(self, value):
        """Validate and sanitize description"""
        if value:
            try:
                return validate_input_field(value, 'content')
            except DjangoValidationError as e:
                raise serializers.ValidationError(str(e))
        return value

class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)
    total_articles = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tag
        fields = '__all__'

    def validate_name(self, value):
        # First sanitize the input
        try:
            sanitized_value = validate_input_field(value, 'text')
            if not sanitized_value:
                raise serializers.ValidationError("Tag name cannot be empty after sanitization")
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

        # Case-insensitive check for uniqueness
        existing_tag = None
        if self.instance: # If updating an existing instance
            existing_tag = Tag.objects.filter(name__iexact=sanitized_value).exclude(id=self.instance.id).first()
        else: # If creating a new instance
            existing_tag = Tag.objects.filter(name__iexact=sanitized_value).first()

        if existing_tag:
            raise serializers.ValidationError(f"Tag with name '{existing_tag.name}' already exists.")
        return sanitized_value

class CommentSerializer(serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), required=False)

    class Meta:
        model = Comment
        fields = '__all__'
        depth = 1

    def validate_content(self, value):
        """Validate and sanitize comment content"""
        try:
            sanitized = validate_input_field(value, 'content')
            if not sanitized or sanitized.strip() == '':
                raise serializers.ValidationError("Comment content cannot be empty after sanitization")
            return sanitized
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))

class ArticleSerializer(serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    category_name = serializers.CharField(write_only=True, required=False)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, required=False)
    comments = CommentSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    tag_count = serializers.IntegerField(read_only=True)
    authors = CustomUserSerializer(many=True, read_only=True)
    
    # Image handling
    image_file = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'image', 'image_base64', 
            'readTime', 'read_time', 'author', 'authors', 'category', 'tags', 
            'status', 'featured', 'views', 'likes', 'scheduled_publish',
            'created_at', 'updated_at', 'published_at', 'comments', 
            'category_name', 'comment_count', 'tag_count', 'image_file'
        ]

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        category = validated_data.pop('category_instance', None)
        image_file = validated_data.pop('image_file', None)
        
        article = Article.objects.create(category=category, **validated_data)
        
        # Handle image upload
        if image_file:
            article.set_image_from_file(image_file)
            article.save()
        
        # Handle tags
        for tag_data in tags_data:
            tag_name = tag_data.get('name')
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            article.tags.add(tag)
            
        return article

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        category = validated_data.pop('category_instance', None)
        image_file = validated_data.pop('image_file', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle category update
        if category:
            instance.category = category
        
        # Handle image upload
        if image_file:
            instance.set_image_from_file(image_file)
        
        instance.save()
        
        # Handle tags update
        if tags_data is not None:
            instance.tags.clear()
            for tag_data in tags_data:
                tag_name = tag_data.get('name')
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                instance.tags.add(tag)
        
        return instance

    def validate(self, attrs):
        category_name = attrs.get('category_name')
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            attrs['category_instance'] = category
            attrs.pop('category_name')
        
        # Validate scheduled publishing
        scheduled_publish = attrs.get('scheduled_publish')
        if scheduled_publish and scheduled_publish <= timezone.now():
            raise serializers.ValidationError({
                "scheduled_publish": "Scheduled publish time must be in the future."
            })
        
        return attrs

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = '__all__'

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'