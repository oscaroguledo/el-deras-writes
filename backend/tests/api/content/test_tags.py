async def test_tags(client, admin_headers):
    await client.post("/articles/", headers=admin_headers, json={
        "title": "T", "content": "c", "category": "books", "status": "published",
        "tags": ["python", "fastapi"]})
    tags = (await client.get("/tags/popular/")).json()
    assert {t["name"] for t in tags} == {"python", "fastapi"} and tags[0]["article_count"] == 1
    assert len((await client.get(f"/tags/{tags[0]['id']}/articles/")).json()) == 1

    dup = await client.post("/tags/", json={"name": "python"}, headers=admin_headers)
    assert dup.status_code == 400
    assert (await client.delete(f"/tags/{tags[0]['id']}/", headers=admin_headers)).status_code == 204
    assert len((await client.get("/tags/")).json()) == 1
