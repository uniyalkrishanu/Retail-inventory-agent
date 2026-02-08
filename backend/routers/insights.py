from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from services.ai_service import ai_service
import models
from datetime import datetime, timedelta

router = APIRouter(prefix="/insights", tags=["insights"])

from .auth import get_current_user
from database import get_db

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/business-summary")
async def get_business_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get AI-generated insights about the business performance for the current user.
    """
    # 1. Gather recent data for context
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    query = db.query(models.Sale).filter(models.Sale.timestamp >= thirty_days_ago)
    
    if current_user.role != "root":
        query = query.filter(models.Sale.owner_id == current_user.id)
    
    recent_sales = query.all()
    
    total_revenue = sum(sale.total_amount for sale in recent_sales)
    total_sales_count = len(recent_sales)
    
    # 2. Prepare prompt for AI
    business_name = current_user.username if current_user.username != "root" else "Retail Business"
    
    prompt = f"""
    As a business analyst for '{business_name}', analyze the following performance data from the last 30 days:
    - Total Revenue: ₹{total_revenue:,.2f}
    - Number of Transactions: {total_sales_count}
    - Average Order Value: ₹{(total_revenue/total_sales_count if total_sales_count > 0 else 0):,.2f}
    
    Provide a concise (2-3 sentence) strategic insight or recommendation for the business owner.
    """
    
    messages = [
        {"role": "system", "content": "You are a helpful business analytics assistant for a retail store."},
        {"role": "user", "content": prompt}
    ]
    
    # 3. Get AI response
    try:
        insight = await ai_service.get_chat_completion(messages)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_assistant(query: str, current_user: models.User = Depends(get_current_user)):
    """
    Generic chat endpoint for business queries.
    """
    business_name = current_user.username if current_user.username != "root" else "Retail Business"
    messages = [
        {"role": "system", "content": f"You are a helpful assistant for {business_name}. Answer business queries clearly."},
        {"role": "user", "content": query}
    ]
    
    try:
        response = await ai_service.get_chat_completion(messages)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
