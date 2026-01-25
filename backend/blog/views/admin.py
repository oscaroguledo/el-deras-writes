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
from .base import UserPagination, FeedbackPagination


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['approved', 'is_flagged', 'article']
    search_fields = ['content', 'author__username', 'article__title']

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve comment"""
        comment = self.get_object()
        comment.approved = True
        comment.moderated_by = request.user
        comment.moderated_at = timezone.now()
        comment.save()
        return Response({'status': 'comment approved'})

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag comment"""
        comment = self.get_object()
        comment.is_flagged = True
        comment.moderated_by = request.user
        comment.moderated_at = timezone.now()
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
        # Basic stats
        total_visitors = VisitorCount.objects.first().count if VisitorCount.objects.exists() else 0
        total_articles = Article.objects.count()
        total_comments = Comment.objects.count()
        total_users = CustomUser.objects.count()

        # Recent data
        recent_articles = Article.objects.order_by('-created_at')[:5]
        recent_comments = Comment.objects.order_by('-created_at')[:5]
        recent_users = CustomUser.objects.order_by('-date_joined')[:5]

        # Weekly stats
        last_7_days = timezone.now().date() - timedelta(days=7)
        weekly_visits = Visit.objects.filter(date__gte=last_7_days).aggregate(
            total=models.Sum('count')
        )['total'] or 0

        data = {
            'total_visitors': total_visitors,
            'total_articles': total_articles,
            'total_comments': total_comments,
            'total_users': total_users,
            'recent_articles': ArticleSerializer(recent_articles, many=True).data,
            'recent_comments': CommentSerializer(recent_comments, many=True).data,
            'recent_users': CustomUserSerializer(recent_users, many=True).data,
            'weekly_visits': weekly_visits,
        }
        return Response(data)