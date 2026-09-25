from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
import app.db.models  # Ensure all SQLAlchemy models are registered
from app.api.endpoints.forensics import router as forensics_router
from app.samples.seeder import seed_database

# Create all database tables
from app.db.init_db import migrate_and_init_db
from app.services.blockchain import BlockchainService

# Safely verify/migrate database tables and columns
migrate_and_init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Enterprise-grade AI-assisted email digital forensics and threat intelligence platform.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed sample evidence and initialize blockchain ledger on startup
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database(db)
        BlockchainService.init_ledger(db)
    finally:
        db.close()

# Mount API routes
app.include_router(forensics_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }