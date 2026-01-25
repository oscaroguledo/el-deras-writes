"""Comment views"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Comment, Article
from ..serializers import CommentSerializer
from .base import BaseViewMixin


class CommentViewSet(BaseViewMixin, viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Get comments for an article"""
        article_id = self.kwargs.get('article_pk')
        queryset = Comment.objects.filter(article_id=article_id).select_related('author', 'article')
        
        # Only show approved comments for non-admin users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(approved=True)
        
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        """Create comment"""
        article_id = self.kwargs.get('article_pk')
        article = Article.objects.get(pk=article_id)
        
        # Auto-approve comments from staff users
        approved = self.request.user.is_staff if self.request.user.is_authenticated else False
        
        serializer.save(
            author=self.request.user if self.request.user.is_authenticated else None,
            article=article,
            approved=approved
        )