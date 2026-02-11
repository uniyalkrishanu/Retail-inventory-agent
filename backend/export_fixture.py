import sys
import os
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
import models

def export_root_data():
    """Export all root user data to a JSON fixture file."""
    db = SessionLocal()
    try:
        root = db.query(models.User).filter(models.User.username == "root").first()
        if not root:
            print("Root user not found!")
            return

        print(f"Exporting data for Root User (ID: {root.id})...")
        
        fixture = {
            "trophies": [],
            "customers": [],
            "vendors": [],
            "sales": [],
            "purchases": []
        }
        
        # Export Trophies
        trophies = db.query(models.Trophy).filter(models.Trophy.owner_id == root.id).all()
        for trophy in trophies:
            fixture["trophies"].append({
                "name": trophy.name,
                "category": trophy.category,
                "material": trophy.material,
                "quantity": trophy.quantity,
                "cost_price": trophy.cost_price,
                "selling_price": trophy.selling_price,
                "sku": trophy.sku,
                "min_stock_level": trophy.min_stock_level
            })
        
        # Export Customers
        customers = db.query(models.Customer).filter(models.Customer.owner_id == root.id).all()
        for customer in customers:
            fixture["customers"].append({
                "name": customer.name,
                "mobile": customer.mobile,
                "email": customer.email,
                "address": customer.address,
                "current_balance": customer.current_balance
            })
        
        # Export Vendors
        vendors = db.query(models.Vendor).filter(models.Vendor.owner_id == root.id).all()
        for vendor in vendors:
            fixture["vendors"].append({
                "name": vendor.name,
                "address": vendor.address,
                "mobile": vendor.mobile,
                "email": vendor.email,
                "current_balance": vendor.current_balance
            })
        
        # Export Sales (with items)
        sales = db.query(models.Sale).filter(models.Sale.owner_id == root.id).all()
        for sale in sales:
            sale_data = {
                "timestamp": sale.timestamp.isoformat() if sale.timestamp else None,
                "customer_name": sale.customer_name,
                "total_amount": sale.total_amount,
                "total_profit": sale.total_profit,
                "invoice_number": sale.invoice_number,
                "gstin": sale.gstin,
                "tax_amount": sale.tax_amount,
                "payment_status": sale.payment_status,
                "paid_amount": sale.paid_amount,
                "items": []
            }
            
            for item in sale.items:
                sale_data["items"].append({
                    "trophy_sku": item.trophy.sku if item.trophy else None,
                    "quantity": item.quantity,
                    "unit_price_at_sale": item.unit_price_at_sale,
                    "unit_cost_at_sale": item.unit_cost_at_sale
                })
            
            fixture["sales"].append(sale_data)
        
        # Export Purchases (with items)
        purchases = db.query(models.Purchase).filter(models.Purchase.owner_id == root.id).all()
        for purchase in purchases:
            purchase_data = {
                "timestamp": purchase.timestamp.isoformat() if purchase.timestamp else None,
                "vendor_name": purchase.vendor.name if purchase.vendor else None,
                "total_amount": purchase.total_amount,
                "is_active": purchase.is_active,
                "invoice_number": purchase.invoice_number,
                "payment_status": purchase.payment_status,
                "paid_amount": purchase.paid_amount,
                "items": []
            }
            
            for item in purchase.items:
                purchase_data["items"].append({
                    "trophy_sku": item.trophy.sku if item.trophy else None,
                    "quantity": item.quantity,
                    "unit_cost": item.unit_cost
                })
            
            fixture["purchases"].append(purchase_data)
        
        # Save to file
        fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
        os.makedirs(fixtures_dir, exist_ok=True)
        
        output_file = os.path.join(fixtures_dir, "mock_data.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(fixture, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Fixture exported successfully to: {output_file}")
        print(f"  - Trophies: {len(fixture['trophies'])}")
        print(f"  - Customers: {len(fixture['customers'])}")
        print(f"  - Vendors: {len(fixture['vendors'])}")
        print(f"  - Sales: {len(fixture['sales'])}")
        print(f"  - Purchases: {len(fixture['purchases'])}")
        
    finally:
        db.close()

if __name__ == "__main__":
    export_root_data()
