import requests

try:
    # Use the correct backend port and valid seed data credentials
    resp = requests.post(
        "http://localhost:8000/api/v1/auth/login", 
        json={"email": "employee@techcorp.com", "password": "Emp@123456"}
    )
    print("Status Code:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
