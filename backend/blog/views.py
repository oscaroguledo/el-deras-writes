from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from django.db import models
from django.db.models import Q
from .models import Article, Comment, Category, Tag, CustomUser, ContactInfo, VisitorCount, Visit
from .serializers import ArticleSerializer, ContactInfoSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer, VisitorCountSerializer, MyTokenObtainPairSerializer
from blog.permissions import IsAdminOrReadOnly, IsAuthorOrAdmin
from rest_framework.decorators import action
from rest_framework import filters # Import filters
from django.utils import timezone
from datetime import timedelta
import uuid
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class ArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserPagination(PageNumberPagination):
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

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

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
    queryset = CustomUser.objects.all().order_by('-date_joined') # Order by recently created
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = UserPagination # Apply pagination

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

class AdminArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at') # Order by recently created
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'author__username', 'category__name']

class AdminCommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at') # Order by recently created
    serializer_class = CommentSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['content', 'author__username', 'article__title']

class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-id') # Categories don't have created_at, order by id
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class AdminTagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('-created_at') # Order by recently created
    serializer_class = TagSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('-date_joined') # Order by recently created
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = UserPagination # Apply pagination
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
                social_media_links={ # Initialize with an empty dictionary
                    "whatsapp": "https://wa.me/1234567890",
                    "tiktok": "https://tiktok.com/@example",
                    "instagram": "https://instagram.com/example",
                    "facebook": "https://facebook.com/example"
                }
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

class IncrementVisitorCountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        today = timezone.now().date()
        visit, created = Visit.objects.get_or_create(date=today)
        if not created:
            visit.count += 1
            visit.save()
        # Use a fixed UUID for the single VisitorCount instance
        # This ensures we always get or create the same instance
        fixed_uuid = uuid.UUID('00000000-0000-0000-0000-000000000001') # Example fixed UUID
        total_visitor_count, _ = VisitorCount.objects.get_or_create(id=fixed_uuid)

        total_visitor_count.count += 1
        total_visitor_count.save()

        # Serialize the total visitor count, or the daily visit count, depending on what the frontend expects
        # For now, let's return the total visitor count as before
        serializer = VisitorCountSerializer(total_visitor_count)
        return Response(serializer.data)

class SuperuserCreateView(APIView):
    permission_classes = [AllowAny] # Allow anyone to create the first superuser, but ideally this would be restricted

    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            if CustomUser.objects.filter(email=email).exists():
                return Response({"detail": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            if CustomUser.objects.filter(username=username).exists():
                return Response({"detail": "User with this username already exists."}, status=status.HTTP_400_BAD_REQUEST)

            user = CustomUser.objects.create(
                email=email,
                username=username,
                user_type='admin',
                is_staff=True,
                is_superuser=True,
            )
            user.set_password(password)
            user.save()
            return Response(CustomUserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_visitors = VisitorCount.objects.first().count if VisitorCount.objects.exists() else 0
        recently_registered_users = CustomUser.objects.order_by('-date_joined')[:5]
        recent_articles = Article.objects.order_by('-created_at')[:5]
        recent_comments = Comment.objects.order_by('-created_at')[:5]
        recent_categories = Category.objects.annotate(article_count=models.Count('article')).order_by('-article_count')[:5]
        recent_tags = Tag.objects.annotate(article_count=models.Count('article')).order_by('-article_count')[:5]
        top_authors = CustomUser.objects.filter(articles__isnull=False).annotate(
            total_articles=models.Count('articles'),
            total_comments=models.Count('articles__comments')
        ).order_by('-total_articles')[:5]

        most_viewed_articles = Article.objects.order_by('-views')[:5]
        most_liked_articles = Article.objects.order_by('-likes')[:5]
        today = timezone.now().date()
        last_7_days = today - timedelta(days=7)

        weekly_visits = Visit.objects.filter(date__gte=last_7_days).aggregate(
            total=models.Sum('count')
        )['total'] or 0

        articles_this_week = Article.objects.filter(created_at__gte=last_7_days).count()
        comments_this_week = Comment.objects.filter(created_at__gte=last_7_days).count()
        pending_comments = Comment.objects.filter(approved=False).count()
        flagged_comments = Comment.objects.filter(is_flagged=True).count()
        inactive_users = CustomUser.objects.filter(last_active__lt=last_7_days).count()
        avg_views_per_article = Article.objects.aggregate(avg=models.Avg('views'))['avg']
        avg_comments_per_article = Comment.objects.aggregate(avg=models.Avg('article__comments'))['avg']
        total_articles = Article.objects.count()
        total_comments = Comment.objects.count()
        total_categories = Category.objects.count()
        total_tags = Tag.objects.count()

        data = {
            'total_visitors': total_visitors,
            'total_articles': total_articles,
            'total_comments': total_comments,
            'total_categories': total_categories,
            'total_tags': total_tags,
            'recently_registered_users': CustomUserSerializer(recently_registered_users, many=True).data,
            'recent_articles': ArticleSerializer(recent_articles, many=True).data,
            'recent_comments': CommentSerializer(recent_comments, many=True).data,
            'recent_categories': CategorySerializer(recent_categories, many=True).data,
            'recent_tags': TagSerializer(recent_tags, many=True).data,
            'top_authors': CustomUserSerializer(top_authors, many=True).data,
            'most_viewed_articles': ArticleSerializer(most_viewed_articles, many=True).data,
            'most_liked_articles': ArticleSerializer(most_liked_articles, many=True).data,
            'weekly_visits': weekly_visits,
            'articles_this_week': articles_this_week,
            'comments_this_week': comments_this_week,
            'pending_comments': pending_comments,
            'flagged_comments': flagged_comments,
            'inactive_users': inactive_users,
            'avg_views_per_article': avg_views_per_article,
            'avg_comments_per_article': avg_comments_per_article,
        }
        return Response(data)

class AdminSearchView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response([])

        results = []

        # Search Articles
        article_qs = Article.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        ).distinct()
        for article in article_qs:
            results.append({
                'type': 'Article',
                'id': article.id,
                'title': article.title,
                'url': f'/admin/articles/edit/{article.id}'
            })

        # Search Users
        user_qs = CustomUser.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
        ).distinct()
        for user in user_qs:
            results.append({
                'type': 'User',
                'id': user.id,
                'title': user.username,
                'url': f'/admin/users/edit/{user.id}'
            })

        # Search Categories
        category_qs = Category.objects.filter(name__icontains=query).distinct()
        for category in category_qs:
            results.append({
                'type': 'Category',
                'id': category.id,
                'title': category.name,
                'url': '/admin/categories-tags'
            })

        # Search Tags
        tag_qs = Tag.objects.filter(name__icontains=query).distinct()
        for tag in tag_qs:
            results.append({
                'type': 'Tag',
                'id': tag.id,
                'title': tag.name,
                'url': '/admin/categories-tags'
            })

        return Response(results)

