from rest_framework import serializers
from ..models import Tag


class TagSerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'article_count', 'created_at']
        read_only_fields = ['id', 'created_at']