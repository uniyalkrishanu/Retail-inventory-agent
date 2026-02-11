from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def check_root_data():
    db = SessionLocal()
    try:
        root = db.query(models.User).filter(models.User.username == "root").first()
        if not root:
            print("Root user not found!")
            return

        print(f"Root User ID: {root.id}")
        
        counts = {
            "Trophies": db.query(models.Trophy).filter(models.Trophy.owner_id == root.id).count(),
            "Customers": db.query(models.Customer).filter(models.Customer.owner_id == root.id).count(),
            "Sales": db.query(models.Sale).filter(models.Sale.owner_id == root.id).count(),
            "Vendors": db.query(models.Vendor).filter(models.Vendor.owner_id == root.id).count(),
            "Purchases": db.query(models.Purchase).filter(models.Purchase.owner_id == root.id).count(),
        }
        
        print("--- Root Data Counts ---")
        for model, count in counts.items():
            print(f"{model}: {count}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_root_data()
