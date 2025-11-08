from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from .models import Article, Comment, Category, Tag, CustomUser
from .serializers import ArticleSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer
from .permissions import IsAdminUser, IsAdminOrReadOnly, IsAuthorOrAdmin

class CustomPagination(PageNumberPagination):
    page_size = 10  # Number of articles per page
    page_size_query_param = 'page_size'
    max_page_size = 100

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    pagination_class = CustomPagination
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrAdmin]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrAdmin]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

# Additional admin-specific viewsets can be added here if needed
class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        # Implement logic to return admin dashboard data
        data = {
            "total_users": CustomUser.objects.count(),
            "total_articles": Article.objects.count(),
            "total_comments": Comment.objects.count(),
            "total_categories": Category.objects.count(),
            "total_tags": Tag.objects.count(),
        }
        return Response(data)   
class AdminArticleViewSet(ArticleViewSet):
    permission_classes = [IsAdminUser]
class AdminCategoryViewSet(CategoryViewSet):
    permission_classes = [IsAdminUser]
class AdminTagViewSet(TagViewSet):
    permission_classes = [IsAdminUser]
class AdminUserViewSet(CustomUserViewSet):
    permission_classes = [IsAdminUser]
class AdminCommentViewSet(CommentViewSet):
    permission_classes = [IsAdminUser]