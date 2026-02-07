from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import models, schemas
from database import get_db
import pandas as pd
import io

router = APIRouter(
    tags=["import_export"],
)

@router.post("/import")
async def import_inventory(
    file: UploadFile = File(...), 
    import_type: str = "inventory",  # "inventory" or "purchase"
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
         raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel or CSV.")
    
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
         raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if import_type == "purchase":
        # Handle Purchase Order Import
        # Expected columns: vendor_name, vendor_address, vendor_mobile, vendor_email, sku, quantity, unit_cost
        
        required_cols = ['vendor_name', 'sku', 'quantity', 'unit_cost']
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing required column for purchase: {col}")

        # Group by Vendor
        imported_purchases = 0
        restored_purchases = 0
        skipped_duplicates = 0
        
        grouped = df.groupby('vendor_name')

        import hashlib
        import json

        for vendor_name, group in grouped:
            # 1. Determine Invoice Number (if available)
            # Check if 'invoice_number' column exists and has a value for this group
            invoice_number = None
            if 'invoice_number' in df.columns:
                invoices = group['invoice_number'].unique()
                if len(invoices) > 0 and pd.notna(invoices[0]):
                    invoice_number = str(invoices[0])

            # 2. Generate HASH for content match (fallback or secondary check)
            # Content: VendorName + Sorted List of Items (SKU, Qty, Cost)
            items_for_hash = []
            for _, row in group.iterrows():
                items_for_hash.append({
                    "sku": str(row['sku']),
                    "qty": int(row['quantity']),
                    "cost": float(row['unit_cost'])
                })
            
            items_for_hash.sort(key=lambda x: x['sku'])
            
            hash_payload = json.dumps({
                "vendor": vendor_name,
                "items": items_for_hash,
                "invoice": invoice_number # Include invoice in hash if present
            }, sort_keys=True)
            
            content_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

            # 3. CHECK FOR EXISTING DUPLICATE
            existing_purchase = None
            if invoice_number:
                # Primary check by Invoice Number for this Vendor
                # First find vendor ID to be precise, or just check hash?
                # Let's rely on Hash + Invoice combination or just Hash. 
                # Actually, if invoice number is provided, we should probably check that first.
                # But to be safe and consistent with previous logic, let's use the content_hash which now includes the invoice number.
                existing_purchase = db.query(models.Purchase).filter(models.Purchase.content_hash == content_hash).first()
                
                # Fallback: Check by invoice number explicitly if hash missed (e.g. minor content diff but same invoice?)
                # For now, strict equality via hash is safer to avoid merging different versions of same invoice.
            else:
                existing_purchase = db.query(models.Purchase).filter(models.Purchase.content_hash == content_hash).first()

            if existing_purchase:
                if existing_purchase.is_active:
                    print(f"Skipping duplicate active purchase for {vendor_name}")
                    skipped_duplicates += 1
                    continue 
                else:
                    # Soft Deleted -> Restore
                    print(f"Restoring soft-deleted purchase for {vendor_name}")
                    existing_purchase.is_active = True
                    
                    # Check if stock was reverted
                    if existing_purchase.stock_reverted:
                        print(f"Restoring stock for reverted purchase {existing_purchase.id}")
                        for item in existing_purchase.items:
                            trophy = db.query(models.Trophy).filter(models.Trophy.id == item.trophy_id).first()
                            if trophy:
                                trophy.quantity += item.quantity
                        existing_purchase.stock_reverted = False

                    db.commit()
                    restored_purchases += 1
                    continue
            
            # --- IF NEW PURCHASE ---

            # 1. Get or Create Vendor
            vendor = db.query(models.Vendor).filter(models.Vendor.name == vendor_name).first()
            if not vendor:
                first_row = group.iloc[0]
                vendor = models.Vendor(
                    name=vendor_name,
                    address=first_row.get('vendor_address'),
                    mobile=str(first_row.get('vendor_mobile')) if pd.notna(first_row.get('vendor_mobile')) else None,
                    email=first_row.get('vendor_email') if pd.notna(first_row.get('vendor_email')) else None
                )
                db.add(vendor)
                db.flush() 
            
            # 2. Create Purchase Record
            purchase = models.Purchase(
                vendor_id=vendor.id,
                total_amount=0.0,
                is_active=True,
                content_hash=content_hash,
                invoice_number=invoice_number
            )
            db.add(purchase)
            db.flush()

            total_amount = 0.0

            # 3. Process Items
            for idx, row in group.iterrows():
                sku = str(row['sku'])
                quantity = int(row['quantity'])
                cost = float(row['unit_cost'])

                # Find Trophy
                trophy = db.query(models.Trophy).filter(models.Trophy.sku == sku).first()
                if not trophy:
                    trophy = models.Trophy(
                        name=row.get('product_name', f"New Item {sku}"),
                        sku=sku,
                        quantity=0,
                        cost_price=cost,
                        selling_price=float(row.get('selling_price', 0.0)),
                        category=row.get('category', 'Uncategorized'),
                        material=row.get('material', 'Unknown')
                    )
                    db.add(trophy)
                    db.flush()
                
                # Update Stock and Cost
                trophy.quantity += quantity
                trophy.cost_price = cost 
                
                # Add Purchase Item
                p_item = models.PurchaseItem(
                    purchase_id=purchase.id,
                    trophy_id=trophy.id,
                    quantity=quantity,
                    unit_cost=cost
                )
                db.add(p_item)
                total_amount += (quantity * cost)
            
            purchase.total_amount = total_amount
            imported_purchases += 1

        db.commit()
        return {
            "message": "Purchase import processed", 
            "created": imported_purchases, 
            "restored": restored_purchases, 
            "skipped_duplicates": skipped_duplicates
        }

    elif import_type == "inventory":
        # Standard Inventory Import (Overwrite/Update)
        required_cols = ['name', 'sku', 'quantity', 'cost_price', 'selling_price']
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"Missing required column: {col}")

        imported_count = 0
        updated_count = 0

        for index, row in df.iterrows():
            # Check if SKU exists
            sku = str(row['sku'])
            existing_item = db.query(models.Trophy).filter(models.Trophy.sku == sku).first()
            
            item_data = {
                "name": row['name'],
                "sku": sku,
                "quantity": int(row['quantity']),
                "cost_price": float(row['cost_price']),
                "selling_price": float(row['selling_price']),
                "category": row.get('category', None),
                "material": row.get('material', None),
                "min_stock_level": int(row.get('min_stock_level', 5))
            }

            if existing_item:
                # Update
                for key, value in item_data.items():
                    setattr(existing_item, key, value)
                updated_count += 1
            else:
                # Create
                new_item = models.Trophy(**item_data)
                db.add(new_item)
                imported_count += 1
        
        db.commit()
        return {"message": "Import successful", "imported": imported_count, "updated": updated_count}

    elif import_type == "sales":
        # Handle Sales History Import
        # Expected columns from "OCTOBER 2025 Sale" sheet
        # Mapping:
        # DATE -> timestamp
        # INVOICE\nNo. -> invoice_number
        # PARTY'S NAME & ADDRESS -> customer_name
        # GSTIN No. -> gstin
        # TOTAL TAX\nCHARGED -> tax_amount
        # GRAND TOTAL -> total_amount

        # Normalize column names for easier access (strip newlines, spaces)
        df.columns = [c.replace('\n', ' ').strip() for c in df.columns]

        imported_sales = 0
        skipped_duplicates = 0
        
        for index, row in df.iterrows():
            # Basic validation: Must have Date and Total
            if pd.isna(row.get('DATE')) or pd.isna(row.get('GRAND TOTAL')):
                continue

            invoice_no = str(row.get('INVOICE No.', ''))
            if invoice_no == 'nan': invoice_no = None

            # Check duplicate by Invoice No
            if invoice_no:
                existing = db.query(models.Sale).filter(models.Sale.invoice_number == invoice_no).first()
                if existing:
                    skipped_duplicates += 1
                    continue
            
            # Parse Date
            try:
                sale_date = pd.to_datetime(row['DATE'])
            except:
                sale_date = None

            sale = models.Sale(
                timestamp=sale_date,
                customer_name=row.get("PARTY'S NAME & ADDRESS", 'Unknown'),
                invoice_number=invoice_no,
                gstin=str(row.get('GSTIN No.', '')),
                tax_amount=float(row.get('TOTAL TAX CHARGED', 0.0)) if pd.notna(row.get('TOTAL TAX CHARGED')) else 0.0,
                total_amount=float(row.get('GRAND TOTAL', 0.0)),
                total_profit=0.0 # Cannot calculate profit without item costs
            )
            db.add(sale)
            imported_sales += 1

        db.commit()
        return {"message": "Sales import successful", "imported": imported_sales, "skipped": skipped_duplicates}

@router.get("/export")
def export_inventory(db: Session = Depends(get_db)):
    items = db.query(models.Trophy).all()
    
    # Convert to list of dicts
    data = []
    for item in items:
        data.append({
            "id": item.id,
            "name": item.name,
            "sku": item.sku,
            "category": item.category,
            "material": item.material,
            "quantity": item.quantity,
            "cost_price": item.cost_price,
            "selling_price": item.selling_price,
            "min_stock_level": item.min_stock_level
        })
    
    df = pd.DataFrame(data)
    
    stream = io.BytesIO()
    # Export to Excel
    with pd.ExcelWriter(stream) as writer:
        df.to_excel(writer, index=False)
    
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inventory_export.xlsx"}
    )
