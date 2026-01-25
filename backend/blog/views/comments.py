"""Comment views"""
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Comment, Article
from ..serializers import CommentSerializer
from .base import BaseViewMixin


class CommentViewSet(BaseViewMixin, viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Get comments for an article with nested structure"""
        article_id = self.kwargs.get('article_pk')
        queryset = Comment.objects.filter(article_id=article_id)
        
        # Only show approved comments for non-admin users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(approved=True)
        
        # Only return top-level comments (no parent) - replies will be included via serializer
        return queryset.filter(parent__isnull=True).order_by('created_at').prefetch_related(
            'replies__author', 'author', 'replies__replies__author'
        )

    def perform_create(self, serializer):
        """Create comment"""
        article_id = self.kwargs.get('article_pk')
        article = Article.objects.get(pk=article_id)
        
        # Get parent comment if specified
        parent_id = self.request.data.get('parent')
        parent = None
        if parent_id:
            try:
                parent = Comment.objects.get(pk=parent_id, article=article)
            except Comment.DoesNotExist:
                pass  # Invalid parent ID, create as top-level comment
        
        # Auto-approve all comments for better UX
        approved = True
        
        serializer.save(
            author=self.request.user if self.request.user.is_authenticated else None,
            article=article,
            parent=parent,
            approved=approved
        )