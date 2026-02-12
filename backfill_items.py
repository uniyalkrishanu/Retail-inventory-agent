
import sys
import os
import random
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import SessionLocal
import models

def backfill_items():
    db = SessionLocal()
    try:
        # Get all trophies grouped by owner
        trophies_by_owner = {}
        all_trophies = db.query(models.Trophy).all()
        for t in all_trophies:
            if t.owner_id not in trophies_by_owner:
                trophies_by_owner[t.owner_id] = []
            trophies_by_owner[t.owner_id].append(t)
            
        # Get all purchases with 0 items
        purchases = db.query(models.Purchase).all()
        backfilled_count = 0
        
        for p in purchases:
            # Check if it has items
            item_count = db.query(models.PurchaseItem).filter(models.PurchaseItem.purchase_id == p.id).count()
            if item_count == 0:
                # Add some items
                owner_trophies = trophies_by_owner.get(p.owner_id, [])
                if not owner_trophies:
                    # Fallback to any trophies if owner has none
                    owner_trophies = all_trophies
                
                if owner_trophies:
                    # Pick 1-3 random trophies
                    num_items = random.randint(1, 3)
                    selectedTrophies = random.sample(owner_trophies, min(num_items, len(owner_trophies)))
                    
                    p_total = 0
                    for t in selectedTrophies:
                        qty = random.randint(5, 50)
                        cost = t.cost_price or random.randint(100, 1000)
                        
                        item = models.PurchaseItem(
                            purchase_id=p.id,
                            trophy_id=t.id,
                            quantity=qty,
                            unit_cost=float(cost)
                        )
                        db.add(item)
                        p_total += (qty * cost)
                    
                    # Update purchase total to match items for consistency
                    p.total_amount = float(p_total)
                    backfilled_count += 1
        
        db.commit()
        print(f"Successfully backfilled items for {backfilled_count} purchases.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_items()
