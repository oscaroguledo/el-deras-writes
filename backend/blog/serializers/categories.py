from rest_framework import serializers
from ..models import Category


class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'article_count']
        read_only_fields = ['id']