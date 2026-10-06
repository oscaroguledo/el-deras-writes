def _article(**over):
    return {"title": "Hello World", "content": "Body text", "category": "teaching-series",
            "tags": ["python", "fastapi"], "status": "published", **over}


async def test_write_endpoints_require_admin(client, user_headers):
    assert (await client.post("/articles/", json=_article())).status_code == 401
    assert (await client.post("/articles/", json=_article(), headers=user_headers)).status_code == 403
    assert (await client.get("/articles/")).status_code == 200


async def test_article_lifecycle(client, admin_headers):
    created = await client.post("/articles/", json=_article(), headers=admin_headers)
    assert created.status_code == 201, created.text
    a = created.json()
    assert a["slug"] == "hello-world"
    assert a["category"] == "Teaching Series" and a["category_slug"] == "teaching-series"
    assert a["tags"] == ["fastapi", "python"] and a["published_at"] is not None

    dup = (await client.post("/articles/", json=_article(), headers=admin_headers)).json()
    assert dup["slug"] == "hello-world-1"

    assert (await client.get(f"/articles/{a['id']}/")).json()["views"] == 1
    assert (await client.get("/articles/hello-world/")).json()["views"] == 2

    patched = await client.patch(f"/articles/{a['id']}/", json={"featured": True}, headers=admin_headers)
    assert patched.json()["featured"] is True and patched.json()["title"] == "Hello World"

    assert (await client.delete(f"/articles/{a['id']}/", headers=admin_headers)).status_code == 204
    assert (await client.get(f"/articles/{a['id']}/")).status_code == 404


async def test_unknown_category_is_400(client, admin_headers):
    r = await client.post("/articles/", json=_article(category="Nope"), headers=admin_headers)
    assert r.status_code == 400


async def test_drafts_hidden_and_pagination_shape(client, admin_headers):
    for i in range(3):
        await client.post("/articles/", json=_article(title=f"Pub {i}"), headers=admin_headers)
    await client.post("/articles/", json=_article(title="Secret", status="draft"), headers=admin_headers)

    public = (await client.get("/articles/", params={"page_size": 2})).json()
    assert public["count"] == 3 and len(public["results"]) == 2
    assert public["next"] and public["previous"] is None
    assert (await client.get(public["next"])).json()["next"] is None
    assert (await client.get("/articles/", headers=admin_headers)).json()["count"] == 4
    assert (await client.get("/articles/", params={"page": 9})).status_code == 404


async def test_search_filters_and_suggestions(client, admin_headers):
    await client.post("/articles/", json=_article(title="Learning Rust"), headers=admin_headers)
    await client.post("/articles/", json=_article(title="Cooking Pasta"), headers=admin_headers)

    assert (await client.get("/articles/", params={"search": "rust"})).json()["count"] == 1
    assert (await client.get("/articles/", params={"tag": "PYTHON"})).json()["count"] == 2
    assert (await client.get("/articles/search/", params={"q": "pasta"})).json()["count"] == 1
    assert (await client.get("/articles/search/")).json() == {"results": []}
    sug = (await client.get("/articles/suggestions/", params={"q": "te"})).json()["suggestions"]
    assert "in Teaching Series" in sug
    assert (await client.get("/articles/featured/")).json()["count"] == 0
    assert (await client.get("/articles/popular/")).status_code == 200
    assert (await client.get("/articles/recent/")).status_code == 200
