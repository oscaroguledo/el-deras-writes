"""
Property-based tests for media processing.
**Feature: django-postgresql-enhancement, Property 28: Media processing**
**Validates: Requirements 7.2**
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

class MediaProcessingTest(HypothesisTestCase):
    """
    Property-based tests to ensure images are correctly processed (resized, optimized,
    converted to base64) and that the base64 data is valid.
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
        original_format=st.sampled_from(['JPEG', 'PNG', 'GIF']),
        original_width=st.integers(min_value=100, max_value=1500), # Test various sizes
        original_height=st.integers(min_value=100, max_value=1500),
        file_type=st.sampled_from(['image', 'avatar'])
    )
    @hypothesis_settings(max_examples=20, deadline=None)
    def test_image_processing_and_base64_conversion(self, original_format, original_width, original_height, file_type):
        """
        Property: Uploaded images should be resized, optimized to JPEG, and stored as base64.
        The resulting base64 data should be valid and represent a processed image within expected dimensions.
        """
        assume(original_width > 0 and original_height > 0) # Ensure valid dimensions

        original_image_file = self._create_dummy_image(
            format=original_format, 
            size=(original_width, original_height)
        )
        
        upload_url = reverse('file-upload')
        response = self.client.post(upload_url, {'file': original_image_file, 'type': file_type}, format='multipart')
        
        self.assertEqual(response.status_code, 200, f"Expected 200, got {response.status_code} - {response.data}")
        self.assertIn('data', response.data)
        self.assertIn('metadata', response.data)
        
        base64_data_from_response = response.data['data']
        metadata = response.data['metadata']
        
        # Verify base64 data format
        self.assertTrue(base64_data_from_response.startswith('data:image'), "Base64 data should have data URI prefix")
        self.assertEqual(metadata['format'].lower(), 'jpeg', "Processed image format in metadata should be jpeg")
        
        # Verify image dimensions and compression
        if file_type == 'avatar':
            max_size = (200, 200)
        else: # image
            max_size = (800, 600)

        self.assertLessEqual(metadata['dimensions'][0], max_size[0], "Processed image width should be within max_size")
        self.assertLessEqual(metadata['dimensions'][1], max_size[1], "Processed image height should be within max_size")
        self.assertGreater(metadata['compression_ratio'], 0, "Image should have undergone some compression")
        
        # Further verify by attempting to decode
        try:
            _, actual_base64_string = base64_data_from_response.split(',', 1)
            decoded_data = base64.b64decode(actual_base64_string)
            reopened_image = Image.open(io.BytesIO(decoded_data))
            
            self.assertGreater(reopened_image.width, 0)
            self.assertGreater(reopened_image.height, 0)
            self.assertEqual(reopened_image.format.lower(), 'jpeg', "Decoded image format should be JPEG")
            
        except Exception as e:
            self.fail(f"Could not decode or verify base64 image data: {e}")

