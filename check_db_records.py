import sqlite3
import os

db_path = 'backend/inventory.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['users', 'trophies', 'customers', 'sales', 'vendors', 'purchases']

print("Record counts in database:")
for table in tables:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"{table}: {count}")
    except Exception as e:
        print(f"Error reading table {table}: {e}")

conn.close()
