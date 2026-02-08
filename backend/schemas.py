from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Trophy Schemas ---
class TrophyBase(BaseModel):
    name: str
    category: Optional[str] = None
    material: Optional[str] = None
    quantity: int = 0
    cost_price: float = 0.0
    selling_price: float = 0.0
    sku: str
    min_stock_level: int = 5

class TrophyCreate(TrophyBase):
    pass

class TrophyUpdate(TrophyBase):
    pass

class Trophy(TrophyBase):
    id: int

    class Config:
        orm_mode = True

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    name: str
    mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    current_balance: float = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int

    class Config:
        orm_mode = True

# --- Sales Schemas ---
class SaleItemCreate(BaseModel):
    trophy_id: int
    quantity: int

class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_id: Optional[int] = None # Added
    payment_status: Optional[str] = "Paid" # Added
    paid_amount: Optional[float] = 0.0 # Added
    items: List[SaleItemCreate]

class SaleUpdate(BaseModel):
    customer_name: Optional[str] = None
    payment_status: Optional[str] = None
    items: Optional[List[SaleItemCreate]] = None

class SaleItem(BaseModel):
    trophy_id: int
    quantity: int
    unit_price_at_sale: float
    unit_cost_at_sale: float
    trophy_name: Optional[str] = None 

    class Config:
        orm_mode = True

class Sale(BaseModel):
    id: int
    timestamp: datetime
    customer_name: Optional[str]
    customer_id: Optional[int] = None # Added
    payment_status: Optional[str] = "Paid" # Added
    paid_amount: float = 0.0 # Added
    total_amount: float
    total_profit: float
    invoice_number: Optional[str] = None
    gstin: Optional[str] = None
    tax_amount: float = 0.0
    items: List[SaleItem] = []

    class Config:
        orm_mode = True

# --- Vendor Schemas ---
class VendorBase(BaseModel):
    name: str
    address: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    current_balance: float = 0.0  # <0: We owe vendor, >0: Advance

class VendorCreate(VendorBase):
    pass

class VendorUpdate(VendorBase):
    pass

class Vendor(VendorBase):
    id: int

    class Config:
        orm_mode = True

# --- Purchase Schemas ---
class PurchaseItemCreate(BaseModel):
    trophy_id: int
    quantity: int
    unit_cost: float

class PurchaseCreate(BaseModel):
    vendor_id: int
    items: List[PurchaseItemCreate]

class PurchaseItem(BaseModel):
    trophy_id: int
    quantity: int
    unit_cost: float
    trophy_name: Optional[str] = None

    class Config:
        orm_mode = True

class Purchase(BaseModel):
    id: int
    timestamp: datetime
    vendor_id: int
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    total_amount: float
    items_count: int
    payment_status: str = "Due"
    paid_amount: float = 0.0
    items: List[PurchaseItem] = []

    class Config:
        orm_mode = True
