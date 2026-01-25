from rest_framework import serializers
from ..models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    article = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'article', 'parent', 'approved', 'is_flagged', 
                 'created_at', 'updated_at', 'replies']
        read_only_fields = ['id', 'approved', 'is_flagged', 'created_at', 'updated_at', 'replies']
    
    def get_author(self, obj):
        """Get author information"""
        if obj.author:
            return {
                'id': obj.author.id,
                'username': obj.author.username,
                'first_name': obj.author.first_name,
                'last_name': obj.author.last_name,
                'user_type': obj.author.user_type,
            }
        return None
    
    def get_article(self, obj):
        """Get article information"""
        if obj.article:
            return {
                'id': obj.article.id,
                'title': obj.article.title,
                'slug': obj.article.slug,
            }
        return None
    
    def get_replies(self, obj):
        """Get nested replies for this comment"""
        if hasattr(obj, 'replies'):
            # Only include approved replies
            approved_replies = obj.replies.filter(approved=True).order_by('created_at')
            return CommentSerializer(approved_replies, many=True, context=self.context).data
        return []