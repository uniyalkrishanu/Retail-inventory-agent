from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import models
import schemas # We might need to add Purchase schemas here if not present
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/purchases",
    tags=["purchases"],
)

# Response Schemas (Simple version for listing)
class PurchaseItemSchema(BaseModel):
    id: int
    trophy_name: str
    quantity: int
    unit_cost: float

    class Config:
        orm_mode = True

class PurchaseSchema(BaseModel):
    id: int
    timestamp: datetime
    vendor_name: str
    invoice_number: Optional[str] = None
    total_amount: float
    items_count: int
    items: List[PurchaseItemSchema]

    class Config:
        orm_mode = True

@router.get("/", response_model=List[PurchaseSchema])
def read_purchases(
    skip: int = 0, 
    limit: int = 100, 
    vendor_id: int = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Purchase).filter(models.Purchase.is_active == True)
    
    if vendor_id:
        query = query.filter(models.Purchase.vendor_id == vendor_id)

    purchases = query.order_by(models.Purchase.timestamp.desc()).offset(skip).limit(limit).all()
    
    result = []
    for p in purchases:
        items_data = []
        for item in p.items:
            items_data.append({
                "id": item.id,
                "trophy_name": item.trophy.name if item.trophy else "Unknown",
                "quantity": item.quantity,
                "unit_cost": item.unit_cost
            })

        result.append({
            "id": p.id,
            "timestamp": p.timestamp,
            "vendor_name": p.vendor.name if p.vendor else "Unknown",
            "invoice_number": p.invoice_number,
            "total_amount": p.total_amount,
            "items_count": len(p.items),
            "items": items_data
        })
    return result

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, revert_stock: bool = False, db: Session = Depends(database.get_db)):
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if revert_stock:
        # Revert Stock Logic
        for item in purchase.items:
            trophy = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id).first()
            if trophy:
                trophy.quantity -= item.quantity 
        purchase.stock_reverted = True
        print(f"Stock reverted for Purchase {purchase_id}")
    else:
        purchase.stock_reverted = False

    # Soft Delete
    purchase.is_active = False
    db.commit()
    return {"message": f"Purchase deleted. Stock reverted: {revert_stock}"}
