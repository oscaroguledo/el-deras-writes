from markupsafe import escape

import pytest

from core.config import settings
from core.utils.messages import email


def test_every_email_renders_with_logo_and_escapes_user_text():
    ctx = {
        "welcome": {"first_name": "Ada", "username": "ada", "email": "a@x.com", "is_admin": True},
        "feedback_received": {"name": "<b>Eve</b>", "email": "e@x.com", "feedback_subject": "Hi\nBcc: x",
                              "message": "<script>alert(1)</script>"},
        "feedback_ack": {"name": "Eve"},
        "new_comment": {"commenter": "Bob", "article_title": "T", "article_id": "abc", "content": "<i>x</i>"},
    }
    assert set(ctx) == set(email.EMAILS)
    for kind, context in ctx.items():
        subject, html = email.render_email(kind, context)
        assert "\n" not in subject and "/brand/mark-black.png" in html and escape(settings.SITE_NAME) in html
    _, html = email.render_email("feedback_received", ctx["feedback_received"])
    assert "<script>" not in html and "&lt;script&gt;" in html
    subject, _ = email.render_email("feedback_received", ctx["feedback_received"])
    assert subject == "New feedback from <b>Eve</b>"  # subject is plain text, never HTML


async def test_send_skipped_without_api_key(monkeypatch):
    monkeypatch.setattr(settings, "BREVO_API_KEY", "")
    assert await email.send_email("a@x.com", "feedback_ack", {"name": "A"}) is False


async def test_send_posts_to_brevo_and_swallows_failures(monkeypatch):
    sent = []

    async def ok(payload):
        sent.append(payload)

    monkeypatch.setattr(settings, "BREVO_API_KEY", "key")
    monkeypatch.setattr(settings, "BREVO_FROM_EMAIL", "Site <noreply@site.com>")
    monkeypatch.setattr(email, "_post", ok)
    assert await email.send_email("a@x.com", "feedback_ack", {"name": "A"}, reply_to="r@x.com")
    p = sent[0]
    assert p["sender"] == {"name": "Site", "email": "noreply@site.com"}
    assert p["to"] == [{"email": "a@x.com"}] and p["replyTo"] == {"email": "r@x.com"}

    async def boom(payload):
        raise RuntimeError("brevo down")

    monkeypatch.setattr(email, "_post", boom)
    assert await email.send_email("a@x.com", "feedback_ack", {"name": "A"}) is False
    assert await email.send_email("", "feedback_ack", {"name": "A"}) is False


@pytest.fixture
def outbox(monkeypatch):
    sent = []

    async def fake(to, kind, context, reply_to=None):
        sent.append((to, kind))

    for module in ("api.system.system", "api.accounts.user", "api.content.comment"):
        monkeypatch.setattr(f"{module}.send_email", fake)
    monkeypatch.setattr(settings, "SUPPORT_EMAIL", "owner@site.com")
    return sent


async def test_feedback_emails_owner_and_sender(client, outbox):
    r = await client.post("/feedback/", json={"name": "A", "email": "a@x.com", "message": "hi"})
    assert r.status_code == 201
    assert sorted(outbox) == [("a@x.com", "feedback_ack"), ("owner@site.com", "feedback_received")]


async def test_admin_created_user_gets_welcome(client, admin_headers, outbox):
    await client.post("/admin-api/users/", headers=admin_headers, json={
        "username": "bob", "email": "bob@x.com", "password": "pw12345"})
    assert ("bob@x.com", "welcome") in outbox


async def test_comment_notifies_owner_but_not_for_admins(client, admin_headers, outbox):
    art = (await client.post("/articles/", headers=admin_headers, json={
        "title": "T", "content": "c", "category": "books", "status": "published"})).json()
    url = f"/articles/{art['id']}/comments/"
    await client.post(url, json={"content": "anon"})
    await client.post(url, json={"content": "mine"}, headers=admin_headers)
    assert outbox == [("owner@site.com", "new_comment")]
