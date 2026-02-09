import pandas as pd
import sqlite3
import os

# Paths
DB_PATH = 'backend/inventory.db'
MASTER_DIR = 'C:/RetailInventoryData/exports/master'
ROOT_USER_ID = 1

def restore():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    
    # Mapping Excel to Tables
    files_to_tables = {
        'inventory.xlsx': 'trophies',
        'customers.xlsx': 'customers',
        'vendors.xlsx': 'vendors',
        'purchases.xlsx': 'purchases'
    }

    for filename, table in files_to_tables.items():
        file_path = os.path.join(MASTER_DIR, filename)
        if not os.path.exists(file_path):
            print(f"Skipping: {filename} (File not found)")
            continue

        print(f"Restoring {table} from {filename}...")
        df = pd.read_excel(file_path)
        
        # Add owner_id
        df['owner_id'] = ROOT_USER_ID
        
        # Initialize mandatory flags if missing from Excel
        if table == 'purchases':
            df['is_active'] = 1
            if 'payment_status' not in df.columns: df['payment_status'] = 'Due'
            if 'paid_amount' not in df.columns: df['paid_amount'] = 0.0
        elif table == 'vendors':
            if 'current_balance' not in df.columns: df['current_balance'] = 0.0
        elif table == 'sales':
            if 'payment_status' not in df.columns: df['payment_status'] = 'Paid'
            if 'paid_amount' not in df.columns: df['paid_amount'] = df['total_amount']
            if 'total_profit' not in df.columns: df['total_profit'] = 0.0

        # Handle nans
        df = df.where(pd.notnull(df), None)
        
        try:
            # Drop the local 'id' if we want auto-increment and clean start
            # Actually, let's keep it to maintain links if Excel has them
            df.to_sql(table, conn, if_exists='append', index=False)
            print(f"  Successfully restored {len(df)} records to {table}")
        except Exception as e:
            print(f"  Error restoring {table}: {e}")
            print(f"  Retrying after clearing table and dropping ID for {table}...")
            try:
                conn.execute(f"DELETE FROM {table} WHERE owner_id = {ROOT_USER_ID}")
                df.drop(columns=['id'], errors='ignore').to_sql(table, conn, if_exists='append', index=False)
                print(f"  Successfully restored {len(df)} records to {table} (IDs re-assigned)")
            except Exception as e2:
                print(f"  Critical error for {table}: {e2}")

    # Special handling for Sales (most recent)
    SALES_ROOT = 'C:/RetailInventoryData/exports/sales'
    if os.path.exists(SALES_ROOT):
        print("\nSearching for latest sales export...")
        all_sales_files = []
        for root, dirs, files in os.walk(SALES_ROOT):
            for file in files:
                if file.startswith('sales_') and file.endswith('.xlsx'):
                    all_sales_files.append(os.path.join(root, file))
        
        if all_sales_files:
            latest_sales = max(all_sales_files, key=os.path.getmtime)
            print(f"Restoring sales records from {latest_sales}...")
            df_sales = pd.read_excel(latest_sales)
            df_sales['owner_id'] = ROOT_USER_ID
            
            # Initialize flags
            if 'payment_status' not in df_sales.columns: df_sales['payment_status'] = 'Paid'
            if 'paid_amount' not in df_sales.columns: df_sales['paid_amount'] = df_sales['total_amount']
            if 'total_profit' not in df_sales.columns: df_sales['total_profit'] = 0.0

            df_sales = df_sales.where(pd.notnull(df_sales), None)
            
            try:
                # Clear existing restored sales to avoid duplicates
                conn.execute(f"DELETE FROM sales WHERE owner_id = {ROOT_USER_ID}")
                df_sales.to_sql('sales', conn, if_exists='append', index=False)
                print(f"  Successfully restored {len(df_sales)} sales records.")
            except Exception as e:
                print(f"  Error restoring sales: {e}")
                print(f"  Retrying without ID...")
                try:
                    df_sales.drop(columns=['id'], errors='ignore').to_sql('sales', conn, if_exists='append', index=False)
                    print(f"  Successfully restored {len(df_sales)} sales records (IDs re-assigned).")
                except Exception as e2:
                    print(f"  Critical error for sales: {e2}")
        else:
            print("No sales export files found.")

    conn.close()
    print("\nRestoration process finished.")

if __name__ == "__main__":
    restore()
