from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.spot import RankedSpotCard


class SarathiAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    cityId: Optional[str] = None
    time: Optional[str] = None
    sessionId: Optional[str] = None


class SarathiAskResponse(BaseModel):
    text: str
    sources: List[str] = []
    suggestions: List[RankedSpotCard] = []
    language: str = "en"
    sessionId: Optional[str] = None


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    text: str
    sources: List[str]
    suggestions: List[dict]
    language: str
    created_at: datetime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    city_id: Optional[str] = None
    created_at: datetime
    messages: List[ChatMessageResponse] = []
