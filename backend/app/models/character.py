from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from datetime import datetime, timezone
from ..db import Base


def _now():
    return datetime.now(timezone.utc)


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)

    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    class_type = Column(String(50))
    background = Column(String(100))
    ability_scores = Column(JSON)
    current_hp = Column(Integer, default=10)
    max_hp = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), default=_now)
