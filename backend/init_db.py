from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from services.auth_service import auth_service
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_users():
    # Ensure tables exist
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Create root user if not exists
        root_user = db.query(models.User).filter(models.User.username == "root").first()
        if not root_user:
            logger.info("Creating root user...")
            root_user = models.User(
                username="root",
                hashed_password=auth_service.get_password_hash("root123"), # Default password
                role="root"
            )
            db.add(root_user)
            db.commit()
            db.refresh(root_user)
        else:
            logger.info("Verification: root user exists.")

        # 2. Create guest user if not exists
        guest_user = db.query(models.User).filter(models.User.username == "guest").first()
        if not guest_user:
            logger.info("Creating guest user...")
            guest_user = models.User(
                username="guest",
                hashed_password=auth_service.get_password_hash("guest123"), # Default guest password
                role="user"
            )
            db.add(guest_user)
            db.commit()
            db.refresh(guest_user)
        else:
            logger.info("Verification: guest user exists.")
        
        # 2.1. Seed guest user with mock data if empty
        guest_trophy_count = db.query(models.Trophy).filter(models.Trophy.owner_id == guest_user.id).count()
        if guest_trophy_count == 0:
            logger.info("Guest user has no data. Loading mock data from fixture...")
            import json
            import os
            from datetime import datetime
            
            fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "mock_data.json")
            if os.path.exists(fixture_path):
                with open(fixture_path, 'r', encoding='utf-8') as f:
                    fixture = json.load(f)
                
                # Create SKU to Trophy ID mapping for guest
                sku_to_trophy = {}
                
                # Import Trophies
                for trophy_data in fixture.get("trophies", []):
                    # Prefix SKU with GUEST- to avoid conflicts with root data
                    guest_sku = f"GUEST-{trophy_data['sku']}"
                    trophy = models.Trophy(
                        owner_id=guest_user.id,
                        name=trophy_data["name"],
                        category=trophy_data.get("category"),
                        material=trophy_data.get("material"),
                        quantity=trophy_data["quantity"],
                        cost_price=trophy_data["cost_price"],
                        selling_price=trophy_data["selling_price"],
                        sku=guest_sku,
                        min_stock_level=trophy_data.get("min_stock_level", 5)
                    )
                    db.add(trophy)
                    db.flush()
                    # Map original SKU to new trophy ID for relationships
                    sku_to_trophy[trophy_data["sku"]] = trophy.id
                
                # Import Customers
                name_to_customer = {}
                for customer_data in fixture.get("customers", []):
                    customer = models.Customer(
                        owner_id=guest_user.id,
                        name=customer_data["name"],
                        mobile=customer_data.get("mobile"),
                        email=customer_data.get("email"),
                        address=customer_data.get("address"),
                        current_balance=customer_data.get("current_balance", 0.0)
                    )
                    db.add(customer)
                    db.flush()
                    name_to_customer[customer_data["name"]] = customer.id
                
                # Import Vendors
                name_to_vendor = {}
                for vendor_data in fixture.get("vendors", []):
                    vendor = models.Vendor(
                        owner_id=guest_user.id,
                        name=vendor_data["name"],
                        address=vendor_data.get("address"),
                        mobile=vendor_data.get("mobile"),
                        email=vendor_data.get("email"),
                        current_balance=vendor_data.get("current_balance", 0.0)
                    )
                    db.add(vendor)
                    db.flush()
                    name_to_vendor[vendor_data["name"]] = vendor.id
                
                # Import Sales
                for sale_data in fixture.get("sales", []):
                    sale = models.Sale(
                        owner_id=guest_user.id,
                        timestamp=datetime.fromisoformat(sale_data["timestamp"]) if sale_data.get("timestamp") else datetime.utcnow(),
                        customer_id=name_to_customer.get(sale_data.get("customer_name")) if sale_data.get("customer_name") in name_to_customer else None,
                        customer_name=sale_data.get("customer_name"),
                        total_amount=sale_data["total_amount"],
                        total_profit=sale_data.get("total_profit", 0.0),
                        invoice_number=sale_data.get("invoice_number"),
                        gstin=sale_data.get("gstin"),
                        tax_amount=sale_data.get("tax_amount", 0.0),
                        payment_status=sale_data.get("payment_status", "Paid"),
                        paid_amount=sale_data.get("paid_amount", 0.0)
                    )
                    db.add(sale)
                    db.flush()
                    
                    for item_data in sale_data.get("items", []):
                        if item_data["trophy_sku"] in sku_to_trophy:
                            sale_item = models.SaleItem(
                                trophy_id=sku_to_trophy[item_data["trophy_sku"]],
                                quantity=item_data["quantity"],
                                unit_price_at_sale=item_data["unit_price_at_sale"],
                                unit_cost_at_sale=item_data["unit_cost_at_sale"]
                            )
                            sale.items.append(sale_item)
                
                # Import Purchases
                for purchase_data in fixture.get("purchases", []):
                    if purchase_data.get("vendor_name") in name_to_vendor:
                        purchase = models.Purchase(
                            owner_id=guest_user.id,
                            timestamp=datetime.fromisoformat(purchase_data["timestamp"]) if purchase_data.get("timestamp") else datetime.utcnow(),
                            vendor_id=name_to_vendor[purchase_data["vendor_name"]],
                            total_amount=purchase_data["total_amount"],
                            is_active=purchase_data.get("is_active", True),
                            invoice_number=purchase_data.get("invoice_number"),
                            payment_status=purchase_data.get("payment_status", "Due"),
                            paid_amount=purchase_data.get("paid_amount", 0.0)
                        )
                        db.add(purchase)
                        db.flush()
                        
                        # Ensure every purchase has items for demo purposes
                        items = purchase_data.get("items", [])
                        if not items and fixture.get("trophies"):
                            # Auto-generate 1-2 random items if none provided
                            import random
                            trophies = fixture.get("trophies")
                            for _ in range(random.randint(1, 2)):
                                t = random.choice(trophies)
                                items.append({
                                    "trophy_sku": t["sku"],
                                    "quantity": random.randint(10, 30),
                                    "unit_cost": t.get("cost_price", 150.0)
                                })
                        
                        for item_data in items:
                            if item_data["trophy_sku"] in sku_to_trophy:
                                purchase_item = models.PurchaseItem(
                                    trophy_id=sku_to_trophy[item_data["trophy_sku"]],
                                    quantity=item_data["quantity"],
                                    unit_cost=item_data["unit_cost"]
                                )
                                purchase.items.append(purchase_item)
                
                db.commit()
                logger.info(f"✓ Guest user seeded with {len(fixture.get('trophies', []))} trophies, {len(fixture.get('sales', []))} sales, {len(fixture.get('purchases', []))} purchases")
            else:
                logger.warning(f"Fixture file not found at {fixture_path}. Guest user will remain empty.")

        # 3. Migrate existing data to root user
        logger.info("Ensuring existing data ownership...")
        
        models_to_migrate = [
            models.Trophy, 
            models.Customer, 
            models.Sale, 
            models.Vendor, 
            models.Purchase
        ]

        for model_class in models_to_migrate:
            unowned_items = db.query(model_class).filter(model_class.owner_id == None).all()
            if unowned_items:
                logger.info(f"Migrating {len(unowned_items)} items for {model_class.__name__}")
                for item in unowned_items:
                    item.owner_id = root_user.id
            db.commit()

        logger.info("Database initialization/verification complete!")

    except Exception as e:
        logger.error(f"Error initializing users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_users()
