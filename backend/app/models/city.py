from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class City(Base):
    __tablename__ = "cities"

    id = Column(String(100), primary_key=True)  # slug id e.g. "pune", "mumbai"
    name = Column(String(150), index=True, nullable=False)
    tagline = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    weather_condition = Column(String(100), default="Clear skies", nullable=False)
    temperature = Column(Float, default=26.0, nullable=False)
    is_featured = Column(Boolean, default=False, index=True, nullable=False)
    district = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    spots = relationship("Spot", back_populates="city_rel", cascade="all, delete-orphan")
    vendor_listings = relationship("VendorListing", back_populates="city_rel")
    tourist_guides = relationship("TouristGuide", back_populates="city_rel")
    itineraries = relationship("Itinerary", back_populates="city_rel")
