"""
Enhanced views with caching and performance optimizations.
"""

from django.core.cache import cache, caches
from django.db.models import Q, Count, Avg, F, Prefetch, Sum
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser

from .models import Article, Comment, Category, Tag, CustomUser, Analytics
from .serializers import ArticleSerializer, CommentSerializer, CategorySerializer, TagSerializer
from .utils.performance_monitoring import PerformanceMonitor, monitor_performance
from .utils.caching_strategies import (
    APICacheStrategy, 
    cache_api_view, 
    cache_queryset_result,
    LazyLoadingStrategy
)
import logging

logger = logging.getLogger(__name__)


class CachedArticleViewSet(viewsets.ModelViewSet):
    """Enhanced ArticleViewSet with comprehensive caching."""
    
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    @monitor_performance
    def get_queryset(self):
        """Optimized queryset with caching."""
        cache_key = APICacheStrategy.get_cache_key(
            'articles_queryset',
            self.request.user.is_authenticated,
            self.request.user.is_staff if self.request.user.is_authenticated else False,
            **dict(self.request.GET.items())
        )
        
        # Try to get cached queryset
        cached_data = APICacheStrategy.get_cached_response(cache_key)
        if cached_data is not None:
            # Return queryset from cached IDs
            article_ids = [item['id'] for item in cached_data]
            return Article.objects.filter(id__in=article_ids).select_related(
                'author', 'category'
            ).prefetch_related('tags', 'comments')
        
        # Build optimized queryset
        queryset = Article.objects.select_related('author', 'category').prefetch_related(
            'tags',
            Prefetch('comments', queryset=Comment.objects.select_related('author').filter(approved=True))
        ).annotate(
            comment_count=Count('comments', filter=Q(comments__approved=True)),
            tag_count=Count('tags')
        )
        
        # Apply filters
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(status='published')
        
        # Cache the queryset data
        queryset_data = list(queryset.values('id', 'title', 'slug', 'status'))
        APICacheStrategy.cache_api_response(
            cache_key, 
            queryset_data, 
            timeout=APICacheStrategy.CACHE_TIMEOUTS['articles_list']
        )
        
        return queryset
    
    @cache_api_view(timeout=600, key_func=lambda self, request, *args, **kwargs: 
                   APICacheStrategy.get_cache_key('article_list', request.GET.get('page', 1)))
    def list(self, request, *args, **kwargs):
        """Cached article list with pagination."""
        return super().list(request, *args, **kwargs)
    
    @cache_api_view(timeout=900, key_func=lambda self, request, *args, **kwargs: 
                   APICacheStrategy.get_cache_key('article_detail', kwargs.get('pk')))
    def retrieve(self, request, *args, **kwargs):
        """Cached article detail with view tracking."""
        article = self.get_object()
        
        # Increment view count (not cached)
        Article.objects.filter(id=article.id).update(views=F('views') + 1)
        
        # Track analytics
        Analytics.objects.create(
            metric_type='article_view',
            metric_value={
                'article_id': str(article.id),
                'viewer_id': str(request.user.id) if request.user.is_authenticated else None,
            },
            article=article,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(),
        )
        
        # Return cached response
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Create article and invalidate related cache."""
        article = serializer.save(author=self.request.user)
        
        # Invalidate related cache
        APICacheStrategy.invalidate_related_cache('article')
        
        return article
    
    def perform_update(self, serializer):
        """Update article and invalidate related cache."""
        article = serializer.save()
        
        # Invalidate related cache
        APICacheStrategy.invalidate_related_cache('article', article.id)
        
        return article
    
    @cache_api_view(timeout=300)
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Cached search endpoint."""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': [], 'pagination': {'count': 0}})
        
        # Use cached search results
        cache_key = APICacheStrategy.get_cache_key('search', query)
        cached_results = APICacheStrategy.get_cached_response(cache_key)
        
        if cached_results is not None:
            return Response(cached_results)
        
        # Perform search
        queryset = Article.objects.filter(
            Q(title__icontains=query) | 
            Q(content__icontains=query) |
            Q(excerpt__icontains=query),
            status='published'
        ).select_related('author', 'category').prefetch_related('tags')[:20]
        
        serializer = self.get_serializer(queryset, many=True)
        results = {'results': serializer.data}
        
        # Cache results
        APICacheStrategy.cache_api_response(
            cache_key, 
            results, 
            timeout=APICacheStrategy.CACHE_TIMEOUTS['search_results']
        )
        
        return Response(results)
    
    @cache_api_view(timeout=1800)
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Cached featured articles."""
        queryset = self.get_queryset().filter(featured=True, status='published')[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @cache_api_view(timeout=600)
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Cached popular articles."""
        queryset = self.get_queryset().filter(status='published').order_by('-views', '-likes')[:20]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_client_ip(self):
        """Get client IP address."""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class CachedCategoryViewSet(viewsets.ModelViewSet):
    """Enhanced CategoryViewSet with caching."""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    
    @cache_queryset_result(timeout=1800)
    @monitor_performance
    def get_queryset(self):
        """Cached and optimized category queryset."""
        return Category.objects.select_related('parent').prefetch_related('children').annotate(
            article_count=Count('article', filter=Q(article__status='published')),
            total_articles=Count('article')
        ).order_by('name')
    
    @cache_api_view(timeout=1800)
    def list(self, request, *args, **kwargs):
        """Cached category list."""
        return super().list(request, *args, **kwargs)
    
    @cache_api_view(timeout=1800)
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Cached category hierarchy."""
        root_categories = self.get_queryset().filter(parent=None)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """Create category and invalidate cache."""
        category = serializer.save()
        APICacheStrategy.invalidate_related_cache('category')
        return category
    
    def perform_update(self, serializer):
        """Update category and invalidate cache."""
        category = serializer.save()
        APICacheStrategy.invalidate_related_cache('category', category.id)
        return category


class CachedTagViewSet(viewsets.ModelViewSet):
    """Enhanced TagViewSet with caching."""
    
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    
    @cache_queryset_result(timeout=1800)
    @monitor_performance
    def get_queryset(self):
        """Cached and optimized tag queryset."""
        return Tag.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published')),
            total_articles=Count('article')
        ).order_by('name')
    
    @cache_api_view(timeout=1800)
    def list(self, request, *args, **kwargs):
        """Cached tag list."""
        return super().list(request, *args, **kwargs)
    
    @cache_api_view(timeout=3600)
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Cached popular tags."""
        popular_tags = self.get_queryset().order_by('-article_count')[:50]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)
    
    @cache_api_view(timeout=3600)
    @action(detail=False, methods=['get'])
    def cloud(self, request):
        """Cached tag cloud data."""
        tags = self.get_queryset().filter(article_count__gt=0).order_by('-article_count')[:100]
        
        if tags:
            max_count = max(tag.article_count for tag in tags)
            min_count = min(tag.article_count for tag in tags)
            
            tag_data = []
            for tag in tags:
                if max_count == min_count:
                    weight = 3
                else:
                    weight = 1 + 4 * (tag.article_count - min_count) / (max_count - min_count)
                
                tag_data.append({
                    'id': tag.id,
                    'name': tag.name,
                    'article_count': tag.article_count,
                    'weight': round(weight, 1)
                })
            
            return Response(tag_data)
        
        return Response([])


class PerformanceAnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for performance monitoring and analytics."""
    
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """Get performance overview."""
        try:
            # Get performance metrics
            metrics = PerformanceMonitor.get_performance_metrics()
            
            # Get cache statistics
            cache_stats = PerformanceMonitor.get_cache_statistics()
            
            # Get database query analysis
            from .utils.performance_monitoring import DatabaseOptimizer
            query_analysis = DatabaseOptimizer.get_query_analysis()
            
            return Response({
                'performance_metrics': metrics,
                'cache_statistics': cache_stats,
                'query_analysis': query_analysis,
                'cache_hit_rate': self.calculate_cache_hit_rate()
            })
            
        except Exception as e:
            logger.error(f"Error getting performance analytics: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve performance data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Clear all caches."""
        try:
            for cache_name in ['default', 'api_cache', 'session_cache', 'template_cache']:
                try:
                    cache_instance = caches[cache_name]
                    cache_instance.clear()
                except Exception:
                    pass  # Cache might not exist
            
            return Response({'message': 'All caches cleared successfully'})
            
        except Exception as e:
            logger.error(f"Error clearing caches: {str(e)}")
            return Response(
                {'error': 'Failed to clear caches'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def warm_cache(self, request):
        """Warm up cache with common data."""
        try:
            from .utils.caching_strategies import CacheWarmupStrategy
            CacheWarmupStrategy.warm_common_queries()
            
            return Response({'message': 'Cache warmed up successfully'})
            
        except Exception as e:
            logger.error(f"Error warming cache: {str(e)}")
            return Response(
                {'error': 'Failed to warm cache'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def calculate_cache_hit_rate(self):
        """Calculate approximate cache hit rate."""
        try:
            # This is a simplified calculation
            # In production, you'd want more sophisticated metrics
            total_requests = cache.get('total_cache_requests', 0)
            cache_hits = cache.get('cache_hits', 0)
            
            if total_requests > 0:
                hit_rate = (cache_hits / total_requests) * 100
                return round(hit_rate, 2)
            
            return 0.0
            
        except Exception:
            return 0.0


class LazyLoadingMixin:
    """Mixin for implementing lazy loading in viewsets."""
    
    def get_lazy_loaded_data(self, request, queryset, page_size=20):
        """Get lazy loaded paginated data with caching."""
        page = int(request.query_params.get('page', 1))
        filters = dict(request.GET.items())
        
        # Generate cache key for this page
        cache_key = LazyLoadingStrategy.get_paginated_cache_key(
            self.__class__.__name__,
            page,
            page_size,
            filters
        )
        
        # Try to get cached page data
        cached_data = LazyLoadingStrategy.get_cached_page_data(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # Get page data
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        if paginated_queryset is not None:
            serializer = self.get_serializer(paginated_queryset, many=True)
            page_data = paginator.get_paginated_response(serializer.data).data
            
            # Cache the page data
            LazyLoadingStrategy.cache_page_data(cache_key, page_data)
            
            return Response(page_data)
        
        # Fallback for non-paginated data
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)