from typing import Optional
from pydantic import BaseModel, ConfigDict


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    tagline: str
    image: Optional[str] = None
    lat: float
    lng: float
    weather: str
    temp: float
    featured: Optional[bool] = False
    district: Optional[str] = None


class CitySummaryResponse(BaseModel):
    id: str
    name: str
    tagline: str
    weather: str
    temp: float
    spots_count: int
    avg_crowd: int
