from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

from .auth import get_current_user

router = APIRouter(
    prefix="/customers",
    tags=["customers"],
)

@router.post("/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_customer = models.Customer(**customer.dict(), owner_id=current_user.id)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/", response_model=List[schemas.Customer])
def read_customers(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Customer)
    if current_user.role != "root":
        query = query.filter(models.Customer.owner_id == current_user.id)
    
    if search:
        query = query.filter(models.Customer.name.ilike(f"%{search}%"))
    
    customers = query.offset(skip).limit(limit).all()
    return customers

@router.get("/{customer_id}", response_model=schemas.Customer)
def read_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Customer).filter(models.Customer.id == customer_id)
    if current_user.role != "root":
        query = query.filter(models.Customer.owner_id == current_user.id)
    
    db_customer = query.first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Customer).filter(models.Customer.id == customer_id)
    if current_user.role != "root":
        query = query.filter(models.Customer.owner_id == current_user.id)
    
    db_customer = query.first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer.dict().items():
        setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/{customer_id}/recommendations")
def get_customer_recommendations(customer_id: int, limit: int = 5, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get top purchased products for a customer based on their purchase history.
    """
    from sqlalchemy import func
    
    # Verify customer ownership
    query = db.query(models.Customer).filter(models.Customer.id == customer_id)
    if current_user.role != "root":
        query = query.filter(models.Customer.owner_id == current_user.id)
    if not query.first():
        raise HTTPException(status_code=404, detail="Customer not found")

    # Get recommendations
    results = db.query(
        models.Trophy.id,
        models.Trophy.name,
        models.Trophy.sku,
        models.Trophy.selling_price,
        models.Trophy.quantity.label("stock"),
        func.sum(models.SaleItem.quantity).label("total_purchased")
    ).join(
        models.SaleItem, models.SaleItem.trophy_id == models.Trophy.id
    ).join(
        models.Sale, models.Sale.id == models.SaleItem.sale_id
    ).filter(
        models.Sale.customer_id == customer_id
    ).group_by(
        models.Trophy.id
    ).order_by(
        func.sum(models.SaleItem.quantity).desc()
    ).limit(limit).all()
    
    recommendations = []
    for r in results:
        recommendations.append({
            "id": r.id,
            "name": r.name,
            "sku": r.sku,
            "selling_price": r.selling_price,
            "stock": r.stock,
            "total_purchased": r.total_purchased
        })
    
    return recommendations

@router.post("/{customer_id}/payments")
def register_payment(customer_id: int, amount: float, notes: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Customer).filter(models.Customer.id == customer_id)
    if current_user.role != "root":
        query = query.filter(models.Customer.owner_id == current_user.id)
    
    db_customer = query.first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_customer.current_balance += amount
    db.commit()
    db.refresh(db_customer)
    
    return {
        "message": f"Payment of ₹{amount} registered successfully",
        "new_balance": db_customer.current_balance,
        "customer_name": db_customer.name
    }
