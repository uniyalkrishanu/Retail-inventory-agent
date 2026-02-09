import sqlite3

conn = sqlite3.connect('backend/inventory.db')
conn.row_factory = sqlite3.Row

print("User Details:")
users = conn.execute("SELECT id, username, role FROM users").fetchall()
for u in users:
    print(f"ID: {u['id']}, Name: {u['username']}, Role: {u['role']}")

print("\nSales Samples (First 3):")
sales = conn.execute("SELECT * FROM sales LIMIT 3").fetchall()
for s in sales:
    print(dict(s))

print("\nSales count by owner_id:")
counts = conn.execute("SELECT owner_id, COUNT(*) FROM sales GROUP BY owner_id").fetchall()
for c in counts:
    print(dict(c))

conn.close()
