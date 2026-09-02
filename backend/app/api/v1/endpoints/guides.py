from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_optional_current_user
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.guide import TouristGuide
from app.models.user import User
from app.schemas.guide import GuideResponse, GuideBookingRequest

router = APIRouter()


@router.get("/", response_model=List[GuideResponse])
async def list_guides(
    city_id: Optional[str] = None,
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
):
    """List certified local tourist guides for a city."""
    stmt = select(TouristGuide).where(TouristGuide.is_available == True)
    if city_id:
        stmt = stmt.where(TouristGuide.city == city_id.lower())

    stmt = stmt.order_by(TouristGuide.rating.desc()).limit(limit)
    result = await db.execute(stmt)
    guides = result.scalars().all()

    return [
        GuideResponse(
            id=g.id,
            city=g.city,
            name=g.name,
            languages=g.languages,
            focus=g.focus,
            rating=float(g.rating),
            feePerHour=float(g.fee_per_hour),
            is_available=g.is_available,
        )
        for g in guides
    ]


@router.post("/book", status_code=status.HTTP_200_OK)
async def book_guide(
    req: GuideBookingRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Book a certified local guide for an itinerary."""
    stmt = select(TouristGuide).where(TouristGuide.id == req.guideId)
    guide = (await db.execute(stmt)).scalar_one_or_none()
    if not guide:
        raise NotFoundException(detail="Guide not found")

    total_cost = float(guide.fee_per_hour) * req.hours
    return {
        "status": "confirmed",
        "guideName": guide.name,
        "hours": req.hours,
        "feePerHour": float(guide.fee_per_hour),
        "totalFee": total_cost,
        "message": f"{guide.name} is booked for your full window. ₹{int(total_cost)} added to total.",
    }
