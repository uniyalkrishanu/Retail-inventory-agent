from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # "root" or "user"
    is_active = Column(Boolean, default=True)

class Trophy(Base):
    __tablename__ = "trophies"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True) # Data Isolation
    name = Column(String, index=True)
    category = Column(String)
    material = Column(String)
    quantity = Column(Integer, default=0)
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    sku = Column(String, unique=True, index=True)
    min_stock_level = Column(Integer, default=5)

    owner = relationship("User")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True) # Data Isolation
    name = Column(String, index=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    current_balance = Column(Float, default=0.0)

    owner = relationship("User")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True) # Data Isolation
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0)
    total_profit = Column(Float, default=0.0)
    invoice_number = Column(String, index=True, nullable=True)
    gstin = Column(String, nullable=True)
    tax_amount = Column(Float, default=0.0)
    payment_status = Column(String, default="Paid")
    paid_amount = Column(Float, default=0.0)

    owner = relationship("User")
    customer = relationship("Customer")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    trophy_id = Column(Integer, ForeignKey("trophies.id"))
    quantity = Column(Integer)
    unit_price_at_sale = Column(Float)
    unit_cost_at_sale = Column(Float)

    sale = relationship("Sale", back_populates="items")
    trophy = relationship("Trophy")

    @property
    def trophy_name(self):
        return self.trophy.name if self.trophy else "Unknown Item"

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True) # Data Isolation
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    email = Column(String, nullable=True)
    current_balance = Column(Float, default=0.0)

    owner = relationship("User")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True) # Data Isolation
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    total_amount = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    content_hash = Column(String, index=True, nullable=True)
    invoice_number = Column(String, index=True, nullable=True)
    stock_reverted = Column(Boolean, default=False)
    payment_status = Column(String, default="Due")
    paid_amount = Column(Float, default=0.0)

    owner = relationship("User")
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

    @property
    def trophy_name(self):
        return self.trophy.name if self.trophy else "Unknown Item"
