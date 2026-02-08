from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pandas as pd
import os
import shutil
import models

# Base directory for all exports (mounted from host via Docker)
# Inside container: /data -> Host: C:\RetailInventoryData
EXPORT_BASE_DIR = "/data"

def get_sales_export_path_for_today():
    """Get the export directory path for today's sales: exports/sales/YEAR/MONTH/DAY/"""
    now = datetime.now()
    year = str(now.year)
    month = f"{now.month:02d}"
    day = f"{now.day:02d}"
    
    path = os.path.join(EXPORT_BASE_DIR, "exports", "sales", year, month, day)
    os.makedirs(path, exist_ok=True)
    return path

def get_master_data_path():
    """Get the path for master data files (overwritten daily)"""
    path = os.path.join(EXPORT_BASE_DIR, "exports", "master")
    os.makedirs(path, exist_ok=True)
    return path

def run_daily_backup(db: Session):
    """
    Run the daily backup:
    1. Master data (Inventory, Customers, Vendors, Purchases) - overwrite in /exports/master/
    2. Sales - save in date hierarchy /exports/sales/YYYY/MM/DD/
    3. Clean up sales exports older than 10 years
    """
    print(f"[Backup] Starting daily backup at {datetime.now()}")
    
    try:
        # === MASTER DATA (Overwrite daily) ===
        master_path = get_master_data_path()
        
        # Export Inventory
        inventory_items = db.query(models.Trophy).all()
        inv_data = [{
            "id": i.id, "name": i.name, "sku": i.sku,
            "category": i.category, "material": i.material,
            "quantity": i.quantity, "cost_price": i.cost_price,
            "selling_price": i.selling_price, "min_stock_level": i.min_stock_level
        } for i in inventory_items]
        pd.DataFrame(inv_data).to_excel(os.path.join(master_path, "inventory.xlsx"), index=False)
        
        # Export Customers
        customers = db.query(models.Customer).all()
        customer_data = [{
            "id": c.id, "name": c.name, "mobile": c.mobile,
            "current_balance": c.current_balance
        } for c in customers]
        pd.DataFrame(customer_data).to_excel(os.path.join(master_path, "customers.xlsx"), index=False)
        
        # Export Vendors
        vendors = db.query(models.Vendor).all()
        vendor_data = [{
            "id": v.id, "name": v.name, "address": v.address,
            "mobile": v.mobile, "email": v.email
        } for v in vendors]
        pd.DataFrame(vendor_data).to_excel(os.path.join(master_path, "vendors.xlsx"), index=False)
        
        # Export Purchases
        purchases = db.query(models.Purchase).filter(models.Purchase.is_active == True).all()
        purchase_data = [{
            "id": p.id, "timestamp": p.timestamp, "vendor_id": p.vendor_id,
            "invoice_number": p.invoice_number, "total_amount": p.total_amount
        } for p in purchases]
        pd.DataFrame(purchase_data).to_excel(os.path.join(master_path, "purchases.xlsx"), index=False)
        
        print(f"[Backup] Master data saved to {master_path}")
        
        # === SALES (Date hierarchy) ===
        sales_path = get_sales_export_path_for_today()
        timestamp = datetime.now().strftime("%H%M%S")
        
        sales = db.query(models.Sale).all()
        sales_data = [{
            "id": s.id, "timestamp": s.timestamp, "customer_name": s.customer_name,
            "customer_id": s.customer_id, "invoice_number": s.invoice_number, 
            "total_amount": s.total_amount, "total_profit": s.total_profit, 
            "payment_status": s.payment_status
        } for s in sales]
        
        sales_file = os.path.join(sales_path, f"sales_{timestamp}.xlsx")
        pd.DataFrame(sales_data).to_excel(sales_file, index=False)
        print(f"[Backup] Sales saved to {sales_file}")
        
        # Cleanup old sales exports (older than 10 years)
        cleanup_old_sales_exports()
        
        return {"status": "success", "master_path": master_path, "sales_file": sales_file}
    
    except Exception as e:
        print(f"[Backup] ERROR: {str(e)}")
        return {"status": "error", "message": str(e)}

def cleanup_old_sales_exports():
    """Delete sales export folders older than 10 years"""
    sales_base = os.path.join(EXPORT_BASE_DIR, "exports", "sales")
    if not os.path.exists(sales_base):
        return
    
    cutoff_year = datetime.now().year - 10
    
    try:
        for year_folder in os.listdir(sales_base):
            year_path = os.path.join(sales_base, year_folder)
            if os.path.isdir(year_path):
                try:
                    folder_year = int(year_folder)
                    if folder_year < cutoff_year:
                        print(f"[Backup] Deleting old sales folder: {year_path}")
                        shutil.rmtree(year_path)
                except ValueError:
                    pass
    except Exception as e:
        print(f"[Backup] Cleanup error: {str(e)}")
