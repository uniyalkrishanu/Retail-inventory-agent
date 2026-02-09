import sqlite3
import pandas as pd

conn = sqlite3.connect('backend/inventory.db')

tables = ['vendors', 'purchases', 'sales', 'trophies', 'customers']

for table in tables:
    print(f"\n=== {table.upper()} ===")
    try:
        df = pd.read_sql_query(f"SELECT * FROM {table} LIMIT 5", conn)
        print(df.to_string())
        
        # Check counts of active/owned records
        count_all = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        count_owned = conn.execute(f"SELECT COUNT(*) FROM {table} WHERE owner_id = 1").fetchone()[0]
        
        filter_clause = ""
        if table in ['purchases', 'trophies']:
            filter_clause = " AND is_active = 1"
        
        count_visible = conn.execute(f"SELECT COUNT(*) FROM {table} WHERE owner_id = 1{filter_clause}").fetchone()[0]
        
        print(f"Total: {count_all}, Owned by root (1): {count_owned}, Visible (Active+Owned): {count_visible}")
    except Exception as e:
        print(f"Error: {e}")

conn.close()
