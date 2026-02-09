import sqlite3

def repair():
    conn = sqlite3.connect('backend/inventory.db')
    cursor = conn.cursor()
    
    print("Repairing NULL flags in database...")
    
    # Fix Purchases
    cursor.execute('UPDATE purchases SET is_active = 1 WHERE is_active IS NULL')
    cursor.execute('UPDATE purchases SET payment_status = "Due" WHERE payment_status IS NULL')
    cursor.execute('UPDATE purchases SET paid_amount = 0.0 WHERE paid_amount IS NULL')
    print(f"Purchases updated: {cursor.rowcount} rows")
    
    # Fix Vendors
    cursor.execute('UPDATE vendors SET current_balance = 0.0 WHERE current_balance IS NULL')
    print(f"Vendors updated: {cursor.rowcount} rows")
    
    # Fix Sales
    cursor.execute('UPDATE sales SET payment_status = "Paid" WHERE payment_status IS NULL')
    cursor.execute('UPDATE sales SET paid_amount = total_amount WHERE paid_amount IS NULL')
    cursor.execute('UPDATE sales SET total_profit = 0.0 WHERE total_profit IS NULL')
    print(f"Sales updated: {cursor.rowcount} rows")
    
    conn.commit()
    conn.close()
    print("Repair complete.")

if __name__ == "__main__":
    repair()
