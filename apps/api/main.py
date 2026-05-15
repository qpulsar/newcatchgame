from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import List, Optional
import shutil
import os
import uuid
import logging

import models, schemas, auth, database
from dotenv import load_dotenv

load_dotenv()

# Loglama yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=database.engine)

# Dosya yükleme dizini oluştur
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="EduGame Studio API")

# Statik dosyaları dışarı aç
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Başlangıç rozetlerini ekle
def seed_badges():
    db = database.SessionLocal()
    try:
        badges = [
            {"name": "İlk Adım", "description": "İlk oyun denemeni tamamladın!"},
            {"name": "Usta Yakalayıcı", "description": "Tek seferde 500 puana ulaştın!"},
            {"name": "Mükemmeliyetçi", "description": "Bir seviyeyi hiç hata yapmadan bitirdin!"},
            {"name": "Yaratıcı Deha", "description": "Kendi seviyeni oluşturdun!"}
        ]
        for b_data in badges:
            exists = db.query(models.Badge).filter(models.Badge.name == b_data["name"]).first()
            if not exists:
                new_badge = models.Badge(**b_data)
                db.add(new_badge)
        db.commit()
    finally:
        db.close()

# Başlangıç kullanıcılarını ekle
def seed_users():
    db = database.SessionLocal()
    try:
        admin_email = "admin@edugame.com"
        exists = db.query(models.User).filter(models.User.email == admin_email).first()
        if not exists:
            hashed_password = auth.get_password_hash("admin123")
            new_user = models.User(
                email=admin_email,
                full_name="Sistem Yöneticisi",
                hashed_password=hashed_password,
                role="admin"
            )
            db.add(new_user)
            db.commit()
    finally:
        db.close()

seed_badges()
seed_users()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://edugame.korkusuz.gen.tr",
    "http://edugame.korkusuz.gen.tr",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "EduGame API is running"}

@app.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
    
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except auth.JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

# --- User Management (Admin) ---

@app.get("/users", response_model=List[schemas.User])
def list_users(
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    return db.query(models.User).all()

@app.post("/users", response_model=schemas.User)
def admin_create_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put("/users/{user_id}", response_model=schemas.User)
def admin_update_user(
    user_id: int,
    user_update: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.email = user_update.email
    db_user.full_name = user_update.full_name
    db_user.role = user_update.role
    if user_update.password:
        db_user.hashed_password = auth.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

# --- Level Endpoints ---

@app.post("/levels", response_model=schemas.Level)
def create_level(
    level: schemas.LevelCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_level = models.Level(
        title=level.title,
        description=level.description,
        thumbnail_url=level.thumbnail_url,
        game_type=level.game_type,
        course=level.course,
        grade_level=level.grade_level,
        topic=level.topic,
        language=level.language,
        visibility=level.visibility,
        status=level.status,
        data=level.data,
        creator_id=current_user.id
    )
    db.add(db_level)
    db.commit()
    db.refresh(db_level)
    return db_level

@app.get("/levels", response_model=List[schemas.Level])
def list_levels(db: Session = Depends(database.get_db)):
    try:
        levels = db.query(models.Level).all()
        return levels
    except Exception as e:
        logger.error(f"Error listing levels: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/levels/{level_id}", response_model=schemas.Level)
def get_level(level_id: int, db: Session = Depends(database.get_db)):
    level = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level

@app.put("/levels/{level_id}", response_model=schemas.Level)
def update_level(
    level_id: int, 
    level_update: schemas.LevelCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_level = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not db_level:
        raise HTTPException(status_code=404, detail="Level not found")
    if db_level.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this level")
    
    db_level.title = level_update.title
    db_level.description = level_update.description
    db_level.thumbnail_url = level_update.thumbnail_url
    db_level.game_type = level_update.game_type
    db_level.course = level_update.course
    db_level.grade_level = level_update.grade_level
    db_level.topic = level_update.topic
    db_level.language = level_update.language
    db_level.visibility = level_update.visibility
    db_level.status = level_update.status
    db_level.data = level_update.data
    
    db.commit()
    db.refresh(db_level)
    return db_level

@app.delete("/levels/{level_id}")
def delete_level(
    level_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_level = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not db_level:
        raise HTTPException(status_code=404, detail="Level not found")
    if db_level.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this level")
    
    db.delete(db_level)
    db.commit()
    return {"message": "Level deleted successfully"}

# --- Attempt Endpoints ---

@app.post("/attempts", response_model=schemas.GameAttempt)
def create_attempt(
    attempt: schemas.GameAttemptCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_attempt = models.GameAttempt(
        user_id=current_user.id,
        level_id=attempt.level_id,
        score=attempt.score,
        accuracy=attempt.accuracy,
        duration=attempt.duration,
        details=attempt.details
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    # --- Rozet Kontrolü ---
    earned_badges = []
    
    # 1. İlk Adım (Herhangi bir oyun tamamlama)
    badge_first = db.query(models.Badge).filter(models.Badge.name == "İlk Adım").first()
    if badge_first:
        has_badge = db.query(models.UserBadge).filter(
            models.UserBadge.user_id == current_user.id,
            models.UserBadge.badge_id == badge_first.id
        ).first()
        if not has_badge:
            db.add(models.UserBadge(user_id=current_user.id, badge_id=badge_first.id))
            earned_badges.append(badge_first.name)

    # 2. Usta Yakalayıcı (Skor >= 500)
    if attempt.score >= 500:
        badge_pro = db.query(models.Badge).filter(models.Badge.name == "Usta Yakalayıcı").first()
        if badge_pro:
            has_badge = db.query(models.UserBadge).filter(
                models.UserBadge.user_id == current_user.id,
                models.UserBadge.badge_id == badge_pro.id
            ).first()
            if not has_badge:
                db.add(models.UserBadge(user_id=current_user.id, badge_id=badge_pro.id))
                earned_badges.append(badge_pro.name)
    
    db.commit()
    return db_attempt

@app.get("/leaderboard/{level_id}")
def get_leaderboard(level_id: int, db: Session = Depends(database.get_db)):
    # En yüksek 10 skoru getir
    results = db.query(models.GameAttempt, models.User.full_name)\
        .join(models.User)\
        .filter(models.GameAttempt.level_id == level_id)\
        .order_by(models.GameAttempt.score.desc())\
        .limit(10)\
        .all()
    
    return [
        {"full_name": name, "score": attempt.score, "date": attempt.completed_at}
        for attempt, name in results
    ]
# --- Badge Endpoints ---

@app.get("/badges", response_model=List[schemas.Badge])
def list_badges(db: Session = Depends(database.get_db)):
    return db.query(models.Badge).all()

@app.get("/users/me/badges")
def get_my_badges(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = db.query(models.Badge)\
        .join(models.UserBadge)\
        .filter(models.UserBadge.user_id == current_user.id)\
        .all()
    return results

# --- Asset Endpoints ---

@app.get("/assets", response_model=List[schemas.Asset])
def list_assets(
    asset_type: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Asset)
    if asset_type:
        query = query.filter(models.Asset.type == asset_type)
    return query.all()

@app.post("/assets/upload", response_model=schemas.Asset)
async def upload_asset(
    name: str = Form(...),
    type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Benzersiz dosya adı oluştur
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Dosyayı kaydet
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Veritabanına kaydet
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    asset_url = f"{base_url}/uploads/{unique_filename}"
    db_asset = models.Asset(
        name=name,
        type=type,
        url=asset_url,
        creator_id=current_user.id
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if db_asset.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Dosyayı sil
    filename = db_asset.url.split("/")[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
