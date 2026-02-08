import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models
from services.auth_service import auth_service

def debug_auth():
    db = SessionLocal()
    try:
        password_to_check = "root123"
        user = db.query(models.User).filter(models.User.username == "root").first()
        
        if not user:
            print("User 'root' not found in database.")
            return

        print(f"User: {user.username}")
        print(f"Stored Hash: {user.hashed_password}")
        
        # Test verification
        try:
            is_valid = auth_service.verify_password(password_to_check, user.hashed_password)
            print(f"Verification of '{password_to_check}': {is_valid}")
        except Exception as ve:
            print(f"Verification Error: {ve}")
            
        # Test re-hashing
        new_hash = auth_service.get_password_hash(password_to_check)
        print(f"New Hash generated now: {new_hash}")
        
        is_valid_new = auth_service.verify_password(password_to_check, new_hash)
        print(f"Verification of fresh hash: {is_valid_new}")

    finally:
        db.close()

if __name__ == "__main__":
    debug_auth()
