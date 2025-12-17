"""
Performance monitoring utilities for Django blog application.
"""

import time
import logging
from functools import wraps
from django.core.cache import cache, caches
from django.db import connection
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Performance monitoring and metrics collection."""
    
    @staticmethod
    def track_query_performance(func):
        """Decorator to track database query performance."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not getattr(settings, 'PERFORMANCE_MONITORING', {}).get('ENABLED', False):
                return func(*args, **kwargs)
            
            # Track initial query count
            initial_queries = len(connection.queries)
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                
                # Calculate performance metrics
                end_time = time.time()
                execution_time = end_time - start_time
                query_count = len(connection.queries) - initial_queries
                
                # Log slow queries
                slow_threshold = getattr(settings, 'PERFORMANCE_MONITORING', {}).get('SLOW_QUERY_THRESHOLD', 1.0)
                if execution_time > slow_threshold:
                    logger.warning(
                        f"Slow query detected in {func.__name__}: "
                        f"{execution_time:.3f}s, {query_count} queries"
                    )
                
                # Store metrics in cache for monitoring
                PerformanceMonitor.store_performance_metric(
                    func.__name__,
                    execution_time,
                    query_count
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Error in {func.__name__}: {str(e)}")
                raise
                
        return wrapper
    
    @staticmethod
    def store_performance_metric(function_name, execution_time, query_count):
        """Store performance metrics in cache."""
        try:
            cache_key = f"perf_metrics_{function_name}"
            metrics = cache.get(cache_key, [])
            
            # Add new metric
            metrics.append({
                'timestamp': timezone.now().isoformat(),
                'execution_time': execution_time,
                'query_count': query_count
            })
            
            # Keep only last 100 metrics per function
            if len(metrics) > 100:
                metrics = metrics[-100:]
            
            # Store back in cache
            cache.set(cache_key, metrics, timeout=3600)  # 1 hour
            
        except Exception as e:
            logger.error(f"Failed to store performance metric: {str(e)}")
    
    @staticmethod
    def get_performance_metrics(function_name=None):
        """Retrieve performance metrics from cache."""
        if function_name:
            cache_key = f"perf_metrics_{function_name}"
            return cache.get(cache_key, [])
        
        # Get all performance metrics
        all_metrics = {}
        cache_keys = cache.keys("perf_metrics_*") if hasattr(cache, 'keys') else []
        
        for key in cache_keys:
            func_name = key.replace("perf_metrics_", "")
            all_metrics[func_name] = cache.get(key, [])
        
        return all_metrics
    
    @staticmethod
    def get_cache_statistics():
        """Get cache hit/miss statistics."""
        stats = {}
        
        for cache_name in settings.CACHES.keys():
            cache_instance = caches[cache_name]
            
            # Try to get cache stats if available
            try:
                if hasattr(cache_instance, '_cache') and hasattr(cache_instance._cache, 'get_stats'):
                    cache_stats = cache_instance._cache.get_stats()
                    stats[cache_name] = cache_stats
                else:
                    # Basic cache info
                    stats[cache_name] = {
                        'backend': settings.CACHES[cache_name]['BACKEND'],
                        'timeout': settings.CACHES[cache_name].get('TIMEOUT', 'default'),
                        'max_entries': settings.CACHES[cache_name].get('OPTIONS', {}).get('MAX_ENTRIES', 'unknown')
                    }
            except Exception as e:
                logger.warning(f"Could not get stats for cache {cache_name}: {str(e)}")
                stats[cache_name] = {'error': str(e)}
        
        return stats
    
    @staticmethod
    def clear_performance_metrics():
        """Clear all performance metrics from cache."""
        try:
            # Clear all performance metric keys
            cache_keys = cache.keys("perf_metrics_*") if hasattr(cache, 'keys') else []
            for key in cache_keys:
                cache.delete(key)
            
            logger.info("Performance metrics cleared")
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear performance metrics: {str(e)}")
            return False


class CacheManager:
    """Enhanced cache management utilities."""
    
    @staticmethod
    def get_cache_key(prefix, *args, **kwargs):
        """Generate consistent cache keys."""
        import re
        import hashlib
        
        key_parts = [prefix]
        
        # Add positional arguments
        for arg in args:
            if isinstance(arg, (str, int, float)):
                # Sanitize string arguments
                sanitized_arg = re.sub(r'[^\w\-_.]', '_', str(arg))
                key_parts.append(sanitized_arg)
            else:
                # Hash complex objects
                key_parts.append(str(hash(str(arg))))
        
        # Add keyword arguments (sorted for consistency)
        for k, v in sorted(kwargs.items()):
            # Sanitize both key and value
            sanitized_k = re.sub(r'[^\w\-_.]', '_', str(k))
            sanitized_v = re.sub(r'[^\w\-_.]', '_', str(v))
            key_parts.append(f"{sanitized_k}_{sanitized_v}")
        
        # Join with underscores
        cache_key = "_".join(key_parts)
        
        # Ensure key length is within limits and contains only safe characters
        if len(cache_key) > 200 or not re.match(r'^[\w\-_.]+$', cache_key):
            # Hash the entire key if it's too long or contains unsafe characters
            hash_key = hashlib.md5(cache_key.encode()).hexdigest()
            cache_key = f"{prefix}_{hash_key}"
        
        return cache_key
    
    @staticmethod
    def cached_query(cache_key, query_func, timeout=None, cache_name='default'):
        """Execute a query with caching."""
        cache_instance = caches[cache_name]
        
        # Try to get from cache first
        result = cache_instance.get(cache_key)
        if result is not None:
            logger.debug(f"Cache hit for key: {cache_key}")
            return result
        
        # Execute query and cache result
        logger.debug(f"Cache miss for key: {cache_key}")
        result = query_func()
        
        # Set timeout from settings if not provided
        if timeout is None:
            timeout = settings.CACHES[cache_name].get('TIMEOUT', 3600)
        
        cache_instance.set(cache_key, result, timeout)
        return result
    
    @staticmethod
    def invalidate_cache_pattern(pattern):
        """Invalidate cache keys matching a pattern."""
        try:
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern(pattern)
            elif hasattr(cache, 'keys'):
                # Fallback for backends that support keys() but not delete_pattern()
                keys_to_delete = cache.keys(pattern)
                for key in keys_to_delete:
                    cache.delete(key)
            else:
                logger.warning(f"Cannot invalidate pattern {pattern} - backend doesn't support it")
                
        except Exception as e:
            logger.error(f"Failed to invalidate cache pattern {pattern}: {str(e)}")
    
    @staticmethod
    def warm_cache(cache_operations):
        """Warm up cache with predefined operations."""
        for operation in cache_operations:
            try:
                cache_key = operation['key']
                query_func = operation['query_func']
                timeout = operation.get('timeout')
                cache_name = operation.get('cache_name', 'default')
                
                CacheManager.cached_query(cache_key, query_func, timeout, cache_name)
                logger.debug(f"Cache warmed for key: {cache_key}")
                
            except Exception as e:
                logger.error(f"Failed to warm cache for operation: {str(e)}")


class DatabaseOptimizer:
    """Database query optimization utilities."""
    
    @staticmethod
    def optimize_queryset(queryset, select_related=None, prefetch_related=None):
        """Apply common optimizations to a queryset."""
        if select_related:
            queryset = queryset.select_related(*select_related)
        
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        return queryset
    
    @staticmethod
    def get_query_analysis():
        """Analyze recent database queries for optimization opportunities."""
        if not settings.DEBUG:
            return {"error": "Query analysis only available in DEBUG mode"}
        
        queries = connection.queries
        
        # Analyze query patterns
        analysis = {
            'total_queries': len(queries),
            'slow_queries': [],
            'duplicate_queries': {},
            'n_plus_one_candidates': []
        }
        
        query_counts = {}
        
        for query in queries:
            sql = query['sql']
            time_taken = float(query['time'])
            
            # Track slow queries
            if time_taken > 0.1:  # 100ms threshold
                analysis['slow_queries'].append({
                    'sql': sql[:200] + '...' if len(sql) > 200 else sql,
                    'time': time_taken
                })
            
            # Track duplicate queries
            if sql in query_counts:
                query_counts[sql] += 1
            else:
                query_counts[sql] = 1
        
        # Find duplicate queries
        for sql, count in query_counts.items():
            if count > 1:
                analysis['duplicate_queries'][sql[:100] + '...'] = count
        
        # Simple N+1 detection (multiple similar SELECT queries)
        select_patterns = {}
        for query in queries:
            sql = query['sql'].strip()
            if sql.startswith('SELECT'):
                # Extract table name pattern
                if 'FROM' in sql:
                    table_part = sql.split('FROM')[1].split()[0].strip('`"')
                    if table_part in select_patterns:
                        select_patterns[table_part] += 1
                    else:
                        select_patterns[table_part] = 1
        
        for table, count in select_patterns.items():
            if count > 5:  # More than 5 queries to same table might indicate N+1
                analysis['n_plus_one_candidates'].append({
                    'table': table,
                    'query_count': count
                })
        
        return analysis


# Decorators for easy use
def monitor_performance(func):
    """Decorator to monitor function performance."""
    return PerformanceMonitor.track_query_performance(func)


def cache_result(timeout=3600, cache_name='default', key_prefix=None):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"cached_{func.__name__}"
            cache_key = CacheManager.get_cache_key(prefix, *args, **kwargs)
            
            # Use cached query
            return CacheManager.cached_query(
                cache_key,
                lambda: func(*args, **kwargs),
                timeout,
                cache_name
            )
        return wrapper
    return decorator