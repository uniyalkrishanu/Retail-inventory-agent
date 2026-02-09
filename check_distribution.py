import sqlite3

conn = sqlite3.connect('backend/inventory.db')
tables = ['users', 'trophies', 'customers', 'vendors', 'sales', 'purchases']

print("Record Distribution:")
for t in tables:
    try:
        counts = conn.execute(f"SELECT owner_id, COUNT(*) FROM {t} GROUP BY owner_id").fetchall()
        print(f"{t}: {counts}")
    except Exception as e:
        print(f"{t}: Error {e}")

conn.close()
