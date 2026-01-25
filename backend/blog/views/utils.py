"""Utility views"""
import uuid
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ..models import ContactInfo, VisitorCount, Visit, Feedback
from ..serializers import ContactInfoSerializer, VisitorCountSerializer, FeedbackSerializer


class ContactInfoView(APIView):
    """Contact information"""
    permission_classes = [AllowAny]

    def get(self, request):
        contact_info = ContactInfo.objects.first()
        if not contact_info:
            contact_info = ContactInfo.objects.create(
                address="123 Main St, Anytown, USA",
                phone="+1234567890",
                email="info@example.com",
                social_media_links={
                    "whatsapp": "https://wa.me/1234567890",
                    "tiktok": "https://tiktok.com/@example",
                    "instagram": "https://instagram.com/example",
                    "facebook": "https://facebook.com/example"
                }
            )
        serializer = ContactInfoSerializer(contact_info)
        return Response(serializer.data)

    def patch(self, request):
        from rest_framework.permissions import IsAdminUser
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


class VisitorCountView(APIView):
    """Visitor count tracking"""
    permission_classes = [AllowAny]

    def post(self, request):
        today = timezone.now().date()
        visit, created = Visit.objects.get_or_create(date=today)
        if not created:
            visit.count += 1
            visit.save()
        
        fixed_uuid = uuid.UUID('00000000-0000-0000-0000-000000000001')
        total_visitor_count, _ = VisitorCount.objects.get_or_create(id=fixed_uuid)
        total_visitor_count.count += 1
        total_visitor_count.save()

        serializer = VisitorCountSerializer(total_visitor_count)
        return Response(serializer.data)


class FeedbackView(APIView):
    """Feedback submission"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthView(APIView):
    """Health check"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                
            return Response({
                'status': 'healthy',
                'timestamp': timezone.now().isoformat(),
                'database': 'connected'
            })
        except Exception as e:
            return Response({
                'status': 'unhealthy',
                'timestamp': timezone.now().isoformat(),
                'error': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)