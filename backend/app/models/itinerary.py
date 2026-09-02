import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    city_id = Column(String(100), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    start_time = Column(String(10), default="10:00", nullable=False)
    end_time = Column(String(10), default="18:00", nullable=False)
    group_size = Column(Integer, default=1, nullable=False)
    budget = Column(Numeric(10, 2), default=1500.0, nullable=False)
    spent_amount = Column(Numeric(10, 2), default=0.0, nullable=False)
    weather = Column(String(20), default="sunny", nullable=False)  # sunny, cloudy, rain
    crowd_tolerance = Column(Integer, default=55, nullable=False)
    guide_id = Column(String(36), ForeignKey("tourist_guides.id", ondelete="SET NULL"), nullable=True)
    guide_cost = Column(Numeric(10, 2), default=0.0, nullable=False)
    total_transit_mins = Column(Integer, default=0, nullable=False)
    limitations = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="itineraries")
    city_rel = relationship("City", back_populates="itineraries")
    guide_rel = relationship("TouristGuide", back_populates="itineraries")
    legs = relationship("ItineraryLeg", back_populates="itinerary_rel", cascade="all, delete-orphan", order_by="ItineraryLeg.order_index")


class ItineraryLeg(Base):
    __tablename__ = "itinerary_legs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    itinerary_id = Column(String(36), ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False, index=True)
    spot_id = Column(String(100), ForeignKey("spots.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    arrive_mins = Column(Integer, nullable=False)
    depart_mins = Column(Integer, nullable=False)
    travel_mins = Column(Integer, default=0, nullable=False)
    cost = Column(Numeric(10, 2), default=0.0, nullable=False)

    # Relationships
    itinerary_rel = relationship("Itinerary", back_populates="legs")
    spot_rel = relationship("Spot", back_populates="itinerary_legs")
