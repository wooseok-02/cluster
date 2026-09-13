# 회원가입,로그인,토큰 발급 fixfure를 위한 것

def test_register_login_and_get_me(client, clean_database):
    user_data = {
        "email": "auth-test@example.com",
        "password": "Test1234!",
        "nick_name": "auth-test",
        "age": 25,
        "gender": "male",
    }

    register_response = client.post("/auth/register", json=user_data)

    assert register_response.status_code == 200
    assert register_response.json()["email"] == user_data["email"]

    login_response = client.post(
        "/auth/login",
        data={
            "username": user_data["email"],
            "password": user_data["password"],
        },
    )

    assert login_response.status_code == 200

    access_token = login_response.json()["access_token"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == user_data["email"]