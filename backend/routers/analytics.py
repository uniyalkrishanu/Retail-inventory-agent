from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
import models, database
from .auth import get_current_user

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)

@router.get("/dashboard")
def get_dashboard_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    # Sales Analytics
    sales_query = db.query(models.Sale).filter(models.Sale.timestamp >= start_date, models.Sale.timestamp <= end_date)
    if current_user.role != "root":
        sales_query = sales_query.filter(models.Sale.owner_id == current_user.id)
    
    total_sales = sales_query.count()
    total_revenue = sales_query.with_entities(func.sum(models.Sale.total_amount)).scalar() or 0.0
    total_profit = sales_query.with_entities(func.sum(models.Sale.total_profit)).scalar() or 0.0

    # Purchase Analytics (Expenses)
    purchase_query = db.query(models.Purchase).filter(
        models.Purchase.timestamp >= start_date, 
        models.Purchase.timestamp <= end_date,
        models.Purchase.is_active == True
    )
    if current_user.role != "root":
        purchase_query = purchase_query.filter(models.Purchase.owner_id == current_user.id)
    
    total_expense = purchase_query.with_entities(func.sum(models.Purchase.total_amount)).scalar() or 0.0

    # Stock Value
    stock_query = db.query(func.sum(models.Trophy.quantity * models.Trophy.cost_price))
    if current_user.role != "root":
        stock_query = stock_query.filter(models.Trophy.owner_id == current_user.id)
    
    stock_value = stock_query.scalar() or 0.0

    return {
        "period": {"start": start_date, "end": end_date},
        "total_sales_count": total_sales,
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "total_expense": total_expense,
        "current_stock_value": stock_value
    }

@router.get("/sales_trend")
def get_sales_trend(
    days: Optional[int] = 7,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not start_date or not end_date:
        start_date = datetime.utcnow() - timedelta(days=days)
        end_date = datetime.utcnow()
    
    query = db.query(
        func.date(models.Sale.timestamp).label('date'),
        func.sum(models.Sale.total_amount).label('amount'),
        func.sum(models.Sale.total_profit).label('profit')
    ).filter(
        models.Sale.timestamp >= start_date,
        models.Sale.timestamp <= end_date
    )
    
    if current_user.role != "root":
        query = query.filter(models.Sale.owner_id == current_user.id)
        
    sales = query.group_by(func.date(models.Sale.timestamp)).order_by(func.date(models.Sale.timestamp)).all()

    return [{"date": s.date, "amount": s.amount, "profit": s.profit} for s in sales]
