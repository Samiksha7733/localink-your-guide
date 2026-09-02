from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.spot import RankedSpotCard


class RecommendationRequest(BaseModel):
    cityId: str = Field(..., description="Target destination / city ID (e.g. 'pune', 'mumbai')")
    time: Optional[str] = Field(default=None, description="Time string HH:MM or current time")
    weather: Optional[Literal["sunny", "rain", "cloudy"]] = "sunny"
    budget: Optional[float] = Field(default=1500.0, ge=0.0, description="Available budget")
    tripDurationHours: Optional[int] = Field(default=6, ge=1, le=48, description="Duration in hours")
    groupSize: Optional[int] = Field(default=1, ge=1, le=20)
    interests: Optional[List[str]] = Field(default=[], description="User interests: Food, Heritage, Nature, Craft, Spiritual")
    travelStyle: Optional[str] = Field(default="spontaneous", description="slow, spontaneous, cultural, eco-walkable")
    crowdTolerance: Optional[int] = Field(default=55, ge=10, le=100)
    previousSpotIds: Optional[List[str]] = Field(default=[], description="Spot IDs already visited")
    limit: Optional[int] = Field(default=10, ge=3, le=20)
    includeNearby: Optional[bool] = True


class RecommendationResponse(BaseModel):
    cityId: str
    cityName: str
    time: str
    hourMins: int
    weather: str
    summary: str
    spots: List[RankedSpotCard]
    aiNarrative: Optional[str] = None
    curatedHighlights: List[str] = []
