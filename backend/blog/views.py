from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from django.db import models
from django.db.models import Q, Count, Avg, F, Prefetch
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.exceptions import ValidationError
from .models import Article, Comment, Category, Tag, CustomUser, ContactInfo, VisitorCount, Visit, Feedback, Analytics, ArticleRevision
from .serializers import ArticleSerializer, ContactInfoSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer, VisitorCountSerializer, MyTokenObtainPairSerializer, FeedbackSerializer
from blog.permissions import IsAdminOrReadOnly, IsAuthorOrAdmin
from rest_framework.decorators import action
from rest_framework import filters
from django.utils import timezone
from datetime import timedelta
import uuid
import json
import base64
from PIL import Image
import io
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """Enhanced token obtain with real-time authentication broadcasting"""
        response = super().post(request, *args, **kwargs)
        
        # If authentication was successful, broadcast the event
        if response.status_code == 200:
            # Get user from the serializer
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.user
                # Update last_login
                from django.utils import timezone
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
                
                # Broadcast authentication event
                from .websocket_utils import broadcast_user_authenticated
                broadcast_user_authenticated(user, 'login')
        
        return response

class ArticlePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """Enhanced pagination response with metadata"""
        return Response({
            'pagination': {
                'page': self.page.number,
                'total_pages': self.page.paginator.num_pages,
                'count': self.page.paginator.count,
                'page_size': self.get_page_size(self.request),
                'has_next': self.page.has_next(),
                'has_previous': self.page.has_previous(),
                'next_page': self.page.next_page_number() if self.page.has_next() else None,
                'previous_page': self.page.previous_page_number() if self.page.has_previous() else None,
            },
            'results': data
        })

class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class FeedbackPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = ArticlePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'author__username', 'category__name']

    def get_queryset(self):
        """Enhanced queryset with PostgreSQL optimizations"""
        queryset = Article.objects.select_related('author', 'category').prefetch_related(
            'tags',
            Prefetch('comments', queryset=Comment.objects.select_related('author').filter(approved=True))
        ).annotate(
            comment_count=Count('comments', filter=Q(comments__approved=True)),
            tag_count=Count('tags')
        )
        
        # Filter by status - only show published articles for non-admin users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(status='published')
        
        # Category filtering
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name__iexact=category)
        
        # Tag filtering
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__iexact=tag)
        
        # Status filtering (for admin users)
        status_filter = self.request.query_params.get('status')
        if status_filter and self.request.user.is_authenticated and self.request.user.is_staff:
            queryset = queryset.filter(status=status_filter)
        
        # Featured articles
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(featured=True)
        
        # Author filtering
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username__iexact=author)
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        valid_orderings = ['created_at', '-created_at', 'title', '-title', 'views', '-views', 'likes', '-likes']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def perform_create(self, serializer):
        """Enhanced article creation with analytics tracking and real-time notifications"""
        article = serializer.save(author=self.request.user)
        
        # Track article creation analytics
        Analytics.objects.create(
            metric_type='article_created',
            metric_value={
                'article_id': str(article.id),
                'author_id': str(self.request.user.id),
                'category': article.category.name if article.category else None,
                'tags': [tag.name for tag in article.tags.all()]
            },
            article=article,
            user=self.request.user,
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Create initial revision
        ArticleRevision.objects.create(
            article=article,
            title=article.title,
            content=article.content,
            excerpt=article.excerpt,
            changed_by=self.request.user,
            change_type='create',
            change_summary='Initial article creation',
            metadata_snapshot={
                'category': article.category.name if article.category else None,
                'tags': [tag.name for tag in article.tags.all()],
                'status': article.status
            }
        )
        
        # Broadcast real-time notification
        from .websocket_utils import broadcast_article_created
        broadcast_article_created(article, self.request.user)

    def perform_update(self, serializer):
        """Enhanced article update with revision tracking and real-time notifications"""
        old_article = self.get_object()
        article = serializer.save()
        
        # Track changes
        changes = {
            'title_changed': old_article.title != article.title,
            'content_changed': old_article.content != article.content,
            'status_changed': old_article.status != article.status,
            'category_changed': old_article.category != article.category
        }
        
        # Create revision for update
        ArticleRevision.objects.create(
            article=article,
            title=article.title,
            content=article.content,
            excerpt=article.excerpt,
            changed_by=self.request.user,
            change_type='edit',
            change_summary=f'Article updated by {self.request.user.username}',
            metadata_snapshot={
                'category': article.category.name if article.category else None,
                'tags': [tag.name for tag in article.tags.all()],
                'status': article.status
            }
        )
        
        # Track update analytics
        Analytics.objects.create(
            metric_type='article_updated',
            metric_value={
                'article_id': str(article.id),
                'updated_by': str(self.request.user.id),
                'changes': changes
            },
            article=article,
            user=self.request.user,
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Broadcast real-time notification
        from .websocket_utils import broadcast_article_updated
        broadcast_article_updated(article, self.request.user, changes)

    def retrieve(self, request, *args, **kwargs):
        """Enhanced article retrieval with view tracking"""
        article = self.get_object()
        
        # Increment view count
        Article.objects.filter(id=article.id).update(views=F('views') + 1)
        
        # Track view analytics
        Analytics.objects.create(
            metric_type='article_view',
            metric_value={
                'article_id': str(article.id),
                'viewer_id': str(request.user.id) if request.user.is_authenticated else None,
                'referrer': request.META.get('HTTP_REFERER', ''),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            },
            article=article,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            referrer=request.META.get('HTTP_REFERER', '')
        )
        
        # Refresh the article to get updated view count
        article.refresh_from_db()
        serializer = self.get_serializer(article)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """PostgreSQL full-text search endpoint"""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': [], 'pagination': {'count': 0}})
        
        # Use PostgreSQL full-text search
        search_vector = SearchVector('title', weight='A') + SearchVector('content', weight='B') + SearchVector('excerpt', weight='C')
        search_query = SearchQuery(query)
        
        queryset = Article.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        ).filter(
            search=search_query,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-rank', '-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        queryset = self.get_queryset().filter(featured=True, status='published')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular articles by views"""
        queryset = self.get_queryset().filter(status='published').order_by('-views', '-likes')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent articles"""
        queryset = self.get_queryset().filter(status='published').order_by('-published_at', '-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like an article"""
        article = self.get_object()
        Article.objects.filter(id=article.id).update(likes=F('likes') + 1)
        
        # Track like analytics
        Analytics.objects.create(
            metric_type='article_liked',
            metric_value={
                'article_id': str(article.id),
                'user_id': str(request.user.id) if request.user.is_authenticated else None
            },
            article=article,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        article.refresh_from_db()
        return Response({'likes': article.likes})

    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """Upload and process article image"""
        article = self.get_object()
        
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        try:
            # Process and store image as base64
            article.set_image_from_file(image_file)
            article.save()
            
            return Response({
                'message': 'Image uploaded successfully',
                'image_data': article.image_base64[:100] + '...' if article.image_base64 else None  # Return truncated preview
            })
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Enhanced queryset with PostgreSQL optimizations"""
        article_id = self.kwargs.get('article_pk')
        queryset = Comment.objects.filter(article_id=article_id).select_related(
            'author', 'article', 'parent'
        ).prefetch_related(
            Prefetch('replies', queryset=Comment.objects.select_related('author').filter(approved=True))
        )
        
        # Only show approved comments for non-admin users
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(approved=True)
        
        # Order by creation date with threading support
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        """Enhanced comment creation with moderation, analytics, and real-time notifications"""
        article_id = self.kwargs.get('article_pk')
        article = Article.objects.get(pk=article_id)
        
        # Auto-approve comments from staff users
        approved = self.request.user.is_staff if self.request.user.is_authenticated else False
        
        comment = serializer.save(
            author=self.request.user if self.request.user.is_authenticated else None,
            article=article,
            approved=approved,
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Track comment analytics
        Analytics.objects.create(
            metric_type='comment_created',
            metric_value={
                'comment_id': str(comment.id),
                'article_id': str(article.id),
                'author_id': str(self.request.user.id) if self.request.user.is_authenticated else None,
                'parent_id': str(comment.parent.id) if comment.parent else None,
                'approved': approved
            },
            article=article,
            user=self.request.user if self.request.user.is_authenticated else None,
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Broadcast real-time notification
        from .websocket_utils import broadcast_comment_created
        broadcast_comment_created(comment)

    @action(detail=False, methods=['get'])
    def thread(self, request, article_pk=None):
        """Get threaded comments for an article"""
        comments = self.get_queryset().filter(parent=None)  # Top-level comments only
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def flag(self, request, article_pk=None, pk=None):
        """Flag a comment for moderation"""
        comment = self.get_object()
        comment.is_flagged = True
        comment.save()
        
        # Track flagging analytics
        Analytics.objects.create(
            metric_type='comment_flagged',
            metric_value={
                'comment_id': str(comment.id),
                'flagged_by': str(request.user.id) if request.user.is_authenticated else None
            },
            article=comment.article,
            user=request.user if request.user.is_authenticated else None,
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': 'Comment flagged for review'})

    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Enhanced queryset with PostgreSQL optimizations"""
        queryset = Category.objects.select_related('parent').prefetch_related('children').annotate(
            article_count=Count('article', filter=Q(article__status='published')),
            total_articles=Count('article')
        )
        
        # Filter by parent category
        parent = self.request.query_params.get('parent')
        if parent:
            if parent.lower() == 'null':
                queryset = queryset.filter(parent=None)
            else:
                queryset = queryset.filter(parent__name__iexact=parent)
        
        return queryset.order_by('name')

    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Get category hierarchy"""
        root_categories = self.get_queryset().filter(parent=None)
        serializer = self.get_serializer(root_categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_five(self, request):
        """Get top 5 categories by article count"""
        top_categories = self.get_queryset().order_by('-article_count')[:5]
        serializer = self.get_serializer(top_categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """Get articles in this category and its subcategories"""
        category = self.get_object()
        
        # Get all descendant categories using recursive query
        descendant_categories = self.get_descendant_categories(category)
        category_ids = [category.id] + [cat.id for cat in descendant_categories]
        
        articles = Article.objects.filter(
            category_id__in=category_ids,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')
        
        # Apply pagination
        from .views import ArticlePagination
        paginator = ArticlePagination()
        page = paginator.paginate_queryset(articles, request)
        if page is not None:
            from .serializers import ArticleSerializer
            serializer = ArticleSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        from .serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    def get_descendant_categories(self, category):
        """Get all descendant categories recursively"""
        descendants = []
        children = Category.objects.filter(parent=category)
        for child in children:
            descendants.append(child)
            descendants.extend(self.get_descendant_categories(child))
        return descendants

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Enhanced queryset with PostgreSQL optimizations"""
        queryset = Tag.objects.annotate(
            article_count=Count('article', filter=Q(article__status='published')),
            total_articles=Count('article')
        )
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('name')

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular tags by article count"""
        popular_tags = self.get_queryset().order_by('-article_count')[:20]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """Get articles with this tag"""
        tag = self.get_object()
        articles = Article.objects.filter(
            tags=tag,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')
        
        # Apply pagination
        from .views import ArticlePagination
        paginator = ArticlePagination()
        page = paginator.paginate_queryset(articles, request)
        if page is not None:
            from .serializers import ArticleSerializer
            serializer = ArticleSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        from .serializers import ArticleSerializer
        serializer = ArticleSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def cloud(self, request):
        """Get tag cloud data"""
        tags = self.get_queryset().filter(article_count__gt=0).order_by('-article_count')[:50]
        
        # Calculate relative weights for tag cloud
        if tags:
            max_count = max(tag.article_count for tag in tags)
            min_count = min(tag.article_count for tag in tags)
            
            tag_data = []
            for tag in tags:
                # Normalize weight to 1-5 scale
                if max_count == min_count:
                    weight = 3
                else:
                    weight = 1 + 4 * (tag.article_count - min_count) / (max_count - min_count)
                
                tag_data.append({
                    'id': tag.id,
                    'name': tag.name,
                    'article_count': tag.article_count,
                    'weight': round(weight, 1)
                })
            
            return Response(tag_data)
        
        return Response([])

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

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [AllowAny] # Allow anyone to create feedback

    def get_permissions(self):
        if self.action == 'list':
            self.permission_classes = [IsAdminUser] # Only admin can list feedback
        return super().get_permissions()

class AdminArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at') # Order by recently created
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author__username', 'category__name']

class AdminCommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at') # Order by recently created
    serializer_class = CommentSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['content', 'author__username', 'article__title']

    @action(detail=True, methods=['post'])
    def approve_comment(self, request, pk=None):
        comment = self.get_object()
        comment.approved = True
        comment.moderated_by = request.user
        comment.moderated_at = timezone.now()
        comment.save()
        
        # Broadcast admin action
        from .websocket_utils import broadcast_admin_action, broadcast_content_moderated
        broadcast_admin_action(
            request.user, 
            'comment_approved', 
            'comment', 
            comment.id,
            {'article_id': str(comment.article.id)}
        )
        broadcast_content_moderated('comment', comment.id, 'approved', request.user)
        
        return Response({'status': 'comment approved'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def delete_comment(self, request, pk=None):
        comment = self.get_object()
        comment_id = comment.id
        article_id = comment.article.id
        comment.delete()
        
        # Broadcast admin action
        from .websocket_utils import broadcast_admin_action
        broadcast_admin_action(
            request.user, 
            'comment_deleted', 
            'comment', 
            comment_id,
            {'article_id': str(article_id)}
        )
        
        return Response({'status': 'comment deleted'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def flag_comment(self, request, pk=None):
        comment = self.get_object()
        comment.is_flagged = True
        comment.moderated_by = request.user
        comment.moderated_at = timezone.now()
        comment.save()
        
        # Broadcast admin action
        from .websocket_utils import broadcast_admin_action, broadcast_content_moderated
        broadcast_admin_action(
            request.user, 
            'comment_flagged', 
            'comment', 
            comment.id,
            {'article_id': str(comment.article.id)}
        )
        broadcast_content_moderated('comment', comment.id, 'flagged', request.user)
        
        return Response({'status': 'comment flagged'}, status=status.HTTP_200_OK)

class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-id') # Categories don't have created_at, order by id
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        search_param = self.request.query_params.get('search')
        if search_param:
            print(f"AdminCategoryViewSet received search query: {search_param}")
        return queryset

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

class AdminFeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdminUser]
    pagination_class = FeedbackPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'message']

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
        # Correctly calculate average comments per article
        avg_comments_per_article = Article.objects.annotate(
            comment_count=models.Count('comments')
        ).aggregate(avg=models.Avg('comment_count'))['avg']
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


class FileUploadView(APIView):
    """Enhanced file upload handling with optimization"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def post(self, request):
        """Handle file uploads with image optimization"""
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES['file']
        file_type = request.data.get('type', 'image')  # image, avatar, etc.
        
        try:
            if file_type in ['image', 'avatar']:
                # Process image files
                result = self.process_image(uploaded_file, file_type)
                
                # Track upload analytics
                Analytics.objects.create(
                    metric_type='file_uploaded',
                    metric_value={
                        'file_type': file_type,
                        'file_size': uploaded_file.size,
                        'file_name': uploaded_file.name,
                        'content_type': uploaded_file.content_type
                    },
                    user=request.user if request.user.is_authenticated else None,
                    ip_address=self.get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response(result)
            else:
                return Response({'error': 'Unsupported file type'}, status=status.HTTP_400_BAD_REQUEST)
                
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'File processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def process_image(self, image_file, file_type):
        """Process and optimize image files"""
        try:
            # Open and validate image
            img = Image.open(image_file)
            
            # Set size limits based on file type
            if file_type == 'avatar':
                max_size = (200, 200)
                quality = 85
            else:  # article image
                max_size = (800, 600)
                quality = 85
            
            # Resize image if necessary
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Save to bytes buffer
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            
            # Convert to base64
            img_str = base64.b64encode(buffer.getvalue()).decode()
            base64_data = f"data:image/jpeg;base64,{img_str}"
            
            # Calculate compression ratio
            original_size = image_file.size
            compressed_size = len(base64_data)
            compression_ratio = (1 - compressed_size / original_size) * 100 if original_size > 0 else 0
            
            return {
                'success': True,
                'data': base64_data,
                'metadata': {
                    'original_size': original_size,
                    'compressed_size': compressed_size,
                    'compression_ratio': round(compression_ratio, 2),
                    'dimensions': img.size,
                    'format': 'JPEG'
                }
            }
            
        except Exception as e:
            raise ValidationError(f"Image processing failed: {str(e)}")
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AnalyticsView(APIView):
    """Analytics endpoint for tracking and reporting"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get analytics data"""
        metric_type = request.query_params.get('type', 'overview')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = Analytics.objects.all()
        
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        if metric_type == 'overview':
            return self.get_overview_analytics(queryset)
        elif metric_type == 'articles':
            return self.get_article_analytics(queryset)
        elif metric_type == 'users':
            return self.get_user_analytics(queryset)
        else:
            return Response({'error': 'Invalid metric type'}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_overview_analytics(self, queryset):
        """Get overview analytics"""
        total_views = queryset.filter(metric_type='article_view').count()
        total_likes = queryset.filter(metric_type='article_liked').count()
        total_comments = queryset.filter(metric_type='comment_created').count()
        total_uploads = queryset.filter(metric_type='file_uploaded').count()
        
        # Top articles by views
        article_views = queryset.filter(metric_type='article_view').values('article_id').annotate(
            view_count=Count('id')
        ).order_by('-view_count')[:10]
        
        return Response({
            'overview': {
                'total_views': total_views,
                'total_likes': total_likes,
                'total_comments': total_comments,
                'total_uploads': total_uploads
            },
            'top_articles': article_views
        })
    
    def get_article_analytics(self, queryset):
        """Get article-specific analytics"""
        article_metrics = queryset.filter(
            metric_type__in=['article_view', 'article_liked', 'article_created']
        ).values('article_id', 'metric_type').annotate(
            count=Count('id')
        ).order_by('article_id', 'metric_type')
        
        return Response({'article_metrics': list(article_metrics)})
    
    def get_user_analytics(self, queryset):
        """Get user-specific analytics"""
        user_metrics = queryset.filter(
            user__isnull=False
        ).values('user_id').annotate(
            total_actions=Count('id'),
            views=Count('id', filter=Q(metric_type='article_view')),
            likes=Count('id', filter=Q(metric_type='article_liked')),
            comments=Count('id', filter=Q(metric_type='comment_created'))
        ).order_by('-total_actions')[:20]
        
        return Response({'user_metrics': list(user_metrics)})

