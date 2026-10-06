from tests.conftest import make_user


async def test_login_returns_tokens_and_user(client, admin_headers):
    r = await client.post("/auth/token/", json={"email": "ADMIN@example.com", "password": "pw12345"})
    assert r.status_code == 200
    body = r.json()
    assert {"access", "refresh", "user"} <= body.keys()
    assert body["user"]["email"] == "admin@example.com" and "password" not in body["user"]


async def test_login_rejects_bad_password(client, admin_headers):
    r = await client.post("/auth/token/", json={"email": "admin@example.com", "password": "nope"})
    assert r.status_code == 401


async def test_refresh_rotates_and_access_token_cannot_refresh(client, admin_headers):
    login = (await client.post(
        "/auth/token/", json={"email": "admin@example.com", "password": "pw12345"})).json()
    ok = await client.post("/auth/token/refresh/", json={"refresh": login["refresh"]})
    assert ok.status_code == 200 and ok.json()["access"]
    bad = await client.post("/auth/token/refresh/", json={"refresh": login["access"]})
    assert bad.status_code == 401


async def test_garbage_bearer_token_is_401(client):
    r = await client.post("/categories/", json={"name": "x"}, headers={"Authorization": "Bearer junk"})
    assert r.status_code == 401


async def test_create_admin_only_bootstraps_or_admin_only(client):
    first = await client.post(
        "/auth/create-user/",
        json={"username": "root", "email": "root@example.com", "password": "pw12345"})
    assert first.status_code == 201 and first.json()["is_staff"] is True
    second = await client.post(
        "/auth/create-user/",
        json={"username": "evil", "email": "evil@example.com", "password": "pw12345"})
    assert second.status_code == 403


async def test_v1_prefix_and_legacy_paths_both_work(client):
    await make_user("a@example.com", "a")
    for prefix in ("", "/v1"):
        r = await client.post(f"{prefix}/auth/token/", json={"email": "a@example.com", "password": "pw12345"})
        assert r.status_code == 200
