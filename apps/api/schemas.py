from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "student"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Level Schemas
class LevelBase(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    game_type: Optional[str] = "catch"
    data: dict

class LevelCreate(LevelBase):
    pass

class Level(LevelBase):
    id: int
    creator_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Game Attempt Schemas
class GameAttemptCreate(BaseModel):
    level_id: int
    score: int

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
