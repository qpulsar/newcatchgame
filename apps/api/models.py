from sqlalchemy import Column, Integer, String, Enum, ForeignKey, JSON, DateTime, Float
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default=UserRole.STUDENT)
    
    attempts = relationship("GameAttempt", back_populates="user")
    levels = relationship("Level", back_populates="creator")
    badges = relationship("UserBadge", back_populates="user")

class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    thumbnail_url = Column(String, nullable=True)
    game_type = Column(String, default="catch") # e.g., catch, sort, quiz
    
    # Project Metadata
    course = Column(String, nullable=True)
    grade_level = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    language = Column(String, default="tr")
    visibility = Column(String, default="public") # public, private, school, class
    status = Column(String, default="draft") # draft, review, published, archived
    
    data = Column(JSON) # Now stores a GameProject structure with multiple levels
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    creator = relationship("User", back_populates="levels")
    attempts = relationship("GameAttempt", back_populates="level")

class GameAttempt(Base):
    __tablename__ = "game_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    level_id = Column(Integer, ForeignKey("levels.id"))
    score = Column(Integer)
    accuracy = Column(Float, nullable=True)
    duration = Column(Integer, nullable=True) # in seconds
    details = Column(JSON, nullable=True) # Level-based results, errors
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="attempts")
    level = relationship("Level", back_populates="attempts")

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    icon_url = Column(String)

class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")
