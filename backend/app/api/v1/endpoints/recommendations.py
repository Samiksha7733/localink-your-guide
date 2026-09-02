from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.endpoints.auth import get_optional_current_user
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.city import City
from app.models.spot import Spot
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/", response_model=RecommendationResponse)
@router.post("", response_model=RecommendationResponse)
async def get_travel_recommendations(
    req: RecommendationRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dedicated AI travel recommendation endpoint using Google Gemini API.
    Combines destination preferences, interests, budget, trip duration, travel style,
    crowd tolerance, and real spot availability across Maharashtra.
    """
    # 1. Fetch City
    city_stmt = select(City).where(City.id == req.cityId.lower())
    city = (await db.execute(city_stmt)).scalar_one_or_none()
    if not city:
        raise NotFoundException(detail=f"City '{req.cityId}' not found")

    # 2. Enrich request with logged-in user profile preferences if user didn't specify
    if current_user and current_user.preferences:
        pref = current_user.preferences
        if not req.interests and pref.favorite_categories:
            req.interests = pref.favorite_categories
        if req.crowdTolerance == 55 and pref.crowd_tolerance:
            req.crowdTolerance = pref.crowd_tolerance
        if req.travelStyle == "spontaneous" and pref.travel_style:
            req.travelStyle = pref.travel_style

    # 3. Retrieve spots from database
    spots_stmt = select(Spot).options(selectinload(Spot.city_rel))
    all_spots = (await db.execute(spots_stmt)).scalars().all()

    # 4. Generate AI recommendations
    response = await ai_service.generate_recommendations(
        req=req,
        city=city,
        all_spots=all_spots,
    )
    return response
