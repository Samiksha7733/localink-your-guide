from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.endpoints.auth import get_current_user, get_optional_current_user
from app.core.database import get_db
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.city import City
from app.models.spot import Spot
from app.models.guide import TouristGuide
from app.models.itinerary import Itinerary, ItineraryLeg
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryGenerateRequest,
    ItineraryResponse,
    ItinerarySaveRequest,
    ItineraryLegResponse,
)
from app.schemas.spot import SpotResponse
from app.services.itinerary_engine import itinerary_engine
from app.services.time_utils import from_mins

router = APIRouter()


@router.post("/generate", response_model=ItineraryResponse)
async def generate_itinerary(
    req: ItineraryGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a time-boxed, weather and traffic-aware micro-itinerary."""
    city_stmt = select(City).where(City.id == req.cityId.lower())
    city = (await db.execute(city_stmt)).scalar_one_or_none()
    if not city:
        raise NotFoundException(detail=f"City '{req.cityId}' not found")

    spots_stmt = select(Spot).options(selectinload(Spot.city_rel))
    all_spots = (await db.execute(spots_stmt)).scalars().all()

    guides_stmt = select(TouristGuide).where(TouristGuide.city == city.id)
    guides = (await db.execute(guides_stmt)).scalars().all()

    plan = itinerary_engine.generate_plan(
        req=req,
        city=city,
        all_spots=all_spots,
        guides=guides,
    )
    return plan


@router.post("/save", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
async def save_itinerary(
    req: ItinerarySaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save an itinerary to the authenticated user's profile."""
    city_stmt = select(City).where(City.id == req.cityId.lower())
    city = (await db.execute(city_stmt)).scalar_one_or_none()
    if not city:
        raise NotFoundException(detail=f"City '{req.cityId}' not found")

    new_itinerary = Itinerary(
        user_id=current_user.id,
        city_id=city.id,
        title=req.title,
        start_time=req.startTime,
        end_time=req.endTime,
        group_size=req.groupSize,
        budget=req.budget,
        spent_amount=req.spentAmount,
        weather=req.weather,
        crowd_tolerance=req.crowdTolerance,
        guide_id=req.guideId,
        guide_cost=req.guideCost,
        total_transit_mins=req.totalTransitMins,
        limitations=req.limitations,
    )
    db.add(new_itinerary)
    await db.flush()

    for idx, leg in enumerate(req.legs):
        leg_row = ItineraryLeg(
            itinerary_id=new_itinerary.id,
            spot_id=leg.get("spotId") or leg.get("spot", {}).get("id"),
            order_index=idx,
            arrive_mins=leg.get("arrive", 0),
            depart_mins=leg.get("depart", 0),
            travel_mins=leg.get("travelMins", 0),
            cost=leg.get("cost", 0.0),
        )
        db.add(leg_row)

    await db.commit()

    # Re-fetch full itinerary with relationships
    return await get_saved_itinerary(itinerary_id=new_itinerary.id, db=db)


@router.get("/my-itineraries", response_model=List[ItineraryResponse])
async def list_my_itineraries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all itineraries saved by the current user."""
    stmt = (
        select(Itinerary)
        .where(Itinerary.user_id == current_user.id)
        .options(
            selectinload(Itinerary.city_rel),
            selectinload(Itinerary.guide_rel),
            selectinload(Itinerary.legs).selectinload(ItineraryLeg.spot_rel),
        )
        .order_by(Itinerary.created_at.desc())
    )
    itineraries = (await db.execute(stmt)).scalars().all()
    results = []
    for it in itineraries:
        legs_resp = []
        for leg in it.legs:
            if leg.spot_rel:
                spot_resp = SpotResponse(
                    id=leg.spot_rel.id,
                    name=leg.spot_rel.name,
                    city=leg.spot_rel.city,
                    cityName=it.city_rel.name if it.city_rel else leg.spot_rel.city,
                    lat=leg.spot_rel.latitude,
                    lng=leg.spot_rel.longitude,
                    category=leg.spot_rel.category,
                    crowd=leg.spot_rel.crowd,
                    peak=leg.spot_rel.peak,
                    walkMins=leg.spot_rel.walk_mins,
                    cost=float(leg.spot_rel.cost),
                    hidden=leg.spot_rel.hidden,
                    blurb=leg.spot_rel.blurb,
                    rating=float(leg.spot_rel.rating),
                    reviews=leg.spot_rel.reviews,
                    durationMins=leg.spot_rel.duration_mins,
                    tags=leg.spot_rel.tags or [],
                )
                legs_resp.append(
                    ItineraryLegResponse(
                        spot=spot_resp,
                        arrive=leg.arrive_mins,
                        depart=leg.depart_mins,
                        arriveFormatted=from_mins(leg.arrive_mins),
                        departFormatted=from_mins(leg.depart_mins),
                        travelMins=leg.travel_mins,
                        cost=float(leg.cost),
                    )
                )

        results.append(
            ItineraryResponse(
                id=it.id,
                cityId=it.city_id,
                cityName=it.city_rel.name if it.city_rel else it.city_id,
                startTime=it.start_time,
                endTime=it.end_time,
                windowMins=480,
                groupSize=it.group_size,
                effectiveBudget=float(it.budget),
                spentBudget=float(it.spent_amount),
                totalCost=float(it.spent_amount) + float(it.guide_cost),
                guideCost=float(it.guide_cost),
                totalTransitMins=it.total_transit_mins,
                finishMins=legs_resp[-1].depart if legs_resp else 0,
                finishFormatted=legs_resp[-1].departFormatted if legs_resp else it.end_time,
                legs=legs_resp,
                limitations=it.limitations or [],
                alternates=[],
                guides=[],
                summary=it.title,
            )
        )
    return results


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_saved_itinerary(
    itinerary_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single saved itinerary."""
    stmt = (
        select(Itinerary)
        .where(Itinerary.id == itinerary_id)
        .options(
            selectinload(Itinerary.city_rel),
            selectinload(Itinerary.guide_rel),
            selectinload(Itinerary.legs).selectinload(ItineraryLeg.spot_rel),
        )
    )
    it = (await db.execute(stmt)).scalar_one_or_none()
    if not it:
        raise NotFoundException(detail=f"Itinerary '{itinerary_id}' not found")

    legs_resp = []
    for leg in it.legs:
        if leg.spot_rel:
            spot_resp = SpotResponse(
                id=leg.spot_rel.id,
                name=leg.spot_rel.name,
                city=leg.spot_rel.city,
                cityName=it.city_rel.name if it.city_rel else leg.spot_rel.city,
                lat=leg.spot_rel.latitude,
                lng=leg.spot_rel.longitude,
                category=leg.spot_rel.category,
                crowd=leg.spot_rel.crowd,
                peak=leg.spot_rel.peak,
                walkMins=leg.spot_rel.walk_mins,
                cost=float(leg.spot_rel.cost),
                hidden=leg.spot_rel.hidden,
                blurb=leg.spot_rel.blurb,
                rating=float(leg.spot_rel.rating),
                reviews=leg.spot_rel.reviews,
                durationMins=leg.spot_rel.duration_mins,
                tags=leg.spot_rel.tags or [],
            )
            legs_resp.append(
                ItineraryLegResponse(
                    spot=spot_resp,
                    arrive=leg.arrive_mins,
                    depart=leg.depart_mins,
                    arriveFormatted=from_mins(leg.arrive_mins),
                    departFormatted=from_mins(leg.depart_mins),
                    travelMins=leg.travel_mins,
                    cost=float(leg.cost),
                )
            )

    return ItineraryResponse(
        id=it.id,
        cityId=it.city_id,
        cityName=it.city_rel.name if it.city_rel else it.city_id,
        startTime=it.start_time,
        endTime=it.end_time,
        windowMins=480,
        groupSize=it.group_size,
        effectiveBudget=float(it.budget),
        spentBudget=float(it.spent_amount),
        totalCost=float(it.spent_amount) + float(it.guide_cost),
        guideCost=float(it.guide_cost),
        totalTransitMins=it.total_transit_mins,
        finishMins=legs_resp[-1].depart if legs_resp else 0,
        finishFormatted=legs_resp[-1].departFormatted if legs_resp else it.end_time,
        legs=legs_resp,
        limitations=it.limitations or [],
        alternates=[],
        guides=[],
        summary=it.title,
    )
