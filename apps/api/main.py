from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text, func
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

def ensure_legacy_schema_columns():
    engine = database.engine
    inspector = inspect(engine)

    if "levels" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("levels")}
    missing_level_columns = {
        "course": "VARCHAR",
        "grade_level": "VARCHAR",
        "topic": "VARCHAR",
        "language": "VARCHAR DEFAULT 'tr'",
        "visibility": "VARCHAR DEFAULT 'public'",
        "status": "VARCHAR DEFAULT 'draft'",
        "reviewed_by": "INTEGER",
        "reviewed_at": "TIMESTAMP",
        "moderation_note": "VARCHAR",
        "removed_reason": "VARCHAR",
    }

    with engine.begin() as connection:
        for column_name, column_definition in missing_level_columns.items():
            if column_name in existing_columns:
                continue
            connection.execute(
                text(f"ALTER TABLE levels ADD COLUMN {column_name} {column_definition}")
            )
            logger.info("Added missing legacy column '%s' to levels table.", column_name)

ensure_legacy_schema_columns()

# Dosya yükleme dizini oluştur
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(title="EduGame Studio API")

# Statik dosyaları API endpoint'i olarak aç (CORS başlıklarının otomatik eklenmesi ve preflight OPTIONS desteği için)
from fastapi.responses import FileResponse
from fastapi import Request, Response

UPLOAD_CORS_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://edugame.korkusuz.gen.tr",
    "http://edugame.korkusuz.gen.tr",
}

def get_upload_cors_headers(request: Request):
    origin = request.headers.get("origin")
    headers = {
        "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
        "Access-Control-Allow-Headers": "*",
        "Vary": "Origin",
    }

    if origin and origin in UPLOAD_CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return headers

@app.api_route("/uploads/{filename}", methods=["GET", "OPTIONS"])
def get_upload_file(filename: str, request: Request, response: Response):
    cors_headers = get_upload_cors_headers(request)
    
    # Preflight OPTIONS isteği ise doğrudan 200 OK dön
    if request.method == "OPTIONS":
        return Response(status_code=200, headers=cors_headers)
        
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    return FileResponse(file_path, headers=cors_headers)

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
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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
    
    # Log registration
    log_activity(db, new_user.id, "register", "user", new_user.id, {"email": new_user.email})
    
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
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@app.get("/auth/test-token/{role}")
def get_test_token(role: str, db: Session = Depends(database.get_db)):
    # This is for testing only!
    test_email = f"test_{role}@edugame.com"
    user = db.query(models.User).filter(models.User.email == test_email).first()
    
    if not user:
        hashed_password = auth.get_password_hash("test123")
        user = models.User(
            email=test_email,
            full_name=f"Test {role.capitalize()}",
            hashed_password=hashed_password,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
    
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

def get_current_teacher(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher or Admin access required")
    return current_user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_current_user(
    user_update: schemas.UserSelfUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.email and user_update.email != current_user.email:
        exists = db.query(models.User).filter(models.User.email == user_update.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_score = db.query(func.sum(models.GameAttempt.score))\
        .filter(models.GameAttempt.user_id == current_user.id).scalar() or 0
    games_played = db.query(models.GameAttempt)\
        .filter(models.GameAttempt.user_id == current_user.id).count()
    levels_created = db.query(models.Level)\
        .filter(models.Level.creator_id == current_user.id).count()
    
    return {
        "totalScore": total_score,
        "gamesPlayed": games_played,
        "levelsCreated": levels_created
    }

@app.get("/users/me/attempts", response_model=List[schemas.UserAttemptResponse])
def get_my_attempts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = db.query(models.GameAttempt, models.Level.title)\
        .join(models.Level, models.GameAttempt.level_id == models.Level.id)\
        .filter(models.GameAttempt.user_id == current_user.id)\
        .order_by(models.GameAttempt.completed_at.desc())\
        .limit(10)\
        .all()
    
    return [
        {
            "id": attempt.id,
            "level_title": title,
            "score": attempt.score,
            "date": attempt.completed_at.strftime("%Y-%m-%d")
        }
        for attempt, title in results
    ]

def log_activity(
    db: Session,
    student_id: int,
    activity_type: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    metadata: Optional[dict] = None,
    classroom_id: Optional[int] = None,
    teacher_id: Optional[int] = None
):
    try:
        new_log = models.StudentActivityLog(
            student_id=student_id,
            activity_type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata,
            classroom_id=classroom_id,
            teacher_id=teacher_id
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        logger.error(f"Error logging activity: {e}")
        db.rollback()

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
    
    # Log game creation
    log_activity(db, current_user.id, "create_game", "level", db_level.id, {"title": db_level.title})
    
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
    
    # Log game update
    log_activity(db, current_user.id, "update_game", "level", db_level.id, {"title": db_level.title, "status": db_level.status})
    
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
    
    # Log game deletion
    log_activity(db, current_user.id, "delete_game", "level", level_id, {"title": db_level.title})
    
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
    
    # Log game play
    log_activity(db, current_user.id, "play_game", "level", attempt.level_id, {
        "score": attempt.score,
        "accuracy": attempt.accuracy,
        "duration": attempt.duration
    })
    
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
    
    # Log asset upload
    log_activity(db, current_user.id, "asset_upload", "asset", db_asset.id, {"name": name, "type": type})
    
    return db_asset

@app.post("/assets/bulk-upload", response_model=List[schemas.Asset])
async def bulk_upload_assets(
    files: List[UploadFile] = File(...),
    type: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlemi sadece yöneticiler (admin) gerçekleştirebilir."
        )
    
    uploaded_assets = []
    base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
    
    for file in files:
        # Dosya uzantısını al
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        # Tip belirleme (Otomatik veya seçilen tip)
        asset_type = type
        if not asset_type or asset_type == "auto":
            if file_extension in [".mp3", ".wav", ".ogg", ".aac", ".m4a"]:
                asset_type = "sound"
            elif file_extension in [".ttf", ".otf", ".woff", ".woff2"]:
                asset_type = "font"
            else:
                asset_type = "background" # Varsayılan olarak görsel/arka plan
        
        # Benzersiz dosya adı oluştur
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Dosyayı kaydet
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Varlık ismi (dosya adından türet)
        raw_name = os.path.splitext(file.filename)[0]
        # Temiz ve düzgün bir isim formatı yap (örn. "uzay-arkaplan" -> "Uzay Arkaplan")
        display_name = raw_name.replace("-", " ").replace("_", " ").title()
        
        asset_url = f"{base_url}/uploads/{unique_filename}"
        
        db_asset = models.Asset(
            name=display_name,
            type=asset_type,
            url=asset_url,
            creator_id=current_user.id
        )
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        
        # Aktivite günlüğü
        log_activity(db, current_user.id, "asset_upload", "asset", db_asset.id, {"name": display_name, "type": asset_type})
        uploaded_assets.append(db_asset)
        
    return uploaded_assets

@app.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    creator = db.query(models.User).filter(models.User.id == db_asset.creator_id).first()
    creator_role = creator.role if creator else None
    
    # Rule 1: adminin eklediği asset'leri öğretmen ve öğrenci silememeli.
    if creator_role == "admin" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin tarafından eklenen varlıklar öğretmenler veya öğrenciler tarafından silinemez"
        )
        
    # Rule 2: Öğrenci öğretmeninin eklediği assetleri silememeli.
    if creator_role == "teacher" and current_user.role == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Öğretmen tarafından eklenen varlıklar öğrenciler tarafından silinemez"
        )
        
    # Rule 3: Öğrenci sadece kendi eklediklerini silebilmeli.
    if current_user.role == "student" and db_asset.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Öğrenciler sadece kendi ekledikleri varlıkları silebilir"
        )

    # General authorization check: user must be either the creator or an admin
    if db_asset.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu varlığı silme yetkiniz yok"
        )
    
    # Dosyayı sil
    filename = db_asset.url.split("/")[-1]
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}

# --- Teacher Panel Endpoints ---

@app.post("/classrooms", response_model=schemas.Classroom)
def create_classroom(
    classroom: schemas.ClassroomCreate,
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    access_code = str(uuid.uuid4())[:8].upper()
    db_classroom = models.Classroom(
        name=classroom.name,
        grade_level=classroom.grade_level,
        school_name=classroom.school_name,
        teacher_id=current_teacher.id,
        access_code=access_code
    )
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@app.put("/classrooms/{classroom_id}", response_model=schemas.Classroom)
def update_classroom(
    classroom_id: int,
    classroom_update: schemas.ClassroomCreate,
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    db_classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not db_classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if db_classroom.teacher_id != current_teacher.id and current_teacher.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_classroom.name = classroom_update.name
    db_classroom.grade_level = classroom_update.grade_level
    db_classroom.school_name = classroom_update.school_name
    
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@app.delete("/classrooms/{classroom_id}")
def delete_classroom(
    classroom_id: int,
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    db_classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not db_classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if db_classroom.teacher_id != current_teacher.id and current_teacher.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(db_classroom)
    db.commit()
    return {"message": "Classroom deleted successfully"}

@app.delete("/classrooms/{classroom_id}/students/{student_id}")
def remove_student_from_classroom(
    classroom_id: int,
    student_id: int,
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    db_classroom = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not db_classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if db_classroom.teacher_id != current_teacher.id and current_teacher.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    membership = db.query(models.ClassroomMembership).filter(
        models.ClassroomMembership.classroom_id == classroom_id,
        models.ClassroomMembership.student_id == student_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Student not found in this classroom")
        
    db.delete(membership)
    db.commit()
    
    # Log removal
    log_activity(db, student_id, "removed_from_classroom", "classroom", classroom_id, {"teacher_id": current_teacher.id})
    
    return {"message": "Student removed from classroom"}

@app.get("/classrooms", response_model=List[schemas.Classroom])
def list_classrooms(
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    if current_teacher.role == "admin":
        return db.query(models.Classroom).all()
    return db.query(models.Classroom).filter(models.Classroom.teacher_id == current_teacher.id).all()

@app.post("/classrooms/join")
def join_classroom(
    access_code: str = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    classroom = db.query(models.Classroom).filter(models.Classroom.access_code == access_code).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if already a member
    exists = db.query(models.ClassroomMembership).filter(
        models.ClassroomMembership.classroom_id == classroom.id,
        models.ClassroomMembership.student_id == current_user.id
    ).first()
    
    if exists:
        return {"message": "Already a member"}
    
    membership = models.ClassroomMembership(classroom_id=classroom.id, student_id=current_user.id)
    db.add(membership)
    db.commit()
    
    # Log joining classroom
    log_activity(db, current_user.id, "join_classroom", "classroom", classroom.id, {"classroom_name": classroom.name})
    
    return {"message": "Successfully joined classroom"}

@app.get("/teacher/students", response_model=List[schemas.User])
def list_teacher_students(
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    # Get students in teacher's classes
    students = db.query(models.User).join(models.ClassroomMembership).join(models.Classroom)\
        .filter(models.Classroom.teacher_id == current_teacher.id).all()
    return students

@app.get("/teacher/dashboard", response_model=schemas.TeacherDashboardSummary)
def get_teacher_dashboard(
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    # Classroom & Student Counts
    classrooms = db.query(models.Classroom).filter(models.Classroom.teacher_id == current_teacher.id).all()
    classroom_ids = [c.id for c in classrooms]
    student_count = db.query(models.User).join(models.ClassroomMembership)\
        .filter(models.ClassroomMembership.classroom_id.in_(classroom_ids)).count() if classroom_ids else 0
    
    # Pending Reviews
    pending_count = db.query(models.Level).join(models.User, models.Level.creator_id == models.User.id)\
        .join(models.ClassroomMembership, models.User.id == models.ClassroomMembership.student_id)\
        .filter(models.ClassroomMembership.classroom_id.in_(classroom_ids))\
        .filter(models.Level.status == "review").count() if classroom_ids else 0
    
    # Recent Activities
    recent_logs = db.query(models.StudentActivityLog)\
        .filter(models.StudentActivityLog.student_id.in_(
            db.query(models.ClassroomMembership.student_id).filter(models.ClassroomMembership.classroom_id.in_(classroom_ids))
        ))\
        .order_by(models.StudentActivityLog.created_at.desc())\
        .limit(10).all() if classroom_ids else []
        
    # Top Games
    top_games = db.query(models.Level).join(models.User, models.Level.creator_id == models.User.id)\
        .join(models.ClassroomMembership, models.User.id == models.ClassroomMembership.student_id)\
        .filter(models.ClassroomMembership.classroom_id.in_(classroom_ids))\
        .limit(5).all() if classroom_ids else []
        
    # Low Performance (accuracy < 60% in last 3 attempts)
    low_perf = []
    if classroom_ids:
        # Get students in these classrooms
        student_ids = db.query(models.ClassroomMembership.student_id).filter(models.ClassroomMembership.classroom_id.in_(classroom_ids)).all()
        student_ids = [s[0] for s in student_ids]
        
        for sid in student_ids:
            attempts = db.query(models.GameAttempt).filter(models.GameAttempt.user_id == sid).order_by(models.GameAttempt.completed_at.desc()).limit(3).all()
            if len(attempts) >= 2:
                avg_accuracy = sum([a.accuracy for a in attempts if a.accuracy is not None]) / len(attempts)
                if avg_accuracy < 0.6:
                    student = db.query(models.User).filter(models.User.id == sid).first()
                    low_perf.append({
                        "student_id": sid,
                        "student_name": student.full_name,
                        "reason": f"Düşük Doğruluk Oranı (%{int(avg_accuracy * 100)})",
                        "severity": "high" if avg_accuracy < 0.4 else "medium"
                    })

    # Student Growth (last 30 days)
    growth_pct = 0.0
    if classroom_ids:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_students = db.query(models.ClassroomMembership)\
            .filter(models.ClassroomMembership.classroom_id.in_(classroom_ids))\
            .filter(models.ClassroomMembership.joined_at >= thirty_days_ago).count()
        
        old_students = student_count - new_students
        if old_students > 0:
            growth_pct = (new_students / old_students) * 100
        elif new_students > 0:
            growth_pct = 100.0
            
    return {
        "student_count": student_count,
        "classroom_count": len(classrooms),
        "pending_review_count": pending_count,
        "recent_activities": recent_logs,
        "top_student_games": top_games,
        "low_performance_signals": low_perf,
        "student_growth_percentage": round(growth_pct, 1)
    }

@app.post("/teacher/moderate/{level_id}")
def moderate_level(
    level_id: int,
    status: str = Form(...),
    note: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    level = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    
    # Check if level belongs to a student of this teacher
    is_authorized = False
    if current_teacher.role == "admin":
        is_authorized = True
    else:
        membership = db.query(models.ClassroomMembership).join(models.Classroom)\
            .filter(models.Classroom.teacher_id == current_teacher.id)\
            .filter(models.ClassroomMembership.student_id == level.creator_id).first()
        if membership:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to moderate this level")
    
    level.status = status # draft, review, approved, rejected, removed
    level.moderation_note = note
    level.reviewed_by = current_teacher.id
    level.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    # Create notification/feedback entry
    feedback = models.TeacherFeedback(
        level_id=level.id,
        teacher_id=current_teacher.id,
        student_id=level.creator_id,
        feedback_text=f"Moderasyon durumu: {status}. Not: {note if note else 'Yok'}"
    )
    db.add(feedback)
    db.commit()
    
    # Log moderation activity
    log_activity(db, level.creator_id, f"level_{status}", "level", level.id, {"teacher_id": current_teacher.id, "note": note})
    
    return {"message": f"Level {status} successfully"}

@app.get("/teacher/activities", response_model=List[schemas.StudentActivityLog])
def list_student_activities(
    student_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_teacher: models.User = Depends(get_current_teacher)
):
    query = db.query(models.StudentActivityLog)
    
    # Security check: only show activities of teacher's students
    if current_teacher.role != "admin":
        teacher_student_ids = db.query(models.ClassroomMembership.student_id)\
            .join(models.Classroom)\
            .filter(models.Classroom.teacher_id == current_teacher.id)
        query = query.filter(models.StudentActivityLog.student_id.in_(teacher_student_ids))
        
    if student_id:
        query = query.filter(models.StudentActivityLog.student_id == student_id)
        
    return query.order_by(models.StudentActivityLog.created_at.desc()).all()
