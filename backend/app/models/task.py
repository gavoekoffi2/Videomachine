from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Task(Base):
    """Represents any automation task: YouTube video, Twitter post, AFM, etc."""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(String(50), nullable=False)  # youtube, twitter, afm, outreach
    status = Column(String(50), default="pending")   # pending, running, completed, failed
    title = Column(String(500))
    # YouTube specific
    niche = Column(String(255))
    language = Column(String(50))
    script = Column(Text)
    topic = Column(Text)
    video_path = Column(String(1000))
    video_url = Column(String(1000))
    thumbnail_url = Column(String(1000))
    youtube_url = Column(String(500))
    metadata_json = Column(JSON)
    # Twitter specific
    tweet_content = Column(Text)
    twitter_account_id = Column(String(255))
    # AFM specific
    affiliate_link = Column(String(1000))
    pitch = Column(Text)
    # General
    error_message = Column(Text)
    logs = Column(Text, default="")
    duration = Column(Float)
    file_size = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))

    owner = relationship("User", back_populates="tasks")
