from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.spot import SpotResponse, RankedSpotCard
from app.schemas.guide import GuideResponse


class ItineraryGenerateRequest(BaseModel):
    cityId: str = Field(..., min_length=1)
    weather: Literal["sunny", "cloudy", "rain"] = "sunny"
    startTime: str = Field(default="10:00", pattern=r"^\d{1,2}:\d{2}$")
    endTime: str = Field(default="18:00", pattern=r"^\d{1,2}:\d{2}$")
    groupSize: int = Field(default=1, ge=1, le=20)
    budget: float = Field(default=1500.0, ge=0.0)
    wantGuide: bool = False
    crowdTolerance: int = Field(default=55, ge=10, le=100)
    seed: int = 0
    categories: Optional[List[str]] = None


class ItineraryLegResponse(BaseModel):
    spot: SpotResponse
    arrive: int  # minutes from midnight
    depart: int
    arriveFormatted: str  # e.g. "10:15 AM"
    departFormatted: str  # e.g. "11:00 AM"
    travelMins: int
    cost: float


class ItineraryResponse(BaseModel):
    id: Optional[str] = None
    cityId: str
    cityName: str
    startTime: str
    endTime: str
    windowMins: int
    groupSize: int
    effectiveBudget: float
    spentBudget: float
    totalCost: float
    guideCost: float
    totalTransitMins: int
    finishMins: int
    finishFormatted: str
    legs: List[ItineraryLegResponse]
    limitations: List[str]
    alternates: List[SpotResponse]
    guides: List[GuideResponse]
    assignedGuide: Optional[GuideResponse] = None
    recommendedSpots: List[RankedSpotCard] = []
    summary: str


class ItinerarySaveRequest(BaseModel):
    cityId: str
    title: str = "My Maharashtra Itinerary"
    startTime: str
    endTime: str
    groupSize: int
    budget: float
    spentAmount: float
    weather: str
    crowdTolerance: int
    guideId: Optional[str] = None
    guideCost: float = 0.0
    totalTransitMins: int = 0
    limitations: List[str] = []
    legs: List[dict]
