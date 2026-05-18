from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "student"

class UserCreate(UserBase):
    password: str

class UserSelfUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None

# Level Schemas
class LevelBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    game_type: Optional[str] = "catch"
    course: Optional[str] = None
    grade_level: Optional[str] = None
    topic: Optional[str] = None
    language: Optional[str] = "tr"
    visibility: Optional[str] = "public"
    status: Optional[str] = "draft"
    moderation_note: Optional[str] = None
    removed_reason: Optional[str] = None
    data: dict

class LevelCreate(LevelBase):
    pass

class Level(LevelBase):
    id: int
    creator_id: int
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Classroom Schemas
class ClassroomBase(BaseModel):
    name: str
    grade_level: Optional[str] = None
    school_name: Optional[str] = None

class ClassroomCreate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int
    teacher_id: int
    access_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClassroomMembershipBase(BaseModel):
    classroom_id: int
    student_id: int

class ClassroomMembership(ClassroomMembershipBase):
    id: int
    joined_at: datetime

    class Config:
        from_attributes = True

# Activity Log Schemas
class StudentActivityLogBase(BaseModel):
    student_id: int
    classroom_id: Optional[int] = None
    teacher_id: Optional[int] = None
    activity_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    metadata_json: Optional[dict] = None

class StudentActivityLog(StudentActivityLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Feedback Schemas
class TeacherFeedbackBase(BaseModel):
    level_id: int
    student_id: int
    feedback_text: str

class TeacherFeedbackCreate(TeacherFeedbackBase):
    pass

class TeacherFeedback(TeacherFeedbackBase):
    id: int
    teacher_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Summary
class TeacherDashboardSummary(BaseModel):
    student_count: int
    classroom_count: int
    pending_review_count: int
    recent_activities: List[StudentActivityLog]
    top_student_games: List[Level]
    low_performance_signals: List[dict]
    student_growth_percentage: float = 0.0

# Game Attempt Schemas
class GameAttemptCreate(BaseModel):
    level_id: int
    score: int
    accuracy: Optional[float] = None
    duration: Optional[int] = None
    details: Optional[dict] = None

class GameAttempt(GameAttemptCreate):
    id: int
    user_id: int
    completed_at: datetime

    class Config:
        from_attributes = True

# Badge Schemas
class BadgeBase(BaseModel):
    name: str
    description: str
    icon_url: Optional[str] = None

class Badge(BadgeBase):
    id: int

    class Config:
        from_attributes = True

# Asset Schemas
class AssetBase(BaseModel):
    name: str
    type: str
    url: str
    thumbnail_url: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class Asset(AssetBase):
    id: int
    creator_id: int
    creator_role: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    totalScore: int
    gamesPlayed: int
    levelsCreated: int

class UserAttemptResponse(BaseModel):
    id: int
    level_title: str
    score: int
    date: str
