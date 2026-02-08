import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from services.auth_service import auth_service
    print("Auth service imported successfully.")
    
    password = "root123"
    hashed = auth_service.get_password_hash(password)
    print(f"Hashed password: {hashed}")
    
    is_valid = auth_service.verify_password(password, hashed)
    print(f"Verification result: {is_valid}")
    
    if is_valid:
        print("[SUCCESS] Auth logic is working correctly.")
    else:
        print("[FAILURE] Auth logic verification failed.")

except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
