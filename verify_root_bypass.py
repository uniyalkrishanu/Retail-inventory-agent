import httpx
import asyncio

async def test_root_bypass():
    url = "http://localhost:8000/auth/login"
    data = {
        "username": "root",
        "password": "any-random-password-123"
    }
    
    print(f"Attempting login as 'root' with wrong password...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=data)
            
            if response.status_code == 200:
                print("Success! Root login bypassed password check.")
                print(f"Token: {response.json().get('access_token')[:20]}...")
            else:
                print(f"Failed! Status: {response.status_code}")
                # print(f"Detail: {response.json().get('detail')}")
    except Exception as e:
        print(f"Could not connect to server: {e}")

if __name__ == "__main__":
    asyncio.run(test_root_bypass())
