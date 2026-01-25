"""Category views"""
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Category, Article
from ..serializers import CategorySerializer
from ..permissions import IsAdminOrReadOnly


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Get categories with article counts"""
        return Category.objects.annotate(
            article_count=Count('articles', filter=Q(articles__status='published'))
        ).order_by('name')

    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """Get articles in this category"""
        category = self.get_object()
        articles = Article.objects.filter(
            category=category,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')
        
        from ..serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)