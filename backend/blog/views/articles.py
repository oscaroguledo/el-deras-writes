"""Article views"""
from django.db.models import Q, Count, F
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from ..models import Article, Comment
from ..serializers import ArticleSerializer
from ..permissions import IsAdminOrReadOnly
from .base import ArticlePagination, BaseViewMixin


class ArticleViewSet(BaseViewMixin, viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = ArticlePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'excerpt', 'author__username', 'category__name']

    def get_queryset(self):
        """Get articles with basic filtering"""
        queryset = Article.objects.select_related('author', 'category').prefetch_related('tags')
        
        # Only show published articles for non-admin users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(status='published')
        
        # Category filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name__iexact=category)
        
        # Tag filtering
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__iexact=tag)
        
        # Status filtering (for admin users)
        status_filter = self.request.query_params.get('status')
        if status_filter and self.request.user.is_authenticated and self.request.user.is_staff:
            valid_statuses = ['draft', 'published', 'archived']
            if status_filter in valid_statuses:
                queryset = queryset.filter(status=status_filter)
        
        # Featured articles
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(featured=True)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        valid_orderings = ['created_at', '-created_at', 'title', '-title', 'views', '-views']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
        
        # Remove duplicates that might occur from joins
        return queryset.distinct()

    def perform_create(self, serializer):
        """Create article"""
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Get article and increment view count"""
        article = self.get_object()
        Article.objects.filter(id=article.id).update(views=F('views') + 1)
        article.refresh_from_db()
        serializer = self.get_serializer(article)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search articles"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})
        
        queryset = Article.objects.filter(
            Q(title__icontains=query) | 
            Q(content__icontains=query) |
            Q(excerpt__icontains=query),
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get search suggestions"""
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response({'suggestions': []})
        
        # Get article titles that match the query
        articles = Article.objects.filter(
            title__icontains=query,
            status='published'
        ).values_list('title', flat=True)[:5]
        
        # Get category names that match
        from ..models import Category
        categories = Category.objects.filter(
            name__icontains=query
        ).values_list('name', flat=True)[:3]
        
        suggestions = list(articles) + [f"in {cat}" for cat in categories]
        
        return Response({'suggestions': suggestions[:8]})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        queryset = self.get_queryset().filter(featured=True, status='published')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular articles by views"""
        queryset = self.get_queryset().filter(status='published').order_by('-views')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent articles"""
        queryset = self.get_queryset().filter(status='published').order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)