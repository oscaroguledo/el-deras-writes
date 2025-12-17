"""
Frontend-optimized API views for enhanced frontend integration
"""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import AccessToken
from django.db.models import Q, Count, Prefetch
from django.core.cache import cache
from .models import CustomUser, Article, Comment, Category, Tag, Analytics
from .serializers import (
    ArticleSerializer, CommentSerializer, CategorySerializer, 
    TagSerializer, CustomUserSerializer
)
import json
import logging

logger = logging.getLogger(__name__)


class FrontendStateAPIView(APIView):
    """
    API endpoint optimized for frontend state synchronization
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Get complete application state data for frontend initialization
        """
        try:
            # Cache key for state data
            cache_key = 'frontend_state_data'
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            # Build comprehensive state data
            state_data = {
                'categories': self.get_categories_data(),
                'tags': self.get_tags_data(),
                'recent_articles': self.get_recent_articles_data(),
                'featured_articles': self.get_featured_articles_data(),
                'site_stats': self.get_site_stats(),
                'user_context': self.get_user_context(request),
                'timestamp': timezone.now().isoformat(),
            }
            
            # Cache for 5 minutes
            cache.set(cache_key, state_data, 300)
            
            return Response(state_data)
            
        except Exception as e:
            logger.error(f"Frontend state API error: {str(e)}")
            return Response(
                {'error': 'Failed to load application state'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_categories_data(self):
        """Get optimized categories data for frontend"""
        categories = Category.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published'))
        ).order_by('name')
        
        return CategorySerializer(categories, many=True).data
    
    def get_tags_data(self):
        """Get optimized tags data for frontend"""
        tags = Tag.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published'))
        ).filter(article_count__gt=0).order_by('-article_count')[:20]
        
        return TagSerializer(tags, many=True).data
    
    def get_recent_articles_data(self):
        """Get recent articles optimized for frontend"""
        articles = Article.objects.filter(
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by(
            '-published_at', '-created_at'
        )[:10]
        
        return ArticleSerializer(articles, many=True).data
    
    def get_featured_articles_data(self):
        """Get featured articles for frontend"""
        articles = Article.objects.filter(
            status='published',
            featured=True
        ).select_related('author', 'category').prefetch_related('tags').order_by(
            '-created_at'
        )[:5]
        
        return ArticleSerializer(articles, many=True).data
    
    def get_site_stats(self):
        """Get site statistics for frontend"""
        return {
            'total_articles': Article.objects.filter(status='published').count(),
            'total_categories': Category.objects.count(),
            'total_tags': Tag.objects.count(),
        }
    
    def get_user_context(self, request):
        """Get user context for frontend state"""
        if request.user.is_authenticated:
            return {
                'authenticated': True,
                'user': CustomUserSerializer(request.user).data,
                'permissions': {
                    'can_create_articles': request.user.is_staff,
                    'can_moderate_comments': request.user.is_staff,
                    'can_manage_categories': request.user.is_staff,
                }
            }
        
        return {
            'authenticated': False,
            'user': None,
            'permissions': {
                'can_create_articles': False,
                'can_moderate_comments': False,
                'can_manage_categories': False,
            }
        }


class FrontendValidationAPIView(APIView):
    """
    API endpoint for frontend validation with field-specific error messages
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Validate data and return structured field-specific errors
        """
        try:
            validation_type = request.data.get('type')
            data = request.data.get('data', {})
            
            if validation_type == 'article':
                return self.validate_article_data(data)
            elif validation_type == 'comment':
                return self.validate_comment_data(data)
            elif validation_type == 'user':
                return self.validate_user_data(data)
            elif validation_type == 'category':
                return self.validate_category_data(data)
            elif validation_type == 'tag':
                return self.validate_tag_data(data)
            else:
                return Response(
                    {
                        'type': ['Invalid validation type. Must be one of: article, comment, user, category, tag']
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Frontend validation API error: {str(e)}")
            return Response(
                {'error': 'Validation service temporarily unavailable'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def validate_article_data(self, data):
        """Validate article data with field-specific errors"""
        errors = {}
        
        # Title validation
        title = data.get('title', '').strip()
        if not title:
            errors['title'] = ['Title is required']
        elif len(title) > 255:
            errors['title'] = ['Title must be 255 characters or less']
        
        # Content validation
        content = data.get('content', '').strip()
        if not content:
            errors['content'] = ['Content is required']
        elif len(content) < 10:
            errors['content'] = ['Content must be at least 10 characters long']
        
        # Category validation
        category_name = data.get('category_name', '').strip()
        if category_name and len(category_name) > 100:
            errors['category_name'] = ['Category name must be 100 characters or less']
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True})
    
    def validate_comment_data(self, data):
        """Validate comment data with field-specific errors"""
        errors = {}
        
        # Content validation
        content = data.get('content', '').strip()
        if not content:
            errors['content'] = ['Comment content is required']
        elif len(content) < 3:
            errors['content'] = ['Comment must be at least 3 characters long']
        elif len(content) > 1000:
            errors['content'] = ['Comment must be 1000 characters or less']
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True})
    
    def validate_user_data(self, data):
        """Validate user data with field-specific errors"""
        errors = {}
        
        # Email validation
        email = data.get('email', '').strip()
        if not email:
            errors['email'] = ['Email is required']
        elif '@' not in email or '.' not in email:
            errors['email'] = ['Enter a valid email address']
        elif len(email) > 254:
            errors['email'] = ['Email must be 254 characters or less']
        
        # Username validation
        username = data.get('username', '').strip()
        if not username:
            errors['username'] = ['Username is required']
        elif len(username) < 3:
            errors['username'] = ['Username must be at least 3 characters long']
        elif len(username) > 150:
            errors['username'] = ['Username must be 150 characters or less']
        
        # Password validation
        password = data.get('password', '')
        if password and len(password) < 8:
            errors['password'] = ['Password must be at least 8 characters long']
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True})
    
    def validate_category_data(self, data):
        """Validate category data with field-specific errors"""
        errors = {}
        
        # Name validation
        name = data.get('name', '').strip()
        if not name:
            errors['name'] = ['Category name is required']
        elif len(name) > 100:
            errors['name'] = ['Category name must be 100 characters or less']
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True})
    
    def validate_tag_data(self, data):
        """Validate tag data with field-specific errors"""
        errors = {}
        
        # Name validation
        name = data.get('name', '').strip()
        if not name:
            errors['name'] = ['Tag name is required']
        elif len(name) > 50:
            errors['name'] = ['Tag name must be 50 characters or less']
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'valid': True})


class FrontendAuthContextAPIView(APIView):
    """
    API endpoint for frontend authentication context management
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get complete authentication context for frontend
        """
        try:
            # Get token information
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            token_info = {}
            
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    validated_token = AccessToken(token)
                    token_info = {
                        'expires_at': validated_token.payload.get('exp'),
                        'issued_at': validated_token.payload.get('iat'),
                        'token_type': validated_token.payload.get('token_type'),
                        'jti': validated_token.payload.get('jti'),
                    }
                except Exception:
                    pass
            
            # Build complete auth context
            auth_context = {
                'user': CustomUserSerializer(request.user).data,
                'token': token_info,
                'permissions': {
                    'is_authenticated': True,
                    'is_staff': request.user.is_staff,
                    'is_superuser': request.user.is_superuser,
                    'can_create_articles': request.user.is_staff,
                    'can_edit_articles': request.user.is_staff,
                    'can_delete_articles': request.user.is_staff,
                    'can_moderate_comments': request.user.is_staff,
                    'can_manage_users': request.user.is_superuser,
                    'can_manage_categories': request.user.is_staff,
                    'can_manage_tags': request.user.is_staff,
                    'can_view_analytics': request.user.is_staff,
                },
                'session': {
                    'last_active': request.user.last_active,
                    'date_joined': request.user.date_joined,
                    'user_type': request.user.user_type,
                },
                'preferences': getattr(request.user, 'preferences', {}),
                'timestamp': timezone.now().isoformat(),
            }
            
            return Response(auth_context)
            
        except Exception as e:
            logger.error(f"Frontend auth context API error: {str(e)}")
            return Response(
                {'error': 'Failed to load authentication context'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FrontendConflictResolutionAPIView(APIView):
    """
    API endpoint for handling frontend conflict resolution
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Handle conflict resolution for concurrent edits
        """
        try:
            conflict_type = request.data.get('type')
            resource_id = request.data.get('resource_id')
            client_version = request.data.get('client_version')
            proposed_changes = request.data.get('changes', {})
            
            if conflict_type == 'article_edit':
                return self.resolve_article_conflict(resource_id, client_version, proposed_changes, request.user)
            elif conflict_type == 'comment_edit':
                return self.resolve_comment_conflict(resource_id, client_version, proposed_changes, request.user)
            elif conflict_type == 'profile_edit':
                return self.resolve_profile_conflict(resource_id, client_version, proposed_changes, request.user)
            else:
                return Response(
                    {'error': 'Invalid conflict type'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Frontend conflict resolution API error: {str(e)}")
            return Response(
                {'error': 'Conflict resolution service temporarily unavailable'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def resolve_article_conflict(self, article_id, client_version, proposed_changes, user):
        """Resolve article edit conflicts"""
        try:
            article = Article.objects.get(id=article_id)
            
            # Check if user has permission to edit
            if not (user.is_staff or article.author == user):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get current server version (using updated_at as version)
            server_version = article.updated_at.isoformat()
            
            # Check for conflicts
            if client_version != server_version:
                # Conflict detected
                return Response({
                    'conflict': True,
                    'server_version': server_version,
                    'server_data': ArticleSerializer(article).data,
                    'client_changes': proposed_changes,
                    'resolution_options': [
                        'overwrite_server',
                        'merge_changes',
                        'keep_server_version'
                    ],
                    'message': 'Article has been modified by another user. Please review changes and choose resolution.'
                })
            
            # No conflict, changes can be applied
            return Response({
                'conflict': False,
                'can_apply': True,
                'message': 'No conflicts detected. Changes can be applied.'
            })
            
        except Article.DoesNotExist:
            return Response(
                {'error': 'Article not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def resolve_comment_conflict(self, comment_id, client_version, proposed_changes, user):
        """Resolve comment edit conflicts"""
        try:
            comment = Comment.objects.get(id=comment_id)
            
            # Check if user has permission to edit
            if not (user.is_staff or comment.author == user):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get current server version
            server_version = comment.updated_at.isoformat()
            
            # Check for conflicts
            if client_version != server_version:
                return Response({
                    'conflict': True,
                    'server_version': server_version,
                    'server_data': CommentSerializer(comment).data,
                    'client_changes': proposed_changes,
                    'message': 'Comment has been modified. Please review changes.'
                })
            
            return Response({
                'conflict': False,
                'can_apply': True,
                'message': 'No conflicts detected.'
            })
            
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Comment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def resolve_profile_conflict(self, user_id, client_version, proposed_changes, requesting_user):
        """Resolve user profile edit conflicts"""
        try:
            user = CustomUser.objects.get(id=user_id)
            
            # Check if user has permission to edit
            if not (requesting_user.is_staff or user == requesting_user):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # For user profiles, we'll use a simple timestamp-based versioning
            # In a real system, you might use a dedicated version field
            server_version = user.date_joined.isoformat()  # Simplified versioning
            
            # Check for conflicts (simplified)
            if client_version and client_version != server_version:
                return Response({
                    'conflict': True,
                    'server_version': server_version,
                    'server_data': CustomUserSerializer(user).data,
                    'client_changes': proposed_changes,
                    'message': 'Profile has been modified. Please review changes.'
                })
            
            return Response({
                'conflict': False,
                'can_apply': True,
                'message': 'No conflicts detected.'
            })
            
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class FrontendAnalyticsAPIView(APIView):
    """
    API endpoint for frontend analytics and metrics
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Get analytics data optimized for frontend consumption
        """
        try:
            # Cache key for analytics
            cache_key = 'frontend_analytics_data'
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            # Build analytics data
            analytics_data = {
                'content_stats': {
                    'total_articles': Article.objects.filter(status='published').count(),
                    'total_comments': Comment.objects.filter(approved=True).count(),
                    'total_categories': Category.objects.count(),
                    'total_tags': Tag.objects.count(),
                },
                'popular_content': {
                    'most_viewed_articles': self.get_popular_articles('views'),
                    'most_liked_articles': self.get_popular_articles('likes'),
                    'most_commented_articles': self.get_most_commented_articles(),
                },
                'recent_activity': {
                    'recent_articles': self.get_recent_activity('articles'),
                    'recent_comments': self.get_recent_activity('comments'),
                },
                'categories_stats': self.get_categories_stats(),
                'tags_stats': self.get_tags_stats(),
                'timestamp': timezone.now().isoformat(),
            }
            
            # Cache for 10 minutes
            cache.set(cache_key, analytics_data, 600)
            
            return Response(analytics_data)
            
        except Exception as e:
            logger.error(f"Frontend analytics API error: {str(e)}")
            return Response(
                {'error': 'Analytics service temporarily unavailable'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_popular_articles(self, metric):
        """Get popular articles by specified metric"""
        articles = Article.objects.filter(
            status='published'
        ).select_related('author', 'category').order_by(f'-{metric}')[:5]
        
        return [{
            'id': str(article.id),
            'title': article.title,
            'slug': article.slug,
            'author': article.author.username,
            'category': article.category.name if article.category else None,
            metric: getattr(article, metric, 0),
        } for article in articles]
    
    def get_most_commented_articles(self):
        """Get articles with most comments"""
        articles = Article.objects.filter(
            status='published'
        ).annotate(
            comment_count=Count('comments', filter=Q(comments__approved=True))
        ).select_related('author', 'category').order_by('-comment_count')[:5]
        
        return [{
            'id': str(article.id),
            'title': article.title,
            'slug': article.slug,
            'author': article.author.username,
            'category': article.category.name if article.category else None,
            'comment_count': article.comment_count,
        } for article in articles]
    
    def get_recent_activity(self, activity_type):
        """Get recent activity data"""
        if activity_type == 'articles':
            items = Article.objects.filter(
                status='published'
            ).select_related('author', 'category').order_by('-created_at')[:5]
            
            return [{
                'id': str(item.id),
                'title': item.title,
                'author': item.author.username,
                'created_at': item.created_at.isoformat(),
            } for item in items]
        
        elif activity_type == 'comments':
            items = Comment.objects.filter(
                approved=True
            ).select_related('author', 'article').order_by('-created_at')[:5]
            
            return [{
                'id': str(item.id),
                'content': item.content[:100] + '...' if len(item.content) > 100 else item.content,
                'author': item.author.username if item.author else 'Anonymous',
                'article_title': item.article.title,
                'created_at': item.created_at.isoformat(),
            } for item in items]
        
        return []
    
    def get_categories_stats(self):
        """Get category statistics"""
        categories = Category.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published'))
        ).order_by('-article_count')[:10]
        
        return [{
            'id': str(category.id),
            'name': category.name,
            'article_count': category.article_count,
        } for category in categories]
    
    def get_tags_stats(self):
        """Get tag statistics"""
        tags = Tag.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published'))
        ).filter(article_count__gt=0).order_by('-article_count')[:10]
        
        return [{
            'id': str(tag.id),
            'name': tag.name,
            'article_count': tag.article_count,
        } for tag in tags]