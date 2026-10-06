import os
import time
import uuid


def uuid7() -> uuid.UUID:
    """Time-ordered UUID (RFC 9562 v7)."""
    b = bytearray(int(time.time() * 1000).to_bytes(6, "big") + os.urandom(10))
    b[6] = (b[6] & 0x0F) | 0x70
    b[8] = (b[8] & 0x3F) | 0x80
    return uuid.UUID(bytes=bytes(b))
