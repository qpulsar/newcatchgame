import os
import sys
from dotenv import load_dotenv

# Mevcut dizini path'e ekle (modülleri içe aktarabilmek için)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models, auth, database

def create_admin(email, password, full_name="Sistem Yöneticisi"):
    # .env dosyasını yükle
    load_dotenv()
    
    db = database.SessionLocal()
    try:
        # Kullanıcı var mı kontrol et
        db_user = db.query(models.User).filter(models.User.email == email).first()
        
        if db_user:
            print(f"Bilgi: {email} adresi zaten kayıtlı.")
            # Rolü admin olarak güncelle
            db_user.role = "admin"
            db.commit()
            print("Sonuç: Mevcut kullanıcının rolü 'admin' olarak güncellendi.")
            return

        # Yeni admin oluştur
        hashed_password = auth.get_password_hash(password)
        new_user = models.User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role="admin"
        )
        db.add(new_user)
        db.commit()
        print(f"Başarılı: Admin kullanıcısı ({email}) başarıyla oluşturuldu!")
        
    except Exception as e:
        print(f"Hata oluştu: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Kullanım: python create_admin.py <email> <sifre>")
    else:
        create_admin(sys.argv[1], sys.argv[2])
