import requests

API_URL = "http://localhost:8000"

def test_login(username, password):
    print(f"Testing login for: {username}...")
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={"username": username, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            print(f"  [SUCCESS] Logged in as {username}")
            return response.json()["access_token"]
        else:
            print(f"  [FAILED] {response.status_code}: {response.json().get('detail')}")
            return None
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None

def main():
    print("--- Authentication Flow Test ---")
    
    # 1. Test Root login (should require password)
    test_login("root", "wrongpassword") # Should fail
    test_login("root", "root123")        # Should succeed
    
    # 2. Test Guest login
    test_login("guest", "guest123")      # Should succeed
    
    # 3. Test non-existent user
    test_login("nonexistent", "password") # Should fail

if __name__ == "__main__":
    main()
