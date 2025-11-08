from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings

class SocialMediaLinksView(APIView):
    def get(self, request):
        return Response(settings.SOCIAL_MEDIA_LINKS)