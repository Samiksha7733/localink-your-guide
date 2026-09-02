import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TouristGuide(Base):
    __tablename__ = "tourist_guides"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    city = Column(String(100), ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    languages = Column(String(200), default="Marathi, Hindi, English", nullable=False)
    focus = Column(String(150), default="Heritage walks", nullable=False)
    rating = Column(Float, default=4.8, nullable=False)
    fee_per_hour = Column(Numeric(10, 2), default=300.0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    city_rel = relationship("City", back_populates="tourist_guides")
    itineraries = relationship("Itinerary", back_populates="guide_rel")
