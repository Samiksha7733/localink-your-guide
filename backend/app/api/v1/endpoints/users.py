from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_db
from app.models.user import User, UserPreference
from app.schemas.user import UserPreferenceResponse, UserPreferenceUpdate

router = APIRouter()


@router.get("/preferences", response_model=UserPreferenceResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's travel preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref = (await db.execute(stmt)).scalar_one_or_none()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            preferred_cities=[],
            favorite_categories=[],
            default_budget=1500.0,
            default_group_size=1,
            crowd_tolerance=55,
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return UserPreferenceResponse.model_validate(pref)


@router.put("/preferences", response_model=UserPreferenceResponse)
async def update_user_preferences(
    update_data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user travel preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref = (await db.execute(stmt)).scalar_one_or_none()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if update_data.preferred_cities is not None:
        pref.preferred_cities = update_data.preferred_cities
    if update_data.favorite_categories is not None:
        pref.favorite_categories = update_data.favorite_categories
    if update_data.default_budget is not None:
        pref.default_budget = update_data.default_budget
    if update_data.default_group_size is not None:
        pref.default_group_size = update_data.default_group_size
    if update_data.crowd_tolerance is not None:
        pref.crowd_tolerance = update_data.crowd_tolerance
    if update_data.travel_style is not None:
        pref.travel_style = update_data.travel_style
    if update_data.mobility_preference is not None:
        pref.mobility_preference = update_data.mobility_preference

    await db.commit()
    await db.refresh(pref)
    return UserPreferenceResponse.model_validate(pref)
