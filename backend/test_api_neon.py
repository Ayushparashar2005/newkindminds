import sys
import json
from dotenv import load_dotenv

load_dotenv('d:/opuimquake/.env')
sys.path.insert(0, 'd:/opuimquake')

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

print("=== 1. Testing GET /api/neon/status ===")
res = client.get('/api/neon/status')
print("Status Code:", res.status_code)
print("Response:", json.dumps(res.json(), indent=2))

print("\n=== 2. Testing GET /api/disasters (from Neon PostgreSQL) ===")
res = client.get('/api/disasters')
print("Status Code:", res.status_code)
disasters = res.json()
print(f"Fetched {len(disasters)} disasters from Neon PostgreSQL:")
for d in disasters:
    print(f"  - [{d.get('category')}] {d.get('name')} ({d.get('region')})")

print("\n=== 3. Testing GET /api/assistance-requests (from Neon PostgreSQL) ===")
res = client.get('/api/assistance-requests')
print("Status Code:", res.status_code)
requests = res.json()
print(f"Fetched {len(requests)} assistance requests from Neon PostgreSQL:")
for r in requests[:3]:
    print(f"  - [{r.get('status')}] {r.get('assistance_category')}: {r.get('description')[:45]}...")

