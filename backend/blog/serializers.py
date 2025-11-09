from rest_framework import serializers
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount

class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = '__all__'
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'bio', 'user_type']

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

class ArticleSerializer(serializers.ModelSerializer):
    author = CustomUserSerializer(read_only=True)
    category = CategorySerializer()
    tags = TagSerializer(many=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = '__all__'

class VisitorCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorCount
        fields = '__all__'