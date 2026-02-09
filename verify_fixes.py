import sqlite3
import datetime

conn = sqlite3.connect('backend/inventory.db')
conn.row_factory = sqlite3.Row

# Verification 1: Top Sellers Fallback
print("Verification 1: Top Sellers (Simulated)")
thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)

# Check if any sale_items exist
sale_items_count = conn.execute("SELECT COUNT(*) FROM sale_items").fetchone()[0]
print(f"Sale items in DB: {sale_items_count}")

if sale_items_count == 0:
    print("No sale items. Fallback should trigger.")
    fallback_items = conn.execute("SELECT name, quantity FROM trophies ORDER BY id DESC LIMIT 5").fetchall()
    print("Fallback Items (Most Recent):")
    for row in fallback_items:
        print(f" - {row['name']} (Stock: {row['quantity']})")
else:
    print("Sale items exist. Regular logic should trigger.")

# Verification 2: Sales Filtering
print("\nVerification 2: Sales Filtering")
start_date = "2026-02-01"
end_date = "2026-02-10"
end_date_full = f"{end_date} 23:59:59"

sales = conn.execute(
    "SELECT id, timestamp, customer_name FROM sales WHERE timestamp >= ? AND timestamp <= ?",
    (start_date, end_date_full)
).fetchall()

print(f"Sales found between {start_date} and {end_date}: {len(sales)}")
for s in sales[:3]:
    print(f" - ID: {s['id']}, Date: {s['timestamp']}, Customer: {s['customer_name']}")

conn.close()
