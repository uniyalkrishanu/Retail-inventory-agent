from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/sales",
    tags=["sales"],
)

@router.post("/", response_model=schemas.Sale)
def create_sale(sale_data: schemas.SaleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Calculate totals and check stock
    total_amount = 0.0
    total_cost = 0.0
    sale_items_db = []

    for item in sale_data.items:
        # Isolation: Check if trophy belongs to current user
        query = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id)
        if current_user.role != "root":
            query = query.filter(models.Trophy.owner_id == current_user.id)
        
        trophy = query.first()
        if not trophy:
            raise HTTPException(status_code=404, detail=f"Trophy with ID {item.trophy_id} not found or access denied")
        
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
    
    # Handle paid amount based on status if not explicitly provided
    initial_paid = sale_data.paid_amount or 0.0
    if sale_data.payment_status == "Paid" and initial_paid == 0:
        initial_paid = total_amount
    elif sale_data.payment_status == "Partially Paid" and initial_paid == 0:
        initial_paid = 0.0

    new_sale = models.Sale(
        owner_id=current_user.id,
        customer_name=sale_data.customer_name,
        customer_id=sale_data.customer_id,
        payment_status=sale_data.payment_status or "Paid",
        paid_amount=initial_paid,
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
        c_query = db.query(models.Customer).filter(models.Customer.id == sale_data.customer_id)
        if current_user.role != "root":
            c_query = c_query.filter(models.Customer.owner_id == current_user.id)
            
        customer = c_query.first()
        if customer:
            unpaid_amount = total_amount - initial_paid
            if unpaid_amount > 0:
                customer.current_balance -= unpaid_amount
            elif unpaid_amount < 0:
                customer.current_balance += abs(unpaid_amount)
            db.add(customer)

    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.post("/{sale_id}/pay")
def pay_sale(sale_id: int, amount: Optional[float] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s_query = db.query(models.Sale).filter(models.Sale.id == sale_id)
    if current_user.role != "root":
        s_query = s_query.filter(models.Sale.owner_id == current_user.id)
    
    sale = s_query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    remaining = sale.total_amount - sale.paid_amount
    payment_made = amount if amount is not None else remaining

    if payment_made <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    if payment_made > remaining + 0.01: # Small epsilon for float
        raise HTTPException(status_code=400, detail=f"Payment exceeds remaining balance ({remaining})")

    sale.paid_amount += payment_made
    if abs(sale.total_amount - sale.paid_amount) < 0.01:
        sale.payment_status = "Paid"
    else:
        sale.payment_status = "Partially Paid"
    
    # Update customer balance
    if sale.customer_id:
        c_query = db.query(models.Customer).filter(models.Customer.id == sale.customer_id)
        if current_user.role != "root":
            c_query = c_query.filter(models.Customer.owner_id == current_user.id)
        customer = c_query.first()
        if customer:
            customer.current_balance += payment_made
            db.add(customer)
            
    db.commit()
    db.refresh(sale)
    return sale

@router.post("/{sale_id}/unpay")
def unpay_sale(sale_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s_query = db.query(models.Sale).filter(models.Sale.id == sale_id)
    if current_user.role != "root":
        s_query = s_query.filter(models.Sale.owner_id == current_user.id)
        
    sale = s_query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    amount_to_revert = sale.paid_amount
    sale.paid_amount = 0.0
    sale.payment_status = "Due"
    
    if sale.customer_id and amount_to_revert > 0:
        c_query = db.query(models.Customer).filter(models.Customer.id == sale.customer_id)
        if current_user.role != "root":
            c_query = c_query.filter(models.Customer.owner_id == current_user.id)
        customer = c_query.first()
        if customer:
            customer.current_balance -= amount_to_revert
            db.add(customer)
            
    db.commit()
    db.refresh(sale)
    return sale

@router.put("/{sale_id}")
def update_sale(sale_id: int, sale_update: schemas.SaleUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s_query = db.query(models.Sale).filter(models.Sale.id == sale_id)
    if current_user.role != "root":
        s_query = s_query.filter(models.Sale.owner_id == current_user.id)
        
    sale = s_query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # 1. Update Customer Name Reflection
    if sale_update.customer_name and sale_update.customer_name != sale.customer_name:
        sale.customer_name = sale_update.customer_name
        
        # If linked to a registered customer, update the Customer record name as well
        if sale.customer_id:
            c_query = db.query(models.Customer).filter(models.Customer.id == sale.customer_id)
            if current_user.role != "root":
                c_query = c_query.filter(models.Customer.owner_id == current_user.id)
            customer = c_query.first()
            if customer:
                customer.name = sale_update.customer_name
                db.add(customer)

    # 2. Update Payment Status
    if sale_update.payment_status:
        sale.payment_status = sale_update.payment_status

    # 3. Update Items (Stock Adjustment)
    if sale_update.items is not None:
        # Revert old stock
        for item in sale.items:
            t_query = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id)
            if current_user.role != "root":
                t_query = t_query.filter(models.Trophy.owner_id == current_user.id)
            trophy = t_query.first()
            if trophy:
                trophy.quantity += item.quantity
        
        # Remove old sale items
        db.query(models.SaleItem).filter(models.SaleItem.sale_id == sale_id).delete()

        # Calculate new totals and apply new stock
        new_total_amount = 0.0
        new_total_cost = 0.0
        
        for item in sale_update.items:
            t_query = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id)
            if current_user.role != "root":
                t_query = t_query.filter(models.Trophy.owner_id == current_user.id)
            trophy = t_query.first()
            if not trophy:
                raise HTTPException(status_code=404, detail=f"Trophy {item.trophy_id} not found")
            
            if trophy.quantity < item.quantity:
                 raise HTTPException(status_code=400, detail=f"Not enough stock for {trophy.name}. Available: {trophy.quantity}")

            trophy.quantity -= item.quantity
            
            line_total = trophy.selling_price * item.quantity
            line_cost = trophy.cost_price * item.quantity
            
            new_total_amount += line_total
            new_total_cost += line_cost

            new_sale_item = models.SaleItem(
                sale_id=sale.id,
                trophy_id=trophy.id,
                quantity=item.quantity,
                unit_price_at_sale=trophy.selling_price,
                unit_cost_at_sale=trophy.cost_price
            )
            db.add(new_sale_item)

        # Update customer balance for the difference in total amount
        if sale.customer_id:
            c_query = db.query(models.Customer).filter(models.Customer.id == sale.customer_id)
            if current_user.role != "root":
                c_query = c_query.filter(models.Customer.owner_id == current_user.id)
            customer = c_query.first()
            if customer:
                diff = new_total_amount - sale.total_amount
                if sale.payment_status != "Paid":
                    customer.current_balance -= diff
                db.add(customer)

        sale.total_amount = new_total_amount
        sale.total_profit = new_total_amount - new_total_cost

    db.commit()
    db.refresh(sale)
    return sale

@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s_query = db.query(models.Sale).filter(models.Sale.id == sale_id)
    if current_user.role != "root":
        s_query = s_query.filter(models.Sale.owner_id == current_user.id)
        
    sale = s_query.first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # 1. Revert stock
    for item in sale.items:
        t_query = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id)
        if current_user.role != "root":
            t_query = t_query.filter(models.Trophy.owner_id == current_user.id)
        trophy = t_query.first()
        if trophy:
            trophy.quantity += item.quantity
            db.add(trophy)
    
    # 2. Revert customer balance
    if sale.customer_id:
        c_query = db.query(models.Customer).filter(models.Customer.id == sale.customer_id)
        if current_user.role != "root":
            c_query = c_query.filter(models.Customer.owner_id == current_user.id)
        customer = c_query.first()
        if customer:
            unpaid_portion = sale.total_amount - sale.paid_amount
            customer.current_balance += unpaid_portion
            db.add(customer)
            
    # 3. Delete sale items and sale
    db.query(models.SaleItem).filter(models.SaleItem.sale_id == sale_id).delete()
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted and stock/ledger reverted successfully"}

@router.get("/customers", response_model=List[str])
def get_customers(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Fetch unique customer names
    query = db.query(models.Sale.customer_name).distinct().filter(models.Sale.customer_name != None)
    if current_user.role != "root":
        query = query.filter(models.Sale.owner_id == current_user.id)
    customers = query.all()
    return [c[0] for c in customers if c[0]]

@router.get("/", response_model=List[schemas.Sale])
def get_sales(
    skip: int = 0, 
    limit: int = 100, 
    start_date: str = None, 
    end_date: str = None, 
    customer_name: str = None, 
    customer_id: int = None,
    invoice_number: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Sale)
    if current_user.role != "root":
        query = query.filter(models.Sale.owner_id == current_user.id)

    if start_date:
        query = query.filter(models.Sale.timestamp >= start_date)
    if end_date:
        query = query.filter(models.Sale.timestamp <= end_date)
    if customer_name:
        query = query.filter(models.Sale.customer_name.ilike(f"%{customer_name}%"))
    if customer_id:
        query = query.filter(models.Sale.customer_id == customer_id)
    if invoice_number:
        query = query.filter(models.Sale.invoice_number.ilike(f"%{invoice_number}%"))

    sales = query.order_by(models.Sale.timestamp.desc()).offset(skip).limit(limit).all()
    return sales
