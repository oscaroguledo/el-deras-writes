"""
UUID v7 utilities for the blog application.
UUID v7 provides better database performance with time-ordered UUIDs.
"""

import uuid
import time
from typing import Union


def uuid7() -> uuid.UUID:
    """
    Generate a UUID v7 (time-ordered UUID).
    
    UUID v7 format:
    - 48-bit timestamp (milliseconds since Unix epoch)
    - 12-bit random data
    - 4-bit version (0111)
    - 62-bit random data
    - 2-bit variant (10)
    
    Returns:
        uuid.UUID: A new UUID v7 instance
    """
    # Get current timestamp in milliseconds
    timestamp_ms = int(time.time() * 1000)
    
    # Generate random bytes for the rest
    random_bytes = uuid.uuid4().bytes
    
    # Construct UUID v7
    # First 6 bytes: timestamp (48 bits)
    time_bytes = timestamp_ms.to_bytes(8, 'big')[-6:]
    
    # Next 2 bytes: random + version
    rand_a = random_bytes[6:8]
    # Set version to 7 (0111) in the most significant 4 bits of byte 6
    rand_a = bytes([(rand_a[0] & 0x0f) | 0x70, rand_a[1]])
    
    # Last 8 bytes: variant + random
    rand_b = random_bytes[8:16]
    # Set variant to 10 in the most significant 2 bits of byte 8
    rand_b = bytes([(rand_b[0] & 0x3f) | 0x80] + list(rand_b[1:]))
    
    # Combine all parts
    uuid_bytes = time_bytes + rand_a + rand_b
    
    return uuid.UUID(bytes=uuid_bytes)


def is_uuid7(uuid_obj: Union[str, uuid.UUID]) -> bool:
    """
    Check if a UUID is version 7.
    
    Args:
        uuid_obj: UUID string or UUID object to check
        
    Returns:
        bool: True if UUID is version 7, False otherwise
    """
    if isinstance(uuid_obj, str):
        try:
            uuid_obj = uuid.UUID(uuid_obj)
        except ValueError:
            return False
    
    return uuid_obj.version == 7


def extract_timestamp_from_uuid7(uuid_obj: Union[str, uuid.UUID]) -> int:
    """
    Extract timestamp from UUID v7.
    
    Args:
        uuid_obj: UUID v7 string or UUID object
        
    Returns:
        int: Timestamp in milliseconds since Unix epoch
        
    Raises:
        ValueError: If UUID is not version 7
    """
    if isinstance(uuid_obj, str):
        uuid_obj = uuid.UUID(uuid_obj)
    
    if not is_uuid7(uuid_obj):
        raise ValueError("UUID is not version 7")
    
    # Extract first 48 bits (6 bytes) as timestamp
    uuid_bytes = uuid_obj.bytes
    timestamp_bytes = uuid_bytes[:6]
    
    # Convert to integer (pad with 2 zero bytes to make 8 bytes)
    timestamp_ms = int.from_bytes(b'\x00\x00' + timestamp_bytes, 'big')
    
    return timestamp_ms