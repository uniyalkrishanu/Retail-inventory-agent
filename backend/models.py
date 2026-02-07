from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Trophy(Base):
    __tablename__ = "trophies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    material = Column(String)
    quantity = Column(Integer, default=0)
    cost_price = Column(Float, default=0.0) # Added Cost Price
    selling_price = Column(Float, default=0.0) # Added Selling Price
    sku = Column(String, unique=True, index=True)
    min_stock_level = Column(Integer, default=5)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    current_balance = Column(Float, default=0.0) # >0: Advance, <0: Due

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Link to registered customer
    customer_name = Column(String, nullable=True) # Keep for walk-ins or historical
    total_amount = Column(Float, default=0.0)
    total_profit = Column(Float, default=0.0)
    invoice_number = Column(String, index=True, nullable=True)
    gstin = Column(String, nullable=True)
    tax_amount = Column(Float, default=0.0)
    payment_status = Column(String, default="Paid") # "Paid" or "Due"

    customer = relationship("Customer")
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    trophy_id = Column(Integer, ForeignKey("trophies.id"))
    quantity = Column(Integer)
    unit_price_at_sale = Column(Float) # Important: Price can change later, store what it was sold at
    unit_cost_at_sale = Column(Float) # Store cost to calculate profit accurately even if cost changes

    sale = relationship("Sale", back_populates="items")
    trophy = relationship("Trophy")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    address = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    total_amount = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    content_hash = Column(String, index=True, nullable=True)
    invoice_number = Column(String, index=True, nullable=True)
    stock_reverted = Column(Boolean, default=False)

    vendor = relationship("Vendor")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    trophy_id = Column(Integer, ForeignKey("trophies.id"))
    quantity = Column(Integer)
    unit_cost = Column(Float)

    purchase = relationship("Purchase", back_populates="items")
    trophy = relationship("Trophy")
