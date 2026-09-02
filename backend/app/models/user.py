import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(String(20), default="traveller", nullable=False)  # traveller, vendor, guide, admin
    is_active = Column(Boolean, default=True, nullable=False)
    preferred_language = Column(String(10), default="en", nullable=False)  # en, mr, hi
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    itineraries = relationship("Itinerary", back_populates="user", cascade="all, delete-orphan")
    vendor_listings = relationship("VendorListing", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_cities = Column(JSON, default=list, nullable=False)
    favorite_categories = Column(JSON, default=list, nullable=False)
    default_budget = Column(Numeric(10, 2), default=1500.0, nullable=False)
    default_group_size = Column(Integer, default=1, nullable=False)
    crowd_tolerance = Column(Integer, default=55, nullable=False)
    travel_style = Column(String(50), default="spontaneous", nullable=False)  # spontaneous, slow, cultural, nature
    mobility_preference = Column(String(50), default="walkable", nullable=False)  # walkable, driving

    user = relationship("User", back_populates="preferences")
