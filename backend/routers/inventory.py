from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

from .auth import get_current_user

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
)

@router.post("/", response_model=schemas.Trophy)
def create_item(item: schemas.TrophyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_item = models.Trophy(**item.dict(), owner_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[schemas.Trophy])
def read_items(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Trophy)
    # Isolation: Root sees all, others see only theirs
    if current_user.role != "root":
        query = query.filter(models.Trophy.owner_id == current_user.id)
    
    if search:
        # Search by Name or SKU
        query = query.filter(
            (models.Trophy.name.ilike(f"%{search}%")) | 
            (models.Trophy.sku.ilike(f"%{search}%"))
        )
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/top-sellers")
def get_top_sellers(limit: int = 5, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Get top selling products across all customers in the last 30 days.
    """
    from sqlalchemy import func
    import datetime
    
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    # Get products ordered by total quantity sold in last 30 days
    query = db.query(
        models.Trophy.id,
        models.Trophy.name,
        models.Trophy.sku,
        models.Trophy.selling_price,
        models.Trophy.quantity.label("stock"),
        func.sum(models.SaleItem.quantity).label("total_sold")
    ).join(
        models.SaleItem, models.SaleItem.trophy_id == models.Trophy.id
    ).join(
        models.Sale, models.Sale.id == models.SaleItem.sale_id
    ).filter(
        models.Sale.timestamp >= thirty_days_ago
    )

    # Isolation
    if current_user.role != "root":
        query = query.filter(models.Trophy.owner_id == current_user.id)

    results = query.group_by(
        models.Trophy.id
    ).order_by(
        func.sum(models.SaleItem.quantity).desc()
    ).limit(limit).all()
    
    top_sellers = []
    for r in results:
        top_sellers.append({
            "id": r.id,
            "name": r.name,
            "sku": r.sku,
            "selling_price": r.selling_price,
            "stock": r.stock,
            "total_sold": r.total_sold
        })
    
    return top_sellers

@router.get("/{item_id}", response_model=schemas.Trophy)
def read_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Trophy).filter(models.Trophy.id == item_id)
    if current_user.role != "root":
        query = query.filter(models.Trophy.owner_id == current_user.id)
    
    db_item = query.first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{item_id}", response_model=schemas.Trophy)
def update_item(item_id: int, item: schemas.TrophyUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Trophy).filter(models.Trophy.id == item_id)
    if current_user.role != "root":
        query = query.filter(models.Trophy.owner_id == current_user.id)
    
    db_item = query.first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Trophy).filter(models.Trophy.id == item_id)
    if current_user.role != "root":
        query = query.filter(models.Trophy.owner_id == current_user.id)
    
    db_item = query.first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"ok": True}
