from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from django.db import models
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount
from .serializers import ArticleSerializer,ContactInfoSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer, VisitorCountSerializer
from blog.permissions import IsAdminOrReadOnly, IsAuthorOrAdmin
from rest_framework.decorators import action
from rest_framework import filters # Import filters

class ArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = ArticlePagination
    filter_backends = [filters.SearchFilter] # Add SearchFilter
    search_fields = ['title', 'content', 'author__username', 'category__name'] # Define search fields

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name=category)
        return queryset

