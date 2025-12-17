"""
Caching strategies for Django blog application.
"""

from django.core.cache import cache, caches
from django.conf import settings
from django.utils import timezone
from django.db.models import QuerySet
from functools import wraps
import json
import hashlib
import logging

logger = logging.getLogger(__name__)


class APICacheStrategy:
    """Caching strategies for API responses."""
    
    # Cache timeouts for different content types
    CACHE_TIMEOUTS = {
        'articles_list': 300,      # 5 minutes
        'article_detail': 600,     # 10 minutes
        'categories': 1800,        # 30 minutes
        'tags': 1800,             # 30 minutes
        'comments': 180,          # 3 minutes
        'search_results': 600,    # 10 minutes
        'analytics': 900,         # 15 minutes
        'user_profile': 1200,     # 20 minutes
    }
    
    @staticmethod
    def get_cache_key(view_name, *args, **kwargs):
        """Generate cache key for API responses."""
        key_parts = [settings.CACHE_KEY_PREFIX, 'api', view_name]
        
        # Add arguments
        for arg in args:
            key_parts.append(str(arg))
        
        # Add sorted kwargs
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}_{v}")
        
        cache_key = "_".join(key_parts)
        
        # Hash if too long
        if len(cache_key) > 200:
            hash_suffix = hashlib.md5(cache_key.encode()).hexdigest()[:8]
            cache_key = f"{settings.CACHE_KEY_PREFIX}_api_{view_name}_{hash_suffix}"
        
        return cache_key
    
    @staticmethod
    def cache_api_response(cache_key, data, timeout=None, cache_name='api_cache'):
        """Cache API response data."""
        try:
            cache_instance = caches[cache_name]
            
            if timeout is None:
                timeout = APICacheStrategy.CACHE_TIMEOUTS.get('articles_list', 300)
            
            # Serialize data for caching
            if isinstance(data, (dict, list)):
                cached_data = {
                    'data': data,
                    'cached_at': timezone.now().isoformat(),
                    'cache_key': cache_key
                }
            else:
                cached_data = data
            
            cache_instance.set(cache_key, cached_data, timeout)
            logger.debug(f"Cached API response: {cache_key}")
            
        except Exception as e:
            logger.error(f"Failed to cache API response {cache_key}: {str(e)}")
    
    @staticmethod
    def get_cached_response(cache_key, cache_name='api_cache'):
        """Retrieve cached API response."""
        try:
            cache_instance = caches[cache_name]
            cached_data = cache_instance.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for API response: {cache_key}")
                return cached_data.get('data') if isinstance(cached_data, dict) else cached_data
            
            logger.debug(f"Cache miss for API response: {cache_key}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve cached response {cache_key}: {str(e)}")
            return None
    
    @staticmethod
    def invalidate_related_cache(model_name, instance_id=None):
        """Invalidate cache entries related to a model instance."""
        patterns_to_invalidate = []
        
        if model_name == 'article':
            patterns_to_invalidate.extend([
                f"{settings.CACHE_KEY_PREFIX}_api_articles_*",
                f"{settings.CACHE_KEY_PREFIX}_api_search_*",
                f"{settings.CACHE_KEY_PREFIX}_api_featured_*",
                f"{settings.CACHE_KEY_PREFIX}_api_popular_*",
                f"{settings.CACHE_KEY_PREFIX}_api_recent_*",
            ])
            if instance_id:
                patterns_to_invalidate.append(f"{settings.CACHE_KEY_PREFIX}_api_article_{instance_id}_*")
        
        elif model_name == 'comment':
            patterns_to_invalidate.extend([
                f"{settings.CACHE_KEY_PREFIX}_api_comments_*",
                f"{settings.CACHE_KEY_PREFIX}_api_articles_*",  # Articles include comment counts
            ])
        
        elif model_name == 'category':
            patterns_to_invalidate.extend([
                f"{settings.CACHE_KEY_PREFIX}_api_categories_*",
                f"{settings.CACHE_KEY_PREFIX}_api_articles_*",
            ])
        
        elif model_name == 'tag':
            patterns_to_invalidate.extend([
                f"{settings.CACHE_KEY_PREFIX}_api_tags_*",
                f"{settings.CACHE_KEY_PREFIX}_api_articles_*",
            ])
        
        # Invalidate patterns
        for pattern in patterns_to_invalidate:
            APICacheStrategy._invalidate_pattern(pattern)
    
    @staticmethod
    def _invalidate_pattern(pattern):
        """Invalidate cache keys matching pattern."""
        try:
            # Try different cache backends
            for cache_name in ['api_cache', 'default']:
                cache_instance = caches[cache_name]
                
                if hasattr(cache_instance, 'delete_pattern'):
                    cache_instance.delete_pattern(pattern)
                elif hasattr(cache_instance, 'keys'):
                    keys = cache_instance.keys(pattern)
                    for key in keys:
                        cache_instance.delete(key)
                        
        except Exception as e:
            logger.error(f"Failed to invalidate cache pattern {pattern}: {str(e)}")


class QueryCacheStrategy:
    """Caching strategies for database queries."""
    
    @staticmethod
    def cache_queryset(queryset, cache_key, timeout=600, cache_name='default'):
        """Cache queryset results."""
        try:
            cache_instance = caches[cache_name]
            
            # Convert queryset to list for caching
            if isinstance(queryset, QuerySet):
                data = list(queryset.values())
            else:
                data = queryset
            
            cached_data = {
                'data': data,
                'cached_at': timezone.now().isoformat(),
                'count': len(data) if isinstance(data, list) else 1
            }
            
            cache_instance.set(cache_key, cached_data, timeout)
            logger.debug(f"Cached queryset: {cache_key}")
            
            return data
            
        except Exception as e:
            logger.error(f"Failed to cache queryset {cache_key}: {str(e)}")
            return queryset
    
    @staticmethod
    def get_cached_queryset(cache_key, cache_name='default'):
        """Retrieve cached queryset."""
        try:
            cache_instance = caches[cache_name]
            cached_data = cache_instance.get(cache_key)
            
            if cached_data and isinstance(cached_data, dict):
                logger.debug(f"Cache hit for queryset: {cache_key}")
                return cached_data.get('data')
            
            logger.debug(f"Cache miss for queryset: {cache_key}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve cached queryset {cache_key}: {str(e)}")
            return None


class LazyLoadingStrategy:
    """Strategies for implementing lazy loading."""
    
    @staticmethod
    def get_paginated_cache_key(view_name, page, page_size, filters=None):
        """Generate cache key for paginated results."""
        key_parts = [settings.CACHE_KEY_PREFIX, 'paginated', view_name, f"page_{page}", f"size_{page_size}"]
        
        if filters:
            for k, v in sorted(filters.items()):
                key_parts.append(f"{k}_{v}")
        
        return "_".join(key_parts)
    
    @staticmethod
    def cache_page_data(cache_key, page_data, timeout=300):
        """Cache paginated page data."""
        try:
            cached_data = {
                'results': page_data.get('results', []),
                'pagination': page_data.get('pagination', {}),
                'cached_at': timezone.now().isoformat()
            }
            
            cache.set(cache_key, cached_data, timeout)
            logger.debug(f"Cached page data: {cache_key}")
            
        except Exception as e:
            logger.error(f"Failed to cache page data {cache_key}: {str(e)}")
    
    @staticmethod
    def get_cached_page_data(cache_key):
        """Retrieve cached page data."""
        try:
            cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for page data: {cache_key}")
                return cached_data
            
            logger.debug(f"Cache miss for page data: {cache_key}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve cached page data {cache_key}: {str(e)}")
            return None


# Decorators for easy caching
def cache_api_view(timeout=300, cache_name='api_cache', key_func=None):
    """Decorator to cache API view responses."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(self, request, *args, **kwargs)
            else:
                view_name = f"{self.__class__.__name__}_{view_func.__name__}"
                cache_key = APICacheStrategy.get_cache_key(
                    view_name,
                    request.method,
                    *args,
                    **dict(request.GET.items())
                )
            
            # Try to get cached response
            cached_response = APICacheStrategy.get_cached_response(cache_key, cache_name)
            if cached_response is not None:
                from rest_framework.response import Response
                return Response(cached_response)
            
            # Execute view and cache response
            response = view_func(self, request, *args, **kwargs)
            
            if hasattr(response, 'data') and response.status_code == 200:
                APICacheStrategy.cache_api_response(cache_key, response.data, timeout, cache_name)
            
            return response
        
        return wrapper
    return decorator


def cache_queryset_result(timeout=600, cache_name='default', key_prefix=None):
    """Decorator to cache queryset results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"queryset_{func.__name__}"
            cache_key = APICacheStrategy.get_cache_key(prefix, *args, **kwargs)
            
            # Try to get cached result
            cached_result = QueryCacheStrategy.get_cached_queryset(cache_key, cache_name)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            QueryCacheStrategy.cache_queryset(result, cache_key, timeout, cache_name)
            
            return result
        
        return wrapper
    return decorator


class CacheWarmupStrategy:
    """Strategies for cache warmup."""
    
    @staticmethod
    def warm_common_queries():
        """Warm up cache with commonly accessed data."""
        from ..models import Article, Category, Tag
        
        warmup_operations = [
            {
                'key': APICacheStrategy.get_cache_key('articles_published'),
                'query_func': lambda: list(Article.objects.filter(status='published').values('id', 'title', 'slug')[:20]),
                'timeout': APICacheStrategy.CACHE_TIMEOUTS['articles_list']
            },
            {
                'key': APICacheStrategy.get_cache_key('categories_all'),
                'query_func': lambda: list(Category.objects.all().values('id', 'name', 'slug')[:50]),
                'timeout': APICacheStrategy.CACHE_TIMEOUTS['categories']
            },
            {
                'key': APICacheStrategy.get_cache_key('tags_popular'),
                'query_func': lambda: list(Tag.objects.all().values('id', 'name')[:100]),
                'timeout': APICacheStrategy.CACHE_TIMEOUTS['tags']
            }
        ]
        
        for operation in warmup_operations:
            try:
                cache_key = operation['key']
                data = operation['query_func']()
                timeout = operation['timeout']
                
                APICacheStrategy.cache_api_response(cache_key, data, timeout)
                logger.info(f"Cache warmed: {cache_key}")
                
            except Exception as e:
                logger.error(f"Failed to warm cache: {str(e)}")
    
    @staticmethod
    def schedule_cache_warmup():
        """Schedule regular cache warmup (can be called from management command)."""
        try:
            CacheWarmupStrategy.warm_common_queries()
            logger.info("Cache warmup completed successfully")
            
        except Exception as e:
            logger.error(f"Cache warmup failed: {str(e)}")


class CacheInvalidationStrategy:
    """Strategies for cache invalidation."""
    
    @staticmethod
    def invalidate_on_model_save(sender, instance, **kwargs):
        """Signal handler to invalidate cache when models are saved."""
        model_name = sender._meta.model_name
        APICacheStrategy.invalidate_related_cache(model_name, instance.pk)
    
    @staticmethod
    def invalidate_on_model_delete(sender, instance, **kwargs):
        """Signal handler to invalidate cache when models are deleted."""
        model_name = sender._meta.model_name
        APICacheStrategy.invalidate_related_cache(model_name, instance.pk)