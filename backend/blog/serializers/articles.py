from rest_framework import serializers
from ..models import Article


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    tags = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'content', 'excerpt', 'author', 
                 'category', 'tags', 'status', 'featured', 'views', 
                 'created_at', 'updated_at', 'published_at']
        read_only_fields = ['id', 'slug', 'views', 'created_at', 'updated_at']