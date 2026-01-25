from rest_framework import serializers
from ..models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'approved', 'is_flagged', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'approved', 'is_flagged', 'created_at', 'updated_at']