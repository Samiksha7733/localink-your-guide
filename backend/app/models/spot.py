from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Spot(Base):
    __tablename__ = "spots"

    id = Column(String(100), primary_key=True)  # slug or id, e.g. "m1", "p2"
    city = Column(String(100), ForeignKey("cities.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Food, Heritage, Nature, Craft, Spiritual
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    crowd = Column(Integer, default=50, nullable=False)  # Base crowd popularity score 0-100
    peak = Column(String(100), nullable=False)  # Peak window string, e.g. "8–11 AM", "6–9 PM"
    peak_start_mins = Column(Integer, default=540, nullable=False)  # Minutes from midnight
    peak_end_mins = Column(Integer, default=720, nullable=False)  # Minutes from midnight
    walk_mins = Column(Integer, default=15, nullable=False)  # Typical walk time from transit hub
    cost = Column(Numeric(10, 2), default=0.0, nullable=False)  # ₹ per person
    hidden = Column(Boolean, default=False, index=True, nullable=False)  # Hidden gem flag
    blurb = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    rating = Column(Float, default=4.5, nullable=False)
    reviews = Column(Integer, default=50, nullable=False)
    duration_mins = Column(Integer, default=45, nullable=False)  # Typical duration in mins
    image_url = Column(Text, nullable=True)
    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    city_rel = relationship("City", back_populates="spots")
    itinerary_legs = relationship("ItineraryLeg", back_populates="spot_rel")
