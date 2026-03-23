from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    topic = Column(Text)
    script = Column(Text)
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    video_url = Column(String(1000))
    thumbnail_url = Column(String(1000))
    duration = Column(Float)
    file_size = Column(Integer)
    language = Column(String(10), default="fr")
    voice_type = Column(String(100), default="edge-tts")
    voice_name = Column(String(100), default="fr-FR-DeniseNeural")
    video_style = Column(String(100), default="motivational")
    music_type = Column(String(100), default="upbeat")
    resolution = Column(String(20), default="1080x1920")  # portrait for shorts
    is_public = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    downloads = Column(Integer, default=0)
    error_message = Column(Text)
    generation_params = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))

    owner = relationship("User", back_populates="videos")
