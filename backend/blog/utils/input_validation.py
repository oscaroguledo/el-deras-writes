"""
Input validation and sanitization utilities for security
"""

import re
import bleach
from django.core.exceptions import ValidationError
from django.utils.html import escape
from django.utils.text import slugify
import logging

logger = logging.getLogger(__name__)

# SQL injection patterns to detect and block
SQL_INJECTION_PATTERNS = [
    r"(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)",
    r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
    r"(\b(OR|AND)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)",
    r"(--|#|/\*|\*/)",
    r"(\bSLEEP\s*\()",
    r"(\bBENCHMARK\s*\()",
    r"(\bWAITFOR\s+DELAY)",
    r"(\bpg_sleep\s*\()",
    r"(\bxp_cmdshell)",
    r"(\bUNION\s+(ALL\s+)?SELECT)",
    r"(\bINSERT\s+INTO)",
    r"(\bDELETE\s+FROM)",
    r"(\bUPDATE\s+\w+\s+SET)",
    r"(\bDROP\s+(TABLE|DATABASE|SCHEMA))",
]

# XSS patterns to detect and sanitize
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe[^>]*>",
    r"<object[^>]*>",
    r"<embed[^>]*>",
    r"<link[^>]*>",
    r"<meta[^>]*>",
    r"<style[^>]*>.*?</style>",
    r"<form[^>]*>",
    r"vbscript:",
    r"data:text/html",
]

# Path traversal patterns
PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",
    r"\.\.\\",
    r"%2e%2e%2f",
    r"%2e%2e%5c",
    r"..%252f",
    r"..%255c",
]

# Allowed HTML tags for content (very restrictive)
ALLOWED_HTML_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'a', 'img'
]

# Allowed HTML attributes
ALLOWED_HTML_ATTRIBUTES = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id']
}

# Allowed protocols for links
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


class InputValidator:
    """Comprehensive input validation and sanitization"""
    
    @staticmethod
    def detect_sql_injection(text):
        """Detect potential SQL injection patterns"""
        if not text:
            return False
        
        text_lower = text.lower()
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected: {pattern}")
                return True
        return False
    
    @staticmethod
    def detect_xss(text):
        """Detect potential XSS patterns"""
        if not text:
            return False
        
        text_lower = text.lower()
        for pattern in XSS_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"XSS pattern detected: {pattern}")
                return True
        return False
    
    @staticmethod
    def detect_path_traversal(text):
        """Detect potential path traversal patterns"""
        if not text:
            return False
        
        for pattern in PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Path traversal pattern detected: {pattern}")
                return True
        return False
    
    @staticmethod
    def is_malicious_input(text):
        """Check if input contains any malicious patterns"""
        if not text:
            return False
        
        return (
            InputValidator.detect_sql_injection(text) or
            InputValidator.detect_xss(text) or
            InputValidator.detect_path_traversal(text)
        )
    
    @staticmethod
    def sanitize_text(text, allow_html=False):
        """Sanitize text input"""
        if not text:
            return text
        
        # Check for malicious patterns first
        if InputValidator.is_malicious_input(text):
            # For malicious input, we'll be very aggressive and strip most content
            # Remove SQL injection patterns
            for pattern in SQL_INJECTION_PATTERNS:
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
            
            # Remove XSS patterns
            for pattern in XSS_PATTERNS:
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
            
            # Remove path traversal patterns
            for pattern in PATH_TRAVERSAL_PATTERNS:
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        if allow_html:
            # Use bleach to sanitize HTML while preserving safe tags
            text = bleach.clean(
                text,
                tags=ALLOWED_HTML_TAGS,
                attributes=ALLOWED_HTML_ATTRIBUTES,
                protocols=ALLOWED_PROTOCOLS,
                strip=True
            )
        else:
            # Escape all HTML
            text = escape(text)
        
        # Additional cleanup
        text = text.strip()
        
        return text
    
    @staticmethod
    def sanitize_title(title):
        """Sanitize title field"""
        if not title:
            return title
        
        # Titles should never contain HTML
        sanitized = InputValidator.sanitize_text(title, allow_html=False)
        
        # Additional title-specific validation
        if len(sanitized) > 255:
            sanitized = sanitized[:255]
        
        # Remove any remaining dangerous characters
        sanitized = re.sub(r'[<>"\']', '', sanitized)
        
        return sanitized
    
    @staticmethod
    def sanitize_content(content):
        """Sanitize content field (may contain some HTML)"""
        if not content:
            return content
        
        # Content can contain limited HTML
        return InputValidator.sanitize_text(content, allow_html=True)
    
    @staticmethod
    def sanitize_username(username):
        """Sanitize username field"""
        if not username:
            return username
        
        # Usernames should be very restrictive
        sanitized = InputValidator.sanitize_text(username, allow_html=False)
        
        # Only allow alphanumeric, underscore, and hyphen
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', sanitized)
        
        return sanitized
    
    @staticmethod
    def sanitize_email(email):
        """Sanitize email field"""
        if not email:
            return email
        
        # Basic email sanitization
        sanitized = InputValidator.sanitize_text(email, allow_html=False)
        
        # Remove any characters that shouldn't be in emails
        sanitized = re.sub(r'[<>"\'\s]', '', sanitized)
        
        return sanitized
    
    @staticmethod
    def validate_and_sanitize_input(value, field_type='text'):
        """Main validation and sanitization function"""
        if not value:
            return value
        
        # Convert to string if not already
        if not isinstance(value, str):
            value = str(value)
        
        # Check for malicious input and raise validation error if found
        if InputValidator.is_malicious_input(value):
            # Log the attempt
            logger.warning(f"Malicious input detected in {field_type}: {value[:100]}...")
            
            # For very dangerous patterns, reject entirely
            dangerous_patterns = [
                r"DROP\s+TABLE",
                r"DELETE\s+FROM",
                r"<script",
                r"javascript:",
            ]
            
            for pattern in dangerous_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    raise ValidationError(f"Invalid input detected in {field_type}")
        
        # Sanitize based on field type
        if field_type == 'title':
            return InputValidator.sanitize_title(value)
        elif field_type == 'content':
            return InputValidator.sanitize_content(value)
        elif field_type == 'username':
            return InputValidator.sanitize_username(value)
        elif field_type == 'email':
            return InputValidator.sanitize_email(value)
        else:
            return InputValidator.sanitize_text(value, allow_html=False)
    
    @staticmethod
    def generate_safe_slug(title):
        """Generate a safe slug from title"""
        if not title:
            return ''
        
        # First sanitize the title
        safe_title = InputValidator.sanitize_title(title)
        
        # Generate slug
        slug = slugify(safe_title)
        
        # Ensure slug is not empty and not just dashes
        if not slug or slug.replace('-', '') == '':
            slug = 'article'
        
        return slug


def validate_input_field(value, field_name):
    """Decorator-friendly validation function"""
    return InputValidator.validate_and_sanitize_input(value, field_name)