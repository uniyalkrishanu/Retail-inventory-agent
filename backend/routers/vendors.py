from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database
import models
import schemas

router = APIRouter(
    prefix="/vendors",
    tags=["vendors"],
)

@router.post("/", response_model=schemas.Vendor)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(database.get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.name == vendor.name).first()
    if db_vendor:
        raise HTTPException(status_code=400, detail="Vendor already exists")
    new_vendor = models.Vendor(**vendor.dict())
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@router.get("/", response_model=List[schemas.Vendor])
def read_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    vendors = db.query(models.Vendor).offset(skip).limit(limit).all()
    return vendors

@router.put("/{vendor_id}", response_model=schemas.Vendor)
def update_vendor(vendor_id: int, vendor: schemas.VendorUpdate, db: Session = Depends(database.get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(db_vendor, key, value)
    
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(database.get_db)):
    db_vendor = db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    db.delete(db_vendor)
    db.commit()
    return {"message": "Vendor deleted successfully"}
