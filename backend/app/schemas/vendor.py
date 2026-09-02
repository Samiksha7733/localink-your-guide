from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class VendorCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Pop-up event or dish name")
    host: str = Field(..., min_length=2, description="Host / stall name")
    city: str = Field(..., min_length=2, description="City name or ID")
    price: str = Field(..., min_length=1, description="Price per person")
    window: str = Field(..., min_length=2, description="When / Operating hours")
    kind: str = Field(default="Food stall", description="Type of pop-up")
    description: Optional[str] = None


class VendorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    host: str
    city: str
    price: str
    window: str
    kind: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
