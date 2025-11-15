from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

class ContactInfoSerializer(serializers.ModelSerializer):
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

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

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
    category = CategorySerializer()
    tags = TagSerializer(many=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'excerpt', 'content', 'image', 'readTime', 'author', 'category', 'tags', 'status', 'views', 'likes', 'created_at', 'updated_at', 'published_at', 'comments']

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = '__all__'