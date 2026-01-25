"""Tag views"""
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Tag, Article
from ..serializers import TagSerializer
from ..permissions import IsAdminOrReadOnly


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Get tags with article counts"""
        return Tag.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published'))
        ).order_by('name')

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags by article count"""
        popular_tags = self.get_queryset().order_by('-article_count')[:20]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """Get articles with this tag"""
        tag = self.get_object()
        articles = Article.objects.filter(
            tags=tag,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')
        
        from ..serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)