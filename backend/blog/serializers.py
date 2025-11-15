from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount

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
    password = serializers.CharField(write_only=True, required=False) # Make password optional for updates
    total_articles = serializers.IntegerField(read_only=True, required=False)
    total_comments = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'bio', 'user_type', 'password', 'is_active', 'is_staff', 'is_superuser', 'total_articles', 'total_comments', 'date_joined']

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
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        extra_kwargs = {'id': {'read_only': True}}

    def validate_name(self, value):
        # Case-insensitive check for uniqueness
        existing_category = None
        if self.instance: # If updating an existing instance
            existing_category = Category.objects.filter(name__iexact=value).exclude(id=self.instance.id).first()
        else: # If creating a new instance
            existing_category = Category.objects.filter(name__iexact=value).first()

        if existing_category:
            raise serializers.ValidationError(f"Category with name '{existing_category.name}' already exists.")
        return value

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

    def validate_name(self, value):
        # Case-insensitive check for uniqueness
        existing_tag = None
        if self.instance: # If updating an existing instance
            existing_tag = Tag.objects.filter(name__iexact=value).exclude(id=self.instance.id).first()
        else: # If creating a new instance
            existing_tag = Tag.objects.filter(name__iexact=value).first()

        if existing_tag:
            raise serializers.ValidationError(f"Tag with name '{existing_tag.name}' already exists.")
        return value

class CommentSerializer(serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    ip_address = serializers.IPAddressField(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Comment.objects.all(), required=False)

    class Meta:
        model = Comment
        fields = '__all__'
        depth = 1

class ArticleSerializer(serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    category_name = serializers.CharField(write_only=True) # For input
    category = CategorySerializer(read_only=True) # For output
    tags = TagSerializer(many=True, required=False)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'excerpt', 'content', 'image', 'readTime', 'author', 'category', 'tags', 'status', 'views', 'likes', 'created_at', 'updated_at', 'published_at', 'comments', 'category_name'] # Add category_name to fields

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        category = validated_data.pop('category_instance') # Get the category object from validation
        
        article = Article.objects.create(category=category, **validated_data)
        
        for tag_data in tags_data:
            tag_name = tag_data.get('name')
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            article.tags.add(tag)
            
        return article

    def validate(self, attrs):
        category_name = attrs.get('category_name')
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            attrs['category_instance'] = category
            attrs.pop('category_name') # Remove category_name from attrs
        else:
            raise serializers.ValidationError({"category_name": "This field is required."})
        return attrs

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = '__all__'