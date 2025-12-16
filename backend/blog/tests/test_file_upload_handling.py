"""
Property-based tests for file upload handling.
**Feature: django-postgresql-enhancement, Property 25: File upload handling**
**Validates: Requirements 6.4**
"""

from django.test import TestCase
from django.urls import reverse
from hypothesis import given, strategies as st, settings as hypothesis_settings, assume
from hypothesis.extra.django import TestCase as HypothesisTestCase

from rest_framework.test import APIClient
from blog.models import CustomUser, Article
from PIL import Image
import io
import base64
import uuid
import string

class FileUploadHandlingTest(HypothesisTestCase):
    """
    Property-based tests to ensure file uploads are handled correctly,
    including image processing and base64 storage.
    """

    def setUp(self):
        """Set up test environment."""
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='adminpassword',
        )
        self.client.force_authenticate(user=self.admin_user)

    def tearDown(self):
        """Clean up after each test."""
        self.client.force_authenticate(user=None)
        CustomUser.objects.all().delete()
        Article.objects.all().delete()

    def _create_dummy_image(self, format='JPEG', size=(100, 100), color=(255, 0, 0)):
        """Creates an in-memory dummy image."""
        image = Image.new('RGB', size, color)
        image_bytes = io.BytesIO()
        image.save(image_bytes, format=format)
        image_bytes.seek(0)
        return image_bytes

    @given(
        image_format=st.sampled_from(['JPEG', 'PNG', 'GIF']),
        image_width=st.integers(min_value=10, max_value=800),
        image_height=st.integers(min_value=10, max_value=600)
    )
    @hypothesis_settings(max_examples=10, deadline=None)
    def test_image_file_upload_and_base64_conversion(self, image_format, image_width, image_height):
        """
        Property: Uploaded image files should be successfully converted to base64
        and stored in an article.
        """
        assume(image_width > 0 and image_height > 0) # Ensure valid dimensions

        image_file = self._create_dummy_image(format=image_format, size=(image_width, image_height))
        
        # Create an article
        article = Article.objects.create(
            title=f"Test Article {uuid.uuid4().hex[:8]}",
            content="Some content",
            author=self.user,
            status='draft'
        )
        
        # Simulate file upload to the file-upload endpoint
        upload_url = reverse('file-upload')
        response = self.client.post(upload_url, {'file': image_file}, format='multipart')
        
        self.assertEqual(response.status_code, 200, f"Expected 200, got {response.status_code} - {response.data}")
        self.assertIn('data', response.data)
        self.assertIn('metadata', response.data)
        
        base64_data_from_response = response.data['data']
        
        # Verify base64 data format
        self.assertTrue(base64_data_from_response.startswith('data:image'), "Base64 data should have data URI prefix")
        self.assertIn('metadata', response.data)
        self.assertEqual(response.data['metadata']['format'].lower(), 'jpeg', "Processed image format in metadata should be jpeg")
        
        # Further verify by attempting to decode
        try:
            # Extract actual base64 string after prefix
            _, actual_base64_string = base64_data_from_response.split(',', 1)
            decoded_data = base64.b64decode(actual_base64_string)
            reopened_image = Image.open(io.BytesIO(decoded_data))
            self.assertGreater(reopened_image.width, 0)
            self.assertGreater(reopened_image.height, 0)
        except Exception as e:
            self.fail(f"Could not decode or verify base64 image data: {e}")

    @given(
        invalid_file_content=st.binary(min_size=1, max_size=100),
        file_extension=st.sampled_from(['.txt', '.pdf', '.exe', '.zip']),
        file_name=st.text(min_size=5, max_size=20, alphabet=string.ascii_letters + string.digits)
    )
    @hypothesis_settings(max_examples=5, deadline=None)
    def test_invalid_file_type_rejection(self, invalid_file_content, file_extension, file_name):
        """
        Property: The API should reject non-image file types.
        """
        dummy_file = io.BytesIO(invalid_file_content)
        dummy_file.name = f"{file_name}{file_extension}"
        
        upload_url = reverse('file-upload')
        response = self.client.post(upload_url, {'file': dummy_file}, format='multipart')
        
        self.assertEqual(response.status_code, 400, f"Expected 400 for invalid file type, got {response.status_code} - {response.data}")
        self.assertIn('error', response.data)
        self.assertIn('Image processing failed', response.data['error'])

    @given(
        file_size_kb=st.integers(min_value=6000, max_value=10000) # Exceeds 5MB limit
    )
    @hypothesis_settings(max_examples=3, deadline=None)
    def test_file_size_limit_enforcement(self, file_size_kb):
        """
        Property: The API should enforce a file size limit (e.g., 5MB).
        """
        large_image_bytes = self._create_dummy_image(size=(1000, 1000), format='JPEG')
        # Pad the image bytes to exceed the limit
        large_image_bytes.seek(0, io.SEEK_END)
        current_size = large_image_bytes.tell()
        padding_needed = (file_size_kb * 1024) - current_size
        if padding_needed > 0:
            large_image_bytes.write(b'\0' * padding_needed)
        large_image_bytes.seek(0)
        large_image_bytes.name = 'large_image.jpg'

        upload_url = reverse('file-upload')
        response = self.client.post(upload_url, {'file': large_image_bytes}, format='multipart')

        self.assertEqual(response.status_code, 400, f"Expected 400 for large file, got {response.status_code} - {response.data}")
        self.assertIn('error', response.data)
        self.assertIn('File size exceeds', response.data['error'])