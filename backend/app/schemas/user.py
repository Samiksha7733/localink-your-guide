from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone_number: Optional[str] = None
    role: str = Field(default="traveller", pattern="^(traveller|vendor|guide|admin)$")
    preferred_language: str = Field(default="en", pattern="^(en|mr|hi)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


class UserPreferenceUpdate(BaseModel):
    preferred_cities: Optional[List[str]] = None
    favorite_categories: Optional[List[str]] = None
    default_budget: Optional[float] = Field(None, ge=250.0)
    default_group_size: Optional[int] = Field(None, ge=1, le=20)
    crowd_tolerance: Optional[int] = Field(None, ge=10, le=100)
    travel_style: Optional[str] = None
    mobility_preference: Optional[str] = None


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    preferred_cities: List[str]
    favorite_categories: List[str]
    default_budget: float
    default_group_size: int
    crowd_tolerance: int
    travel_style: str
    mobility_preference: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    preferred_language: str
    avatar_url: Optional[str] = None
    created_at: datetime
    preferences: Optional[UserPreferenceResponse] = None


Token.model_rebuild()
