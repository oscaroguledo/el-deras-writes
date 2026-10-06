async def test_admin_users(client, admin_headers):
    r = await client.post("/admin-api/users/", headers=admin_headers, json={
        "username": "bob", "email": "bob@example.com", "password": "pw12345", "user_type": "admin"})
    assert r.status_code == 201 and r.json()["is_staff"] is True and "password" not in r.json()
    dup = await client.post("/admin-api/users/", headers=admin_headers, json={
        "username": "bob2", "email": "bob@example.com", "password": "x"})
    assert dup.status_code == 400

    users = (await client.get("/admin-api/users/", params={"search": "bob"}, headers=admin_headers)).json()
    assert users["count"] == 1
    uid = users["results"][0]["id"]
    demoted = await client.patch(f"/admin-api/users/{uid}/", headers=admin_headers,
                                 json={"user_type": "normal"})
    assert demoted.json()["is_staff"] is False
    assert (await client.delete(f"/admin-api/users/{uid}/", headers=admin_headers)).status_code == 204


async def test_cannot_delete_self(client, admin_headers):
    me = (await client.get("/admin-api/users/", headers=admin_headers)).json()["results"][0]
    assert (await client.delete(f"/admin-api/users/{me['id']}/", headers=admin_headers)).status_code == 400
