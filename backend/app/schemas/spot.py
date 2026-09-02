from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict


class SpotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    city: str
    cityName: Optional[str] = None
    lat: float
    lng: float
    category: str
    crowd: int
    peak: str
    walkMins: int
    cost: float
    hidden: bool
    blurb: str
    rating: float
    reviews: int
    durationMins: int
    image: Optional[str] = None
    tags: Optional[List[str]] = []


class RankedSpotCard(BaseModel):
    id: str
    name: str
    city: str
    cityName: str
    category: str
    peak: str
    crowd: int
    liveCrowd: int
    walkMins: int
    cost: float
    hidden: bool
    blurb: str
    rating: float
    reviews: int
    durationMins: int
    lat: float
    lng: float
    score: float
    reason: str
    when: Literal["now", "soon", "later"]
    minutesUntilPeak: int
    nearby: bool


class HeatmapDataResponse(BaseModel):
    city_id: str
    city_name: str
    weather: str
    temp: float
    avg_crowd: int
    total_spots: int
    spots: List[SpotResponse]
