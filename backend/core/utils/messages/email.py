"""Transactional email: Jinja templates rendered to HTML and sent through Brevo."""
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from jinja2 import Environment, FileSystemLoader, StrictUndefined

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

# kind -> (template, subject). Subjects may use {placeholders} filled from the context.
EMAILS: dict[str, tuple[str, str]] = {
    "welcome": ("welcome.html", "Welcome to {site_name}"),
    "feedback_received": ("feedback_received.html", "New feedback from {name}"),
    "feedback_ack": ("feedback_ack.html", "We got your message"),
    "new_comment": ("new_comment.html", "New comment on “{article_title}”"),
}

_env = Environment(
    loader=FileSystemLoader(str(Path(__file__).parent / "templates")),
    autoescape=True, undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True,
)
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _one_line(text: str) -> str:
    return " ".join(str(text).split())


def render_email(kind: str, context: dict[str, Any]) -> tuple[str, str]:
    """The (subject, html) of an email."""
    template, subject = EMAILS[kind]
    frontend = settings.FRONTEND_URL.rstrip("/")
    page = {
        **context,
        "site_name": settings.SITE_NAME,
        "frontend_url": frontend,
        "logo_url": f"{frontend}/brand/mark-black.png",  # absolute: mail clients can't load relative paths
        "year": datetime.now().year,
    }
    subject_text = _one_line(subject.format(**page))  # single line: user text goes into the subject
    return subject_text, _env.get_template(template).render(subject=subject_text, **page)


def _sender() -> dict[str, str]:
    raw = settings.BREVO_FROM_EMAIL
    if "<" in raw and ">" in raw:
        return {"name": raw.split("<")[0].strip(), "email": raw.split("<")[1].split(">")[0].strip()}
    return {"name": settings.SITE_NAME, "email": raw.strip()}


async def _post(payload: dict) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            BREVO_URL, json=payload,
            headers={"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
        )
    if response.status_code not in (200, 201):
        raise RuntimeError(f"Brevo refused the email ({response.status_code}): {response.text}")


async def send_email(
    to_email: str, kind: str, context: dict[str, Any], reply_to: str | None = None
) -> bool:
    """Render and send one email. Never raises: a mail failure must not fail the request that
    triggered it. Returns whether the email was handed to Brevo."""
    if not to_email:
        return False
    if not settings.BREVO_API_KEY:
        logger.info("Email disabled (no BREVO_API_KEY); skipped %s to %s", kind, to_email)
        return False
    try:
        subject, html = render_email(kind, context)
        payload: dict[str, Any] = {
            "sender": _sender(), "to": [{"email": to_email.strip()}],
            "subject": subject, "htmlContent": html,
        }
        if reply_to:
            payload["replyTo"] = {"email": reply_to.strip()}
        await _post(payload)
    except Exception:
        logger.exception("Failed to send %s email to %s", kind, to_email)
        return False
    logger.info("Sent %s email to %s", kind, to_email)
    return True
