from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"],
)

@router.post("/", response_model=schemas.Trophy)
def create_item(item: schemas.TrophyCreate, db: Session = Depends(get_db)):
    db_item = models.Trophy(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=List[schemas.Trophy])
def read_items(skip: int = 0, limit: int = 100, search: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Trophy)
    if search:
        # Search by Name or SKU
        query = query.filter(
            (models.Trophy.name.ilike(f"%{search}%")) | 
            (models.Trophy.sku.ilike(f"%{search}%"))
        )
    items = query.offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model=schemas.Trophy)
def read_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Trophy).filter(models.Trophy.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.put("/{item_id}", response_model=schemas.Trophy)
def update_item(item_id: int, item: schemas.TrophyUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.Trophy).filter(models.Trophy.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.dict().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.Trophy).filter(models.Trophy.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"ok": True}
