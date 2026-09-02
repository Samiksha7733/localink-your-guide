from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.endpoints.auth import get_current_user, get_optional_current_user
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.city import City
from app.models.user import User
from app.models.vendor import VendorListing
from app.schemas.vendor import VendorCreateRequest, VendorResponse

router = APIRouter()


@router.get("/", response_model=List[VendorResponse])
async def list_vendors(
    city: Optional[str] = None,
    kind: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all active pop-up listings across Maharashtra."""
    stmt = select(VendorListing).where(VendorListing.is_active == True)
    if city:
        stmt = stmt.where(VendorListing.city == city.lower())
    if kind:
        stmt = stmt.where(VendorListing.kind == kind)

    stmt = stmt.order_by(VendorListing.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    listings = result.scalars().all()

    return [
        VendorResponse(
            id=v.id,
            name=v.name,
            host=v.host,
            city=v.city,
            price=v.price,
            window=v.window,
            kind=v.kind,
            description=v.description,
            is_active=v.is_active,
            created_at=v.created_at,
        )
        for v in listings
    ]


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def publish_vendor(
    req: VendorCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish a new pop-up listing (instant low-barrier micro-vendor onboarding)."""
    # Normalize price format e.g. "150" -> "₹150"
    price = req.price if req.price.startswith("₹") else f"₹{req.price or '0'}"

    # Verify city exists or resolve to closest city slug
    city_stmt = select(City).where(
        (City.id == req.city.lower()) | (City.name.ilike(req.city))
    )
    city_row = (await db.execute(city_stmt)).scalar_one_or_none()
    city_id = city_row.id if city_row else req.city.lower()

    listing = VendorListing(
        user_id=current_user.id if current_user else None,
        name=req.name,
        host=req.host,
        city=city_id,
        price=price,
        window=req.window,
        kind=req.kind,
        description=req.description,
        is_active=True,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    return VendorResponse(
        id=listing.id,
        name=listing.name,
        host=listing.host,
        city=listing.city,
        price=listing.price,
        window=listing.window,
        kind=listing.kind,
        description=listing.description,
        is_active=listing.is_active,
        created_at=listing.created_at,
    )


@router.get("/my-listings", response_model=List[VendorResponse])
async def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all pop-up listings created by the logged in vendor."""
    stmt = (
        select(VendorListing)
        .where(VendorListing.user_id == current_user.id)
        .order_by(VendorListing.created_at.desc())
    )
    listings = (await db.execute(stmt)).scalars().all()
    return [
        VendorResponse(
            id=v.id,
            name=v.name,
            host=v.host,
            city=v.city,
            price=v.price,
            window=v.window,
            kind=v.kind,
            description=v.description,
            is_active=v.is_active,
            created_at=v.created_at,
        )
        for v in listings
    ]


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete or deactivate a pop-up listing."""
    stmt = select(VendorListing).where(VendorListing.id == vendor_id)
    listing = (await db.execute(stmt)).scalar_one_or_none()
    if not listing:
        raise NotFoundException(detail="Vendor listing not found")
    if listing.user_id != current_user.id and current_user.role != "admin":
        raise ForbiddenException()

    listing.is_active = False
    await db.commit()
    return None
