from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.core.config import settings
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.models.entities import DisasterEvent
from backend.app.api.seed import seed_demo_data
from backend.app.api.disasters import router as disasters_router
from backend.app.api.resources import router as resources_router
from backend.app.api.organizations import router as organizations_router
from backend.app.api.search_groups import router as search_groups_router
from backend.app.api.assistance import router as assistance_router
from backend.app.api.sop import router as sop_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.mental_health import router as mental_health_router
from backend.app.api.seed import router as seed_router
from backend.app.api.neon_services import router as neon_router
from backend.app.api.external_public_apis import router as external_apis_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed initial demo data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(DisasterEvent).count() == 0:
            seed_demo_data(force=False, db=db)
    except Exception as e:
        print(f"Startup seed notice: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="KindMinds — AI-Powered Mental Health Support & Humanitarian Disaster Response Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(disasters_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(organizations_router, prefix=settings.API_V1_STR)
app.include_router(search_groups_router, prefix=settings.API_V1_STR)
app.include_router(assistance_router, prefix=settings.API_V1_STR)
app.include_router(sop_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(mental_health_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)
app.include_router(neon_router, prefix=settings.API_V1_STR)
app.include_router(external_apis_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "KindMinds",
        "description": "AI-Powered Mental Health Support & Humanitarian Disaster Response Platform",
        "two_panels": {
            "helper": "/helper",
            "needer": "/needer"
        },
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected"
    }

