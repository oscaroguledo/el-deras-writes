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

