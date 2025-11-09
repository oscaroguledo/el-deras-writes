from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from .models import Article, Comment, Category, Tag, CustomUser,ContactInfo, VisitorCount
from .serializers import ArticleSerializer,ContactInfoSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer, VisitorCountSerializer
from blog.permissions import IsAdminOrReadOnly, IsAuthorOrAdmin

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

    def get_queryset(self):
        return self.queryset.filter(article_id=self.kwargs['article_pk'])

    def perform_create(self, serializer):
        article = Article.objects.get(pk=self.kwargs['article_pk'])
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user, article=article)
        else:
            ip_address = self.request.META.get('REMOTE_ADDR') or self.request.META.get('HTTP_X_FORWARDED_FOR')
            guest_username = f'guest_{ip_address}'
            guest_user, created = CustomUser.objects.get_or_create(
                username=guest_username,
                defaults={'user_type': 'guest', 'ip_address': ip_address}
            )
            serializer.save(author=guest_user, ip_address=ip_address, article=article)

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
        total_visitors = VisitorCount.objects.first().count if VisitorCount.objects.exists() else 0
        data = {
            "total_users": CustomUser.objects.count(),
            "total_articles": Article.objects.count(),
            "total_comments": Comment.objects.count(),
            "total_categories": Category.objects.count(),
            "total_tags": Tag.objects.count(),
            "total_visitors": total_visitors, # Added total_visitors
            "recently_registered_users": CustomUser.objects.order_by('-date_joined')[:5].values('id', 'username', 'email'),
            "recent_articles": Article.objects.order_by('-created_at')[:5].values('id', 'title', 'author__username', 'created_at'),
            "recent_comments": Comment.objects.order_by('-created_at')[:5].values('id', 'article__title', 'author__username', 'created_at'),
            "recent_categories": Category.objects.order_by('-id')[:5].values('id', 'name'),
            "recent_tags": Tag.objects.order_by('-id')[:5].values('id', 'name'),
            "recent_visitors": [],  # Placeholder for recent visitors data
            "total_visitors_by_date": {}  # Placeholder for visitor statistics
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

class ContactInfoView(APIView):
    def get(self, request):
        contact_info = ContactInfo.objects.first()
        if contact_info:
            serializer = ContactInfoSerializer(contact_info)
            return Response(serializer.data)
        return Response({}, status=status.HTTP_200_OK)

    def patch(self, request):
        # Only admin users can update contact info
        permission_classes = [IsAdminUser]
        contact_info = ContactInfo.objects.first()
        if not contact_info:
            # If no ContactInfo exists, create one
            serializer = ContactInfoSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = ContactInfoSerializer(contact_info, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IncrementVisitorCountView(APIView):
    def post(self, request):
        visitor_count, created = VisitorCount.objects.get_or_create(pk=1)
        visitor_count.count += 1
        visitor_count.save()
        serializer = VisitorCountSerializer(visitor_count)
        return Response(serializer.data, status=status.HTTP_200_OK)
