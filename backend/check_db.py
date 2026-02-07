from database import SessionLocal
import models

db = SessionLocal()
count = db.query(models.Purchase).count()
print(f"Total Purchases: {count}")
purchases = db.query(models.Purchase).all()
for p in purchases:
    print(f"ID: {p.id}, Vendor: {p.vendor_id}, Total: {p.total_amount}")
