"""
Management command to set up cache tables and warm up cache.
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.core.cache import cache, caches
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Set up cache tables and warm up cache with common data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--warmup',
            action='store_true',
            help='Warm up cache with common queries',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all cache before setup',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up cache system...'))
        
        # Clear cache if requested
        if options['clear']:
            self.clear_all_caches()
        
        # Create cache tables
        self.create_cache_tables()
        
        # Warm up cache if requested
        if options['warmup']:
            self.warm_up_cache()
        
        self.stdout.write(self.style.SUCCESS('Cache setup completed successfully!'))
    
    def create_cache_tables(self):
        """Create database cache tables."""
        self.stdout.write('Creating cache tables...')
        
        try:
            # Get all database cache configurations
            db_caches = [
                cache_config for cache_config in settings.CACHES.values()
                if cache_config['BACKEND'] == 'django.core.cache.backends.db.DatabaseCache'
            ]
            
            if not db_caches:
                self.stdout.write(self.style.WARNING('No database cache backends configured'))
                return
            
            # Create cache tables for each database cache
            for cache_config in db_caches:
                table_name = cache_config['LOCATION']
                self.stdout.write(f'Creating cache table: {table_name}')
                
                try:
                    call_command('createcachetable', table_name, verbosity=0)
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Cache table {table_name} created successfully')
                    )
                except Exception as e:
                    if 'already exists' in str(e).lower():
                        self.stdout.write(
                            self.style.WARNING(f'Cache table {table_name} already exists')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to create cache table {table_name}: {str(e)}')
                        )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating cache tables: {str(e)}')
            )
    
    def clear_all_caches(self):
        """Clear all configured caches."""
        self.stdout.write('Clearing all caches...')
        
        try:
            for cache_name in settings.CACHES.keys():
                cache_instance = caches[cache_name]
                cache_instance.clear()
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Cleared cache: {cache_name}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error clearing caches: {str(e)}')
            )
    
    def warm_up_cache(self):
        """Warm up cache with common data."""
        self.stdout.write('Warming up cache...')
        
        try:
            from blog.utils.caching_strategies import CacheWarmupStrategy
            
            # Warm up common queries
            CacheWarmupStrategy.warm_common_queries()
            
            self.stdout.write(
                self.style.SUCCESS('✓ Cache warmed up successfully')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error warming up cache: {str(e)}')
            )
    
    def test_cache_functionality(self):
        """Test that cache is working properly."""
        self.stdout.write('Testing cache functionality...')
        
        try:
            # Test default cache
            test_key = 'cache_test_key'
            test_value = 'cache_test_value'
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value == test_value:
                self.stdout.write(
                    self.style.SUCCESS('✓ Default cache is working correctly')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('✗ Default cache test failed')
                )
            
            # Clean up test key
            cache.delete(test_key)
            
            # Test other caches
            for cache_name in settings.CACHES.keys():
                if cache_name != 'default':
                    cache_instance = caches[cache_name]
                    cache_instance.set(test_key, test_value, 60)
                    retrieved_value = cache_instance.get(test_key)
                    
                    if retrieved_value == test_value:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Cache {cache_name} is working correctly')
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'✗ Cache {cache_name} test failed')
                        )
                    
                    cache_instance.delete(test_key)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error testing cache: {str(e)}')
            )