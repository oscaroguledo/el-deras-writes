"""User views"""
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..models import CustomUser
from ..serializers import CustomUserSerializer
from .base import UserPagination


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = UserPagination

    def perform_create(self, serializer):
        """Create user"""
        user_type = serializer.validated_data.get('user_type')
        is_staff = user_type == 'admin'
        is_superuser = user_type == 'admin'
        serializer.save(is_staff=is_staff, is_superuser=is_superuser)

    def perform_update(self, serializer):
        """Update user"""
        user_type = serializer.validated_data.get('user_type', serializer.instance.user_type)
        is_staff = user_type == 'admin'
        is_superuser = user_type == 'admin'
        serializer.save(is_staff=is_staff, is_superuser=is_superuser)