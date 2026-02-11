import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def verify_guest_data():
    db = SessionLocal()
    try:
        guest = db.query(models.User).filter(models.User.username == "guest").first()
        if not guest:
            print("Guest user not found!")
            return

        print(f"Guest User ID: {guest.id}")
        
        counts = {
            "Trophies": db.query(models.Trophy).filter(models.Trophy.owner_id == guest.id).count(),
            "Customers": db.query(models.Customer).filter(models.Customer.owner_id == guest.id).count(),
            "Sales": db.query(models.Sale).filter(models.Sale.owner_id == guest.id).count(),
            "Vendors": db.query(models.Vendor).filter(models.Vendor.owner_id == guest.id).count(),
            "Purchases": db.query(models.Purchase).filter(models.Purchase.owner_id == guest.id).count(),
        }
        
        print("\n--- Guest Data Counts ---")
        for model, count in counts.items():
            print(f"{model}: {count}")
        
        # Show sample SKUs to verify prefix
        sample_trophies = db.query(models.Trophy).filter(models.Trophy.owner_id == guest.id).limit(3).all()
        if sample_trophies:
            print("\n--- Sample Trophy SKUs ---")
            for trophy in sample_trophies:
                print(f"  {trophy.name}: {trophy.sku}")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify_guest_data()
