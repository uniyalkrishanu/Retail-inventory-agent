from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from services.ai_service import ai_service
import models
from datetime import datetime, timedelta

router = APIRouter(prefix="/insights", tags=["insights"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/business-summary")
async def get_business_summary(db: Session = Depends(get_db)):
    """
    Get AI-generated insights about the business performance.
    """
    # 1. Gather recent data for context
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_sales = db.query(models.Sale).filter(models.Sale.timestamp >= thirty_days_ago).all()
    
    total_revenue = sum(sale.total_amount for sale in recent_sales)
    total_sales_count = len(recent_sales)
    
    # 2. Prepare prompt for AI
    prompt = f"""
    As a business analyst for 'Natraj India', a trophy and award retailer, analyze the following performance data from the last 30 days:
    - Total Revenue: ₹{total_revenue:,.2f}
    - Number of Transactions: {total_sales_count}
    - Average Order Value: ₹{(total_revenue/total_sales_count if total_sales_count > 0 else 0):,.2f}
    
    Provide a concise (2-3 sentence) strategic insight or recommendation for the business owner.
    """
    
    messages = [
        {"role": "system", "content": "You are a helpful business analytics assistant for a retail store."},
        {"role": "user", "content": prompt}
    ]
    
    # 3. Get AI response (with Grok API + Fallback logic inside service)
    try:
        insight = await ai_service.get_chat_completion(messages)
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_with_assistant(query: str):
    """
    Generic chat endpoint for business queries.
    """
    messages = [
        {"role": "system", "content": "You are a helpful assistant for Natraj India, a trophy retailer. Answer business queries clearly."},
        {"role": "user", "content": query}
    ]
    
    try:
        response = await ai_service.get_chat_completion(messages)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
