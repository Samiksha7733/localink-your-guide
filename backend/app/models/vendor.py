import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class VendorListing(Base):
    __tablename__ = "vendor_listings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), index=True, nullable=False)  # Event/pop-up name
    host = Column(String(150), nullable=False)  # Host name / stall name
    city = Column(String(100), ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False, index=True)
    price = Column(String(50), nullable=False)  # e.g. "₹350" or "350"
    window = Column(String(100), nullable=False)  # e.g. "Sun, 12–3 PM"
    kind = Column(String(50), nullable=False)  # Food stall, Craft workshop, Home kitchen, Farm pop-up, Artisan visit
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="vendor_listings")
    city_rel = relationship("City", back_populates="vendor_listings")
