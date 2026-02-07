from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta
import database
import models

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)

@router.get("/dashboard")
def get_dashboard_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(database.get_db)
):
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    # Sales Analytics
    sales_query = db.query(models.Sale).filter(models.Sale.timestamp >= start_date, models.Sale.timestamp <= end_date)
    total_sales = sales_query.count()
    total_revenue = sales_query.with_entities(func.sum(models.Sale.total_amount)).scalar() or 0.0
    total_profit = sales_query.with_entities(func.sum(models.Sale.total_profit)).scalar() or 0.0

    # Stock Value
    stock_value = db.query(func.sum(models.Trophy.quantity * models.Trophy.cost_price)).scalar() or 0.0

    return {
        "period": {"start": start_date, "end": end_date},
        "total_sales_count": total_sales,
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "current_stock_value": stock_value
    }

@router.get("/sales_trend")
def get_sales_trend(
    days: int = 7,
    db: Session = Depends(database.get_db)
):
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Query sales grouped by date
    sales = db.query(
        func.date(models.Sale.timestamp).label('date'),
        func.sum(models.Sale.total_amount).label('amount'),
        func.sum(models.Sale.total_profit).label('profit')
    ).filter(models.Sale.timestamp >= start_date).group_by(func.date(models.Sale.timestamp)).all()

    return [{"date": s.date, "amount": s.amount, "profit": s.profit} for s in sales]
