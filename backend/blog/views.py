from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from django.db import models
from .models import Article, Comment, Category, Tag, CustomUser, ContactInfo, VisitorCount
from .serializers import ArticleSerializer, ContactInfoSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer, VisitorCountSerializer
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

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        article_id = self.kwargs.get('article_pk')
        article = Article.objects.get(pk=article_id)
        serializer.save(author=self.request.user, article=article)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'])
    def top_five(self, request):
        top_categories = Category.objects.annotate(
            article_count=models.Count('article')
        ).order_by('-article_count')[:5]
        serializer = self.get_serializer(top_categories, many=True)
        return Response(serializer.data)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminOrReadOnly]

class AdminArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]

class AdminCommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAdminUser]

class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]

class AdminTagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminUser]

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]

class ContactInfoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        contact_info = ContactInfo.objects.first()
        if not contact_info:
            # Create a default ContactInfo object if none exists
            contact_info = ContactInfo.objects.create(
                address="123 Main St, Anytown, USA",
                phone="+1234567890",
                email="info@example.com",
                whatsapp_link="https://wa.me/1234567890",
                tiktok_link="https://tiktok.com/@example",
                instagram_link="https://instagram.com/example",
                facebook_link="https://facebook.com/example"
            )
        serializer = ContactInfoSerializer(contact_info)
        return Response(serializer.data)

    def patch(self, request):
        self.permission_classes = [IsAdminUser]
        self.check_permissions(request)
        contact_info = ContactInfo.objects.first()
        if not contact_info:
            return Response({"detail": "Contact info not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ContactInfoSerializer(contact_info, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return Response({"message": "Login successful", "user": CustomUserSerializer(user).data})
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class IncrementVisitorCountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        visitor_count, created = VisitorCount.objects.get_or_create(pk=1)
        visitor_count.count += 1
        visitor_count.save()
        serializer = VisitorCountSerializer(visitor_count)
        return Response(serializer.data)

