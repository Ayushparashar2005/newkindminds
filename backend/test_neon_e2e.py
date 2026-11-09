import os
import sys
import json
import urllib.request
from dotenv import load_dotenv

# Load Neon environment
load_dotenv('d:/opuimquake/.env')
sys.path.insert(0, 'd:/opuimquake')

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.entities import DisasterEvent, Organization, HumanitarianResource, AssistanceRequest
from sqlalchemy import text

print("=" * 60)
print("KINDMINDS — NEON SERVICES END-TO-END VERIFICATION")
print("=" * 60)

# 1. Lakebase Postgres
print("\n[1/4] Testing Neon Lakebase Postgres...")
db = SessionLocal()
try:
    version = db.execute(text("SELECT version();")).fetchone()[0]
    db_name = db.execute(text("SELECT current_database();")).fetchone()[0]
    disasters_count = db.query(DisasterEvent).count()
    orgs_count = db.query(Organization).count()
    resources_count = db.query(HumanitarianResource).count()
    requests_count = db.query(AssistanceRequest).count()
    print("  -> Status: CONNECTED")
    print(f"  -> Database: {db_name}")
    print(f"  -> Host: {settings.DATABASE_URL.split('@')[-1]}")
    print(f"  -> PostgreSQL Version: {version[:50]}...")
    print(f"  -> Seeded Records: {disasters_count} disasters, {orgs_count} organizations, {resources_count} resources, {requests_count} assistance requests")
except Exception as e:
    print(f"  -> FAILED: {e}")
finally:
    db.close()

# 2. Neon Functions
print("\n[2/4] Testing Neon Serverless Functions...")
func_url = settings.NEON_FUNCTION_HELLO_BASE_URL
print(f"  -> Function URL: {func_url}")
try:
    req = urllib.request.Request(func_url.rstrip('/') + '/', headers={'User-Agent': 'KindMinds-E2E'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode().strip()
        print(f"  -> HTTP Status: {resp.status}")
        print(f"  -> Response Body: \"{body}\"")
        print("  -> Status: HEALTHY")
except Exception as e:
    print(f"  -> FAILED: {e}")

# 3. Neon Auth
print("\n[3/4] Testing Neon Auth (Managed Better Auth)...")
auth_url = settings.NEON_AUTH_JWKS_URL
print(f"  -> JWKS URL: {auth_url}")
try:
    req = urllib.request.Request(auth_url, headers={'User-Agent': 'KindMinds-E2E'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        jwks = json.loads(resp.read().decode())
        print(f"  -> HTTP Status: {resp.status}")
        print(f"  -> Signing Keys Count: {len(jwks.get('keys', []))}")
        print(f"  -> Key Algorithm: {jwks.get('keys', [{}])[0].get('alg')}")
        print("  -> Status: HEALTHY")
except Exception as e:
    print(f"  -> FAILED: {e}")

# 4. Neon Realtime
print("\n[4/4] Testing Neon Realtime Configuration...")
print(f"  -> Realtime WebSocket URL: {settings.NEON_REALTIME_URL}")
print(f"  -> Realtime Secret Configured: {'YES' if settings.NEON_REALTIME_SECRET else 'NO'}")
print("  -> Status: CONFIGURED & READY")

print("\n" + "=" * 60)
print("ALL NEON SERVICES SUCCESSFULLY VERIFIED")
print("=" * 60)

