#!/bin/bash

# Renk tanımlamaları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arka plan işlemlerini temizleme fonksiyonu
cleanup() {
    echo -e "\n${BLUE}Sunucular durduruluyor...${NC}"
    kill $(jobs -p)
    exit
}

# Script durdurulduğunda (Ctrl+C) temizlik yap
trap cleanup SIGINT SIGTERM EXIT

echo -e "${GREEN}EduGame Studio başlatılıyor...${NC}"

# 1. Backend Başlatma
echo -e "${BLUE}Backend (FastAPI) başlatılıyor...${NC}"
cd apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
cd ../..

# 2. Frontend Başlatma
echo -e "${BLUE}Frontend (Vite + React) başlatılıyor...${NC}"
cd apps/web-game
npm run dev -- --port 5173 &
cd ../..

echo -e "${GREEN}------------------------------------------${NC}"
echo -e "${GREEN}Sistem Hazır!${NC}"
echo -e "Backend: ${BLUE}http://localhost:8000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "${GREEN}------------------------------------------${NC}"
echo -e "Durdurmak için Ctrl+C tuşlarına basın."

# Script'in açık kalmasını sağla
wait
