from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/sales",
    tags=["sales"],
)

@router.post("/", response_model=schemas.Sale)
def create_sale(sale_data: schemas.SaleCreate, db: Session = Depends(get_db)):
    # 1. Calculate totals and check stock
    total_amount = 0.0
    total_cost = 0.0
    sale_items_db = []

    for item in sale_data.items:
        trophy = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id).first()
        if not trophy:
            raise HTTPException(status_code=404, detail=f"Trophy with ID {item.trophy_id} not found")
        
        if trophy.quantity < item.quantity:
             raise HTTPException(status_code=400, detail=f"Not enough stock for {trophy.name}. Available: {trophy.quantity}")

        # Update Stock
        trophy.quantity -= item.quantity
        
        # Calculate financials
        line_total = trophy.selling_price * item.quantity
        line_cost = trophy.cost_price * item.quantity
        
        total_amount += line_total
        total_cost += line_cost

        # Create Sale Item Record
        sale_item_db = models.SaleItem(
            trophy_id=trophy.id,
            quantity=item.quantity,
            unit_price_at_sale=trophy.selling_price,
            unit_cost_at_sale=trophy.cost_price
        )
        sale_items_db.append(sale_item_db)

    # 2. Create Sale Record
    total_profit = total_amount - total_cost
    
    new_sale = models.Sale(
        customer_name=sale_data.customer_name,
        customer_id=sale_data.customer_id,
        payment_status=sale_data.payment_status or "Paid",
        total_amount=total_amount,
        total_profit=total_profit
    )
    
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)

    # 3. Associate Items with Sale
    for si in sale_items_db:
        si.sale_id = new_sale.id
        db.add(si)
    
    # 4. Update Customer Ledger if linked
    if sale_data.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == sale_data.customer_id).first()
        if customer:
            if new_sale.payment_status == "Due":
                # Decrement balance (increase due)
                customer.current_balance -= total_amount
            # If Paid, balance unchanged (or credit/debit wash)
            
            db.add(customer)

    db.commit()
    db.refresh(new_sale)

    # Return with item details populated (need to refetch or construct)
    # The relationship 'items' on new_sale should technically work after refresh, 
    # but let's be explicit for the response schema
    
    return new_sale

@router.get("/customers", response_model=List[str])
def get_customers(db: Session = Depends(get_db)):
    # Fetch unique customer names
    customers = db.query(models.Sale.customer_name).distinct().filter(models.Sale.customer_name != None).all()
    return [c[0] for c in customers if c[0]]

@router.get("/", response_model=List[schemas.Sale])
def get_sales(
    skip: int = 0, 
    limit: int = 100, 
    start_date: str = None, 
    end_date: str = None, 
    customer_name: str = None, 
    customer_id: int = None, # Added
    db: Session = Depends(get_db)
):
    query = db.query(models.Sale)

    if start_date:
        query = query.filter(models.Sale.timestamp >= start_date)
    if end_date:
        query = query.filter(models.Sale.timestamp <= end_date)
    if customer_name:
        query = query.filter(models.Sale.customer_name.ilike(f"%{customer_name}%"))
    if customer_id:
        query = query.filter(models.Sale.customer_id == customer_id) # Added

    sales = query.order_by(models.Sale.timestamp.desc()).offset(skip).limit(limit).all()
    return sales
