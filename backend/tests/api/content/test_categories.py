async def test_tree_lists_sections_with_children(client):
    tree = (await client.get("/categories/tree/")).json()
    assert [s["name"] for s in tree] == ["Books", "Every Word Series", "Health and Healing"]
    assert [c["slug"] for c in tree[0]["children"]] == [
        "christian-non-fiction-books", "childrens-bible-stories"]


async def test_flat_list_filters(client):
    top = (await client.get("/categories/", params={"top_level": True})).json()
    assert len(top) == 3
    kids = (await client.get("/categories/", params={"parent": "books"})).json()
    assert len(kids) == 2 and all(k["parent_id"] == top[0]["id"] for k in kids)
    assert len((await client.get("/categories/")).json()) == 9


async def test_article_counts_roll_up_to_section(client, admin_headers):
    for title, cat in [("A", "teaching-series"), ("B", "questions-young-people-ask")]:
        await client.post("/articles/", headers=admin_headers, json={
            "title": title, "content": "x", "category": cat, "status": "published"})
    section = (await client.get("/categories/every-word-series/")).json()
    assert section["article_count"] == 2
    assert (await client.get("/categories/teaching-series/")).json()["article_count"] == 1

    in_section = (await client.get("/articles/", params={"category": "every-word-series"})).json()
    assert in_section["count"] == 2
    in_sub = (await client.get("/articles/", params={"category": "Teaching Series"})).json()
    assert in_sub["count"] == 1
    assert len((await client.get("/categories/every-word-series/articles/")).json()) == 2


async def test_admin_crud_and_rules(client, admin_headers):
    created = await client.post("/categories/", headers=admin_headers,
                                json={"name": "Podcasts", "parent": "books"})
    assert created.status_code == 201
    pod = created.json()
    assert pod["slug"] == "podcasts" and pod["parent_id"] is not None

    # only two levels
    deep = await client.post("/categories/", headers=admin_headers,
                             json={"name": "Deep", "parent": "podcasts"})
    assert deep.status_code == 400
    # duplicate name
    dup = await client.post("/categories/", headers=admin_headers, json={"name": "Books"})
    assert dup.status_code == 400
    # a section with sub-sections can't be deleted or demoted
    assert (await client.delete("/categories/books/", headers=admin_headers)).status_code == 409
    demote = await client.patch("/categories/books/", headers=admin_headers,
                                json={"parent": "teaching-series"})
    assert demote.status_code == 400

    moved = await client.patch(f"/categories/{pod['id']}/", headers=admin_headers, json={"parent": ""})
    assert moved.json()["parent_id"] is None
    assert (await client.delete("/categories/podcasts/", headers=admin_headers)).status_code == 204


async def test_writes_require_admin(client, user_headers):
    assert (await client.post("/categories/", json={"name": "X"})).status_code == 401
    assert (await client.post("/categories/", json={"name": "X"}, headers=user_headers)).status_code == 403
