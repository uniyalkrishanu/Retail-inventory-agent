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
    vendor_id: int
    invoice_number: Optional[str] = None
    total_amount: float
    items_count: int
    payment_status: str
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
            "vendor_id": p.vendor_id,
            "invoice_number": p.invoice_number,
            "total_amount": p.total_amount,
            "items_count": len(p.items),
            "payment_status": p.payment_status or "Due",
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

@router.post("/{purchase_id}/pay")
def pay_purchase(purchase_id: int, amount: Optional[float] = None, db: Session = Depends(database.get_db)):
    """Mark a purchase as paid (fully or partially) and update vendor balance"""
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    if purchase.payment_status == "Paid":
        raise HTTPException(status_code=400, detail="Purchase is already fully paid")
    
    remaining_to_pay = purchase.total_amount - purchase.paid_amount
    
    # If amount is None, assume full payment of remaining
    payment_made = amount if amount is not None else remaining_to_pay
    
    if payment_made <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    if payment_made > remaining_to_pay + 0.01: # Small epsilon for float
        raise HTTPException(status_code=400, detail=f"Payment amount ₹{payment_made} exceeds remaining balance ₹{remaining_to_pay}")
    
    # Update paid amount
    purchase.paid_amount += payment_made
    
    # Update status
    if purchase.paid_amount >= purchase.total_amount - 0.01:
        purchase.payment_status = "Paid"
    else:
        purchase.payment_status = "Partially Paid"
    
    # Update vendor balance (we paid them, so our balance increases / debt decreases)
    vendor = db.query(models.Vendor).filter(models.Vendor.id == purchase.vendor_id).first()
    if vendor:
        vendor.current_balance += payment_made
    
    db.commit()
    
    return {
        "message": f"Payment of ₹{payment_made} registered for Purchase #{purchase_id}",
        "status": purchase.payment_status,
        "paid_amount": purchase.paid_amount,
        "total_amount": purchase.total_amount,
        "vendor_name": vendor.name if vendor else "Unknown"
    }

@router.post("/{purchase_id}/unpay")
def unpay_purchase(purchase_id: int, db: Session = Depends(database.get_db)):
    """Mark a purchase as unpaid (Due) and revert vendor balance based on what was paid"""
    purchase = db.query(models.Purchase).filter(models.Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    if purchase.payment_status == "Due" and purchase.paid_amount == 0:
        raise HTTPException(status_code=400, detail="Purchase is already marked as Due with zero payments")
    
    amount_to_revert = purchase.paid_amount
    
    # Reset status and paid amount
    purchase.payment_status = "Due"
    purchase.paid_amount = 0.0
    
    # Revert vendor balance (we owe them back what we previously 'paid')
    vendor = db.query(models.Vendor).filter(models.Vendor.id == purchase.vendor_id).first()
    if vendor and amount_to_revert > 0:
        vendor.current_balance -= amount_to_revert
    
    db.commit()
    
    return {
        "message": f"Purchase #{purchase_id} reverted to Due. ₹{amount_to_revert} reverted.",
        "vendor_name": vendor.name if vendor else "Unknown"
    }

