async def test_health(client):
    r = await client.get("/health/")
    assert r.status_code == 200 and r.json()["database"] == "connected"


async def test_visitor_count_feedback_contact(client, admin_headers):
    assert (await client.post("/visitor-count/")).json()["count"] == 1
    assert (await client.post("/visitor-count/")).json()["count"] == 2

    ok = await client.post("/feedback/", json={"name": "A", "email": "a@example.com", "message": "hi"})
    assert ok.status_code == 201
    bad = await client.post("/feedback/", json={"name": "A", "email": "bad", "message": "hi"})
    assert bad.status_code == 422
    assert (await client.get("/admin-api/feedback/", headers=admin_headers)).json()["count"] == 1

    assert (await client.get("/contact/")).status_code == 200
    assert (await client.patch("/contact/", json={"phone": "1"})).status_code == 401
    patched = await client.patch("/contact/", json={"phone": "555"}, headers=admin_headers)
    assert patched.json()["phone"] == "555"
