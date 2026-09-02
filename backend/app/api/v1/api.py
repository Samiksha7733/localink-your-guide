from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    destinations,
    spots,
    itinerary,
    concierge,
    vendors,
    guides,
    users,
    recommendations,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(destinations.router, prefix="/destinations", tags=["Destinations & Heatmap"])
api_router.include_router(spots.router, prefix="/spots", tags=["Spots & Attractions"])
api_router.include_router(itinerary.router, prefix="/itinerary", tags=["Itinerary Engine"])
api_router.include_router(concierge.router, prefix="/concierge", tags=["Sarathi AI Concierge"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["Micro-Vendors"])
api_router.include_router(guides.router, prefix="/guides", tags=["Tourist Guides"])
api_router.include_router(users.router, prefix="/users", tags=["User Profiles"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["AI Recommendations"])
