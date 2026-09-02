from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.spot import Spot
from app.schemas.spot import SpotResponse

router = APIRouter()


@router.get("/", response_model=List[SpotResponse])
async def list_spots(
    city_id: Optional[str] = None,
    category: Optional[str] = None,
    hidden: Optional[bool] = None,
    max_cost: Optional[float] = None,
    query: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List all spots with rich multi-filter criteria."""
    stmt = select(Spot).options(selectinload(Spot.city_rel))

    if city_id:
        stmt = stmt.where(Spot.city == city_id.lower())
    if category and category != "All":
        stmt = stmt.where(Spot.category == category)
    if hidden is not None:
        stmt = stmt.where(Spot.hidden == hidden)
    if max_cost is not None:
        stmt = stmt.where(Spot.cost <= max_cost)
    if query:
        q = f"%{query.lower()}%"
        stmt = stmt.where(
            (Spot.name.ilike(q)) | (Spot.blurb.ilike(q)) | (Spot.category.ilike(q))
        )

    stmt = stmt.order_by(Spot.rating.desc()).limit(limit)
    result = await db.execute(stmt)
    spots = result.scalars().all()

    return [
        SpotResponse(
            id=s.id,
            name=s.name,
            city=s.city,
            cityName=s.city_rel.name if s.city_rel else s.city,
            lat=s.latitude,
            lng=s.longitude,
            category=s.category,
            crowd=s.crowd,
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
        for s in spots
    ]


@router.get("/{spot_id}", response_model=SpotResponse)
async def get_spot(spot_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a single spot."""
    stmt = select(Spot).where(Spot.id == spot_id).options(selectinload(Spot.city_rel))
    spot = (await db.execute(stmt)).scalar_one_or_none()
    if not spot:
        raise NotFoundException(detail=f"Spot '{spot_id}' not found")

    return SpotResponse(
        id=spot.id,
        name=spot.name,
        city=spot.city,
        cityName=spot.city_rel.name if spot.city_rel else spot.city,
        lat=spot.latitude,
        lng=spot.longitude,
        category=spot.category,
        crowd=spot.crowd,
        peak=spot.peak,
        walkMins=spot.walk_mins,
        cost=float(spot.cost),
        hidden=spot.hidden,
        blurb=spot.blurb,
        rating=float(spot.rating),
        reviews=spot.reviews,
        durationMins=spot.duration_mins,
        tags=spot.tags or [],
    )
