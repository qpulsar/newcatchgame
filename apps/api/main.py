from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

import models, schemas, auth, database

# Veritabanı tablolarını oluştur (Prototype için hızlı çözüm)
models.Base.metadata.create_all(bind=database.engine)

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

seed_badges()

app = FastAPI(title="EduGame Studio API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174", # Vite sometimes uses 5174
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
        data=level.data,
        creator_id=current_user.id
    )
    db.add(db_level)
    db.commit()
    db.refresh(db_level)
    return db_level

@app.get("/levels", response_model=List[schemas.Level])
def list_levels(db: Session = Depends(database.get_db)):
    return db.query(models.Level).all()

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
    db_level.data = level_update.data
    
    db.commit()
    db.refresh(db_level)
    return db_level

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
        score=attempt.score
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
