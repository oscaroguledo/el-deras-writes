import os

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL", "sqlite://")
os.environ["SECRET_KEY"] = "test-secret-key-test-secret-key-test"
os.environ["PASSWORD_HASH_ITERATIONS"] = "1000"
os.environ["ADMIN_EMAIL"] = ""
os.environ["ADMIN_PASSWORD"] = ""

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

import models  # noqa: E402,F401
from core.db import Base, SessionLocal, engine  # noqa: E402
from core.security import hash_password  # noqa: E402
from main import app  # noqa: E402
from models.accounts.user import User  # noqa: E402
from services.content.category import CategoryService  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def _schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        await CategoryService(db).ensure_defaults()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def make_user(email, username, user_type="normal", password="pw12345"):
    admin = user_type == "admin"
    async with SessionLocal() as db:
        db.add(User(
            email=email, username=username, password=hash_password(password),
            user_type=user_type, is_staff=admin, is_superuser=admin,
        ))
        await db.commit()


async def login(client, email, password="pw12345"):
    r = await client.post("/auth/token/", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access']}"}


@pytest_asyncio.fixture
async def admin_headers(client):
    await make_user("admin@example.com", "admin", "admin")
    return await login(client, "admin@example.com")


@pytest_asyncio.fixture
async def user_headers(client):
    await make_user("user@example.com", "user")
    return await login(client, "user@example.com")
