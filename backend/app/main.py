from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.recommendations import router as recommendations_router
from app.core.config import settings
from app.core.database import init_db
from app.scripts.seed_data import seed_database_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed baseline data
    await init_db()
    await seed_database_if_empty()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "service": "Localink API",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
    }


# Include V1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount /api/recommendations endpoint directly as specified in prompt
app.include_router(recommendations_router, prefix="/api/recommendations", tags=["AI Recommendations"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
