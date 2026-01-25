"""Admin views"""
from django.db import models
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Article, Comment, Category, Tag, CustomUser, Feedback, VisitorCount, Visit
from ..serializers import (
    ArticleSerializer, CommentSerializer, CategorySerializer, 
    TagSerializer, CustomUserSerializer, FeedbackSerializer
)
from .base import UserPagination, FeedbackPagination, CommentPagination


class AdminArticleViewSet(viewsets.ModelViewSet):
    """Admin article management"""
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author__username', 'category__name']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class AdminCommentViewSet(viewsets.ModelViewSet):
    """Admin comment management"""
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [IsAdminUser]
    pagination_class = CommentPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['approved', 'is_flagged', 'article']
    search_fields = ['content', 'author__username', 'article__title']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve comment"""
        comment = self.get_object()
        comment.approved = True
        comment.save()
        return Response({'status': 'comment approved'})

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag comment"""
        comment = self.get_object()
        comment.is_flagged = True
        comment.save()
        return Response({'status': 'comment flagged'})


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = UserPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

    def perform_create(self, serializer):
        user_type = serializer.validated_data.get('user_type')
        is_staff = user_type == 'admin'
        is_superuser = user_type == 'admin'
        serializer.save(is_staff=is_staff, is_superuser=is_superuser)

    def perform_update(self, serializer):
        user_type = serializer.validated_data.get('user_type', serializer.instance.user_type)
        is_staff = user_type == 'admin'
        is_superuser = user_type == 'admin'
        serializer.save(is_staff=is_staff, is_superuser=is_superuser)


class AdminFeedbackViewSet(viewsets.ModelViewSet):
    """Admin feedback management"""
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]
    pagination_class = FeedbackPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'message']


class AdminDashboardView(APIView):
    """Admin dashboard data"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            # Basic stats
            total_visitors = 0
            if VisitorCount.objects.exists():
                visitor_count = VisitorCount.objects.first()
                total_visitors = visitor_count.count if visitor_count else 0
            
            total_articles = Article.objects.count()
            total_comments = Comment.objects.count()
            total_users = CustomUser.objects.count()
            total_categories = Category.objects.count()
            total_tags = Tag.objects.count()
            
            # Pending and flagged comments
            pending_comments = Comment.objects.filter(approved=False).count()
            flagged_comments = Comment.objects.filter(is_flagged=True).count()
            
            # Inactive users (users who haven't logged in for 30+ days or never)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            inactive_users = CustomUser.objects.filter(
                models.Q(last_login__lt=thirty_days_ago) | models.Q(last_login__isnull=True),
                is_active=True
            ).count()

            # Recent data
            recent_articles = Article.objects.select_related('author', 'category').order_by('-created_at')[:5]
            recent_comments = Comment.objects.select_related('author', 'article').order_by('-created_at')[:5]
            recently_registered_users = CustomUser.objects.order_by('-date_joined')[:5]
            recent_categories = Category.objects.order_by('-id')[:5]
            recent_tags = Tag.objects.order_by('-created_at')[:5]

            # Weekly stats
            last_7_days = timezone.now().date() - timedelta(days=7)
            weekly_visits = Visit.objects.filter(date__gte=last_7_days).aggregate(
                total=models.Sum('count')
            )['total'] or 0
            
            # Articles and comments this week
            last_week = timezone.now() - timedelta(days=7)
            articles_this_week = Article.objects.filter(created_at__gte=last_week).count()
            comments_this_week = Comment.objects.filter(created_at__gte=last_week).count()

            # Top authors (by article count)
            top_authors_data = CustomUser.objects.annotate(
                article_count=Count('articles')
            ).filter(article_count__gt=0).order_by('-article_count')[:5]
            
            # Convert to list with total_articles field
            top_authors = []
            for author in top_authors_data:
                author_data = CustomUserSerializer(author, context={'request': request}).data
                author_data['total_articles'] = author.article_count
                top_authors.append(author_data)
            
            # Most viewed articles
            most_viewed_articles = Article.objects.filter(
                status='published'
            ).order_by('-views')[:5]
            
            # Most liked articles (using comment count as proxy for likes)
            most_liked_articles_data = Article.objects.annotate(
                comment_count=Count('comments')
            ).filter(status='published').order_by('-comment_count')[:5]
            
            # Convert to list with likes field
            most_liked_articles = []
            for article in most_liked_articles_data:
                article_data = ArticleSerializer(article, context={'request': request}).data
                article_data['likes'] = article.comment_count  # Using comment count as likes
                most_liked_articles.append(article_data)
            
            # Average stats
            avg_views_per_article = Article.objects.aggregate(
                avg_views=Avg('views')
            )['avg_views'] or 0
            
            avg_comments_per_article = Article.objects.annotate(
                comment_count=Count('comments')
            ).aggregate(
                avg_comments=Avg('comment_count')
            )['avg_comments'] or 0

            data = {
                'total_visitors': total_visitors,
                'total_articles': total_articles,
                'total_comments': total_comments,
                'total_categories': total_categories,
                'total_tags': total_tags,
                'pending_comments': pending_comments,
                'flagged_comments': flagged_comments,
                'inactive_users': inactive_users,
                'weekly_visits': weekly_visits,
                'articles_this_week': articles_this_week,
                'comments_this_week': comments_this_week,
                'avg_views_per_article': float(avg_views_per_article),
                'avg_comments_per_article': float(avg_comments_per_article),
                'recent_articles': ArticleSerializer(recent_articles, many=True, context={'request': request}).data,
                'recent_comments': CommentSerializer(recent_comments, many=True, context={'request': request}).data,
                'recently_registered_users': CustomUserSerializer(recently_registered_users, many=True, context={'request': request}).data,
                'recent_categories': CategorySerializer(recent_categories, many=True, context={'request': request}).data,
                'recent_tags': TagSerializer(recent_tags, many=True, context={'request': request}).data,
                'top_authors': top_authors,
                'most_viewed_articles': ArticleSerializer(most_viewed_articles, many=True, context={'request': request}).data,
                'most_liked_articles': most_liked_articles,
            }
            return Response(data)
        except Exception as e:
            # Log the error and return a proper error response
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Dashboard data fetch error: {str(e)}")
            
            return Response(
                {
                    'error': 'Failed to fetch dashboard data',
                    'message': str(e),
                    'total_visitors': 0,
                    'total_articles': 0,
                    'total_comments': 0,
                    'total_categories': 0,
                    'total_tags': 0,
                    'pending_comments': 0,
                    'flagged_comments': 0,
                    'inactive_users': 0,
                    'weekly_visits': 0,
                    'articles_this_week': 0,
                    'comments_this_week': 0,
                    'avg_views_per_article': 0,
                    'avg_comments_per_article': 0,
                    'recent_articles': [],
                    'recent_comments': [],
                    'recently_registered_users': [],
                    'recent_categories': [],
                    'recent_tags': [],
                    'top_authors': [],
                    'most_viewed_articles': [],
                    'most_liked_articles': [],
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )