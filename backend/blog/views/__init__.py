# Simple blog views - organized and clean
from .articles import ArticleViewSet
from .comments import CommentViewSet
from .categories import CategoryViewSet
from .tags import TagViewSet
from .users import UserViewSet
from .auth import TokenView, CreateUserView
from .admin import AdminArticleViewSet, AdminCommentViewSet, AdminUserViewSet, AdminFeedbackViewSet, AdminDashboardView
from .utils import ContactInfoView, VisitorCountView, FeedbackView, HealthView

# Keep old names for backward compatibility
MyTokenObtainPairView = TokenView
SuperuserCreateView = CreateUserView
CustomUserViewSet = UserViewSet
IncrementVisitorCountView = VisitorCountView
FeedbackViewSet = FeedbackView
HealthCheckView = HealthView

__all__ = [
    # Main views
    'ArticleViewSet', 'CommentViewSet', 'CategoryViewSet', 'TagViewSet', 'UserViewSet',
    
    # Auth views
    'TokenView', 'CreateUserView',
    
    # Admin views
    'AdminArticleViewSet', 'AdminCommentViewSet', 'AdminUserViewSet', 
    'AdminFeedbackViewSet', 'AdminDashboardView',
    
    # Utility views
    'ContactInfoView', 'VisitorCountView', 'FeedbackView', 'HealthView',
    
    # Backward compatibility
    'MyTokenObtainPairView', 'SuperuserCreateView', 'CustomUserViewSet',
    'IncrementVisitorCountView', 'FeedbackViewSet', 'HealthCheckView'
]