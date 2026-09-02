from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.city import City
from app.models.spot import Spot
from app.schemas.city import CityResponse
from app.schemas.spot import HeatmapDataResponse, SpotResponse
from app.services.itinerary_engine import calculate_live_crowd
from app.services.time_utils import to_mins

router = APIRouter()


@router.get("/cities", response_model=List[CityResponse])
async def list_cities(
    featured: Optional[bool] = None,
    query: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all cities and towns with optional search and featured filtering."""
    stmt = select(City)
    if featured is not None:
        stmt = stmt.where(City.is_featured == featured)
    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where((City.name.ilike(q)) | (City.tagline.ilike(q)))

    stmt = stmt.order_by(City.name.asc())
    result = await db.execute(stmt)
    cities = result.scalars().all()
    return [
        CityResponse(
            id=c.id,
            name=c.name,
            tagline=c.tagline,
            image=c.image_url,
            lat=c.latitude,
            lng=c.longitude,
            weather=c.weather_condition,
            temp=c.temperature,
            featured=c.is_featured,
            district=c.district,
        )
        for c in cities
    ]


@router.get("/cities/{city_id}", response_model=CityResponse)
async def get_city(city_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a specific city."""
    stmt = select(City).where(City.id == city_id.lower())
    city = (await db.execute(stmt)).scalar_one_or_none()
    if not city:
        raise NotFoundException(detail=f"City '{city_id}' not found")
    return CityResponse(
        id=city.id,
        name=city.name,
        tagline=city.tagline,
        image=city.image_url,
        lat=city.latitude,
        lng=city.longitude,
        weather=city.weather_condition,
        temp=city.temperature,
        featured=city.is_featured,
        district=city.district,
    )


@router.get("/heatmap", response_model=HeatmapDataResponse)
async def get_heatmap(
    city_id: str = Query(default="mumbai"),
    time: Optional[str] = None,
    category: Optional[str] = None,
    eco_only: Optional[bool] = False,
    query: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve geo-spatial heatmap data with live crowd scores for the Live Map."""
    stmt = select(City).where(City.id == city_id.lower())
    city = (await db.execute(stmt)).scalar_one_or_none()
    if not city:
        # Fallback to first city
        stmt_fallback = select(City).order_by(City.name.asc())
        city = (await db.execute(stmt_fallback)).scalar_one_or_none()
        if not city:
            raise NotFoundException(detail="No cities configured in database")

    hour_mins = to_mins(time) if time else to_mins("12:00")

    # Fetch spots for city
    spot_stmt = select(Spot).where(Spot.city == city.id)
    if category and category != "All":
        spot_stmt = spot_stmt.where(Spot.category == category)
    if eco_only:
        spot_stmt = spot_stmt.where(Spot.walk_mins <= 30)
    if query:
        q = f"%{query.lower()}%"
        spot_stmt = spot_stmt.where((Spot.name.ilike(q)) | (Spot.blurb.ilike(q)))

    spots = (await db.execute(spot_stmt)).scalars().all()

    spot_resps = []
    total_crowd = 0
    for s in spots:
        crowd_now = calculate_live_crowd(s, hour_mins)
        total_crowd += crowd_now
        spot_resps.append(
            SpotResponse(
                id=s.id,
                name=s.name,
                city=s.city,
                cityName=city.name,
                lat=s.latitude,
                lng=s.longitude,
                category=s.category,
                crowd=crowd_now,
                peak=s.peak,
                walkMins=s.walk_mins,
                cost=float(s.cost),
                hidden=s.hidden,
                blurb=s.blurb,
                rating=float(s.rating),
                reviews=s.reviews,
                durationMins=s.duration_mins,
                tags=s.tags or [],
            )
        )

    avg_crowd = round(total_crowd / len(spots)) if spots else 0

    return HeatmapDataResponse(
        city_id=city.id,
        city_name=city.name,
        weather=city.weather_condition,
        temp=city.temperature,
        avg_crowd=avg_crowd,
        total_spots=len(spots),
        spots=spot_resps,
    )
