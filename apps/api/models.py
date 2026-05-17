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
    levels = relationship("Level", back_populates="creator", foreign_keys="Level.creator_id")
    badges = relationship("UserBadge", back_populates="user")
    
    # New relationships
    classrooms = relationship("Classroom", back_populates="teacher")
    memberships = relationship("ClassroomMembership", back_populates="student")
    activity_logs = relationship("StudentActivityLog", back_populates="student", foreign_keys="StudentActivityLog.student_id")
    feedbacks = relationship("TeacherFeedback", back_populates="student", foreign_keys="TeacherFeedback.student_id")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    grade_level = Column(String, nullable=True)
    school_name = Column(String, nullable=True)
    access_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", back_populates="classrooms")
    members = relationship("ClassroomMembership", back_populates="classroom", cascade="all, delete-orphan")

class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom", back_populates="members")
    student = relationship("User", back_populates="memberships")

class StudentActivityLog(Base):
    __tablename__ = "student_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    activity_type = Column(String) # e.g., register, create_game, update_game, play_game, score_reached, asset_upload, feedback_received
    entity_type = Column(String, nullable=True) # e.g., level, attempt, user, asset
    entity_id = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True) # Renamed from metadata to avoid conflict with Base.metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="activity_logs", foreign_keys=[student_id])

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
    status = Column(String, default="draft") # draft, review, approved, rejected, removed
    
    # Moderation fields
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    moderation_note = Column(String, nullable=True)
    removed_reason = Column(String, nullable=True)

    data = Column(JSON) # Now stores a GameProject structure with multiple levels
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    creator = relationship("User", back_populates="levels", foreign_keys=[creator_id])
    attempts = relationship("GameAttempt", back_populates="level", cascade="all, delete-orphan")
    feedbacks = relationship("TeacherFeedback", back_populates="level", cascade="all, delete-orphan")

class TeacherFeedback(Base):
    __tablename__ = "teacher_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    feedback_text = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    level = relationship("Level", back_populates="feedbacks")
    teacher = relationship("User", foreign_keys=[teacher_id])
    student = relationship("User", back_populates="feedbacks", foreign_keys=[student_id])

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

class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # background, music, sound, font, spritesheet, effect
    url = Column(String)
    thumbnail_url = Column(String, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User")

    @property
    def creator_role(self):
        return self.creator.role if self.creator else None
