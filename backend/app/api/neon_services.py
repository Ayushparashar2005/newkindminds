import urllib.request
import json
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import get_db

router = APIRouter(prefix="/neon", tags=["Neon Cloud Services"])
logger = logging.getLogger(__name__)

@router.get("/status")
def get_neon_services_status(db: Session = Depends(get_db)):
    """
    Validates end-to-end connectivity to all deployed Neon services:
    - Lakebase Postgres (Database)
    - Neon Serverless Functions
    - Neon Auth (Managed Better Auth / JWKS)
    - Neon Realtime (Live Query WebSocket API)
    """
    status = {
        "branch": settings.NEON_BRANCH,
        "services": {}
    }

    # 1. Neon Lakebase Postgres check
    try:
        row = db.execute(text("SELECT current_database(), version();")).fetchone()
        status["services"]["postgres"] = {
            "status": "connected",
            "database": row[0] if row else "unknown",
            "version": row[1] if row else "unknown",
            "pooled_url": bool(settings.DATABASE_URL and "pooler" in settings.DATABASE_URL)
        }
    except Exception as e:
        status["services"]["postgres"] = {
            "status": "error",
            "detail": str(e)
        }

    # 2. Neon Function check
    if settings.NEON_FUNCTION_HELLO_BASE_URL:
        try:
            req = urllib.request.Request(settings.NEON_FUNCTION_HELLO_BASE_URL.rstrip("/") + "/", headers={"User-Agent": "KindMinds-Backend"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                status["services"]["functions"] = {
                    "status": "healthy",
                    "http_code": resp.status,
                    "url": settings.NEON_FUNCTION_HELLO_BASE_URL,
                    "response": resp.read().decode().strip()
                }
        except Exception as e:
            status["services"]["functions"] = {
                "status": "unreachable",
                "url": settings.NEON_FUNCTION_HELLO_BASE_URL,
                "detail": str(e)
            }
    else:
        status["services"]["functions"] = {"status": "not_configured"}

    # 3. Neon Auth check
    if settings.NEON_AUTH_JWKS_URL:
        try:
            req = urllib.request.Request(settings.NEON_AUTH_JWKS_URL, headers={"User-Agent": "KindMinds-Backend"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                status["services"]["auth"] = {
                    "status": "healthy",
                    "http_code": resp.status,
                    "jwks_url": settings.NEON_AUTH_JWKS_URL,
                    "keys_count": len(data.get("keys", []))
                }
        except Exception as e:
            status["services"]["auth"] = {
                "status": "unreachable",
                "jwks_url": settings.NEON_AUTH_JWKS_URL,
                "detail": str(e)
            }
    else:
        status["services"]["auth"] = {"status": "not_configured"}

    # 4. Neon Realtime configuration check
    status["services"]["realtime"] = {
        "status": "configured" if settings.NEON_REALTIME_URL else "not_configured",
        "websocket_url": settings.NEON_REALTIME_URL,
        "has_secret": bool(settings.NEON_REALTIME_SECRET)
    }

    return status

