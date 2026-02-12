
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models

def test_import():
    db = SessionLocal()
    try:
        # Create a test vendor
        vendor = db.query(models.Vendor).filter(models.Vendor.name == "Test Vendor").first()
        if not vendor:
            vendor = models.Vendor(name="Test Vendor", owner_id=1)
            db.add(vendor)
            db.flush()
        
        # Create a test trophy
        trophy = db.query(models.Trophy).filter(models.Trophy.sku == "TEST-SKU").first()
        if not trophy:
            trophy = models.Trophy(name="Test Trophy", sku="TEST-SKU", owner_id=1)
            db.add(trophy)
            db.flush()
            
        # Create a purchase
        purchase = models.Purchase(
            owner_id=1,
            vendor_id=vendor.id,
            total_amount=0.0,
            content_hash="test-hash-" + str(os.urandom(4).hex())
        )
        db.add(purchase)
        db.flush()
        print(f"Created purchase id: {purchase.id}")
        
        # Add an item
        p_item = models.PurchaseItem(
            purchase_id=purchase.id,
            trophy_id=trophy.id,
            quantity=5,
            unit_cost=100.0
        )
        db.add(p_item)
        purchase.total_amount = 500.0
        
        db.commit()
        print("Committed successfully")
        
        # Verify
        count = db.query(models.PurchaseItem).filter(models.PurchaseItem.purchase_id == purchase.id).count()
        print(f"Purchase items found: {count}")
        
        if count == 0:
            print("FAILURE: Item was NOT saved!")
        else:
            print("SUCCESS: Item was saved.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_import()
