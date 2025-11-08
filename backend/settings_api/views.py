from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import ContactInfo
from .serializers import ContactInfoSerializer

class SocialMediaLinksView(APIView):
    def get(self, request):
        return Response(settings.SOCIAL_MEDIA_LINKS)

class ContactInfoView(APIView):
    def get(self, request):
        contact_info = ContactInfo.objects.first()
        if contact_info:
            serializer = ContactInfoSerializer(contact_info)
            return Response(serializer.data)
        return Response({})