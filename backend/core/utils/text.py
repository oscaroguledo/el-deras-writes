import re
import uuid


def slugify(text: str, fallback: str = "item") -> str:
    return re.sub(r"[-\s]+", "-", re.sub(r"[^\w\s-]", "", text.lower())).strip("-_") or fallback


def parse_uuid(value: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


def search_terms(search: str | None) -> list[str]:
    return (search or "").split()
