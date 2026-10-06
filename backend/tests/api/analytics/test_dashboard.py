async def test_dashboard(client, admin_headers):
    art = (await client.post("/articles/", headers=admin_headers, json={
        "title": "T", "content": "c", "category": "books", "status": "published"})).json()
    await client.post(f"/articles/{art['id']}/comments/", json={"content": "hi"})

    assert (await client.get("/admin-api/dashboard/")).status_code == 401
    d = (await client.get("/admin-api/dashboard/", headers=admin_headers)).json()
    assert d["total_articles"] == 1 and d["total_comments"] == 1 and d["total_categories"] == 9
    assert d["most_liked_articles"][0]["likes"] == 1
    assert d["top_authors"][0]["total_articles"] == 1
    assert d["avg_comments_per_article"] == 1.0
