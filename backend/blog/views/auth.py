"""Authentication views"""
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from ..models import CustomUser
from ..serializers import MyTokenObtainPairSerializer, CustomUserSerializer


class TokenView(TokenObtainPairView):
    """Get JWT token"""
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                user = serializer.user
                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])
        
        return response


class CreateUserView(APIView):
    """Create superuser"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            if CustomUser.objects.filter(email=email).exists():
                return Response(
                    {"detail": "User with this email already exists."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            if CustomUser.objects.filter(username=username).exists():
                return Response(
                    {"detail": "User with this username already exists."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

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