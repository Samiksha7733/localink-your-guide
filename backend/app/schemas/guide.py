from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class GuideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    city: str
    name: str
    languages: str
    focus: str
    rating: float
    feePerHour: float
    is_available: Optional[bool] = True


class GuideBookingRequest(BaseModel):
    guideId: str
    itineraryId: Optional[str] = None
    cityId: str
    date: str
    hours: int = Field(default=4, ge=1, le=14)
    groupSize: int = Field(default=1, ge=1)
    notes: Optional[str] = None
