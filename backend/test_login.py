import requests

try:
    resp = requests.post("http://localhost:3000/api/v1/auth/login", json={"email": "employee@example.com", "password": "password"})
    print("Status Code:", resp.status_code)
    print("Response:", resp.text)
except Exception as e:
    print("Error:", e)
