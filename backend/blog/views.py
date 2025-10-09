from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Article, Comment, Category, Tag, CustomUser
from .serializers import ArticleSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer

class CustomPagination(PageNumberPagination):
    page_size = 10  # Number of articles per page
    page_size_query_param = 'page_size'
    max_page_size = 100

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    pagination_class = CustomPagination

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer