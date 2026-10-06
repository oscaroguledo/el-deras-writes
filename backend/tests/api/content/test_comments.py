async def _article(client, headers):
    r = await client.post("/articles/", headers=headers, json={
        "title": "T", "content": "c", "category": "books", "status": "published"})
    return r.json()


async def test_comments_flow(client, admin_headers):
    a = await _article(client, admin_headers)
    url = f"/articles/{a['id']}/comments/"
    top = (await client.post(url, json={"content": "first"})).json()
    assert top["author"] is None and top["approved"] is True
    reply = await client.post(url, json={"content": "reply", "parent": top["id"]})
    assert reply.status_code == 201
    await client.post(url, json={"content": "nested", "parent": reply.json()["id"]})

    listed = (await client.get(url)).json()
    assert len(listed) == 1
    assert listed[0]["replies"][0]["content"] == "reply"
    assert listed[0]["replies"][0]["replies"][0]["content"] == "nested"
    assert (await client.get("/articles/not-a-uuid/comments/")).status_code == 422


async def test_admin_moderation(client, admin_headers):
    a = await _article(client, admin_headers)
    c = (await client.post(f"/articles/{a['id']}/comments/", json={"content": "hi"})).json()

    assert (await client.get("/admin-api/comments/")).status_code == 401
    flagged = await client.post(f"/admin-api/comments/{c['id']}/flag/", headers=admin_headers)
    assert flagged.json()["is_flagged"] is True
    page = (await client.get("/admin-api/comments/", params={"is_flagged": True},
                             headers=admin_headers)).json()
    assert page["count"] == 1
    assert (await client.post(f"/admin-api/comments/{c['id']}/approve_comment/",
                              headers=admin_headers)).status_code == 200
    assert (await client.delete(f"/admin-api/comments/{c['id']}/", headers=admin_headers)).status_code == 204
