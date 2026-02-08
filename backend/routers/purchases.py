from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import models
import schemas # We might need to add Purchase schemas here if not present
from pydantic import BaseModel
from datetime import datetime

from .auth import get_current_user

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
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Purchase).filter(models.Purchase.is_active == True)
    if current_user.role != "root":
        query = query.filter(models.Purchase.owner_id == current_user.id)
    
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
def delete_purchase(purchase_id: int, revert_stock: bool = False, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Purchase).filter(models.Purchase.id == purchase_id)
    if current_user.role != "root":
        query = query.filter(models.Purchase.owner_id == current_user.id)
        
    purchase = query.first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if revert_stock:
        for item in purchase.items:
            t_query = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id)
            if current_user.role != "root":
                t_query = t_query.filter(models.Trophy.owner_id == current_user.id)
            trophy = t_query.first()
            if trophy:
                trophy.quantity -= item.quantity 
        purchase.stock_reverted = True
    else:
        purchase.stock_reverted = False

    purchase.is_active = False
    db.commit()
    return {"message": f"Purchase deleted. Stock reverted: {revert_stock}"}

@router.post("/{purchase_id}/pay")
def pay_purchase(purchase_id: int, amount: Optional[float] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Purchase).filter(models.Purchase.id == purchase_id)
    if current_user.role != "root":
        query = query.filter(models.Purchase.owner_id == current_user.id)
        
    purchase = query.first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    if purchase.payment_status == "Paid":
        raise HTTPException(status_code=400, detail="Purchase is already fully paid")
    
    remaining_to_pay = purchase.total_amount - purchase.paid_amount
    payment_made = amount if amount is not None else remaining_to_pay
    
    if payment_made <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    if payment_made > remaining_to_pay + 0.01:
        raise HTTPException(status_code=400, detail=f"Payment amount ₹{payment_made} exceeds remaining balance ₹{remaining_to_pay}")
    
    purchase.paid_amount += payment_made
    
    if purchase.paid_amount >= purchase.total_amount - 0.01:
        purchase.payment_status = "Paid"
    else:
        purchase.payment_status = "Partially Paid"
    
    v_query = db.query(models.Vendor).filter(models.Vendor.id == purchase.vendor_id)
    if current_user.role != "root":
        v_query = v_query.filter(models.Vendor.owner_id == current_user.id)
    vendor = v_query.first()
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
def unpay_purchase(purchase_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Purchase).filter(models.Purchase.id == purchase_id)
    if current_user.role != "root":
        query = query.filter(models.Purchase.owner_id == current_user.id)
        
    purchase = query.first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    if purchase.payment_status == "Due" and purchase.paid_amount == 0:
        raise HTTPException(status_code=400, detail="Purchase is already marked as Due")
    
    amount_to_revert = purchase.paid_amount
    purchase.payment_status = "Due"
    purchase.paid_amount = 0.0
    
    v_query = db.query(models.Vendor).filter(models.Vendor.id == purchase.vendor_id)
    if current_user.role != "root":
        v_query = v_query.filter(models.Vendor.owner_id == current_user.id)
    vendor = v_query.first()
    if vendor and amount_to_revert > 0:
        vendor.current_balance -= amount_to_revert
    
    db.commit()
    return {
        "message": f"Purchase #{purchase_id} reverted to Due.",
        "vendor_name": vendor.name if vendor else "Unknown"
    }

