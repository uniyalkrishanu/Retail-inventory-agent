from sqlalchemy.orm import Session
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models
from services.auth_service import auth_service

def reset_passwords():
    db = SessionLocal()
    try:
        users_to_reset = {
            "root": "root123",
            "natraj": "natraj123"
        }
        
        for username, password in users_to_reset.items():
            user = db.query(models.User).filter(models.User.username == username).first()
            if user:
                print(f"Resetting password for {username}...")
                user.hashed_password = auth_service.get_password_hash(password)
                db.commit()
                print(f"[SUCCESS] Password for {username} reset.")
            else:
                print(f"[WARNING] User {username} not found.")
                
    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_passwords()
