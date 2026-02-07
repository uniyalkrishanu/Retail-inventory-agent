import requests
import time

BASE_URL = "http://localhost:8000"

def test_ledger():
    print("\n--- Testing Customer Ledger ---")
    
    # 1. Create Customer
    customer_data = {
        "name": f"LedgerTest User {int(time.time())}",
        "mobile": "555-0199",
        "current_balance": 0.0
    }
    r = requests.post(f"{BASE_URL}/customers/", json=customer_data)
    if r.status_code != 200:
        print(f"Failed to create customer: {r.text}")
        return
    
    customer = r.json()
    cid = customer['id']
    print(f"Created Customer: {customer['name']} (ID: {cid}, Balance: {customer['current_balance']})")
    
    # 2. Get Inventory Item (Create if needed or pick existing)
    if not (items := requests.get(f"{BASE_URL}/inventory/").json()):
         # Create dummy item
         item_data = {
             "name": "Test Item Ledger",
             "sku": f"LEDGER-SKU-{int(time.time())}",
             "selling_price": 100.0,
             "cost_price": 50.0,
             "quantity": 100
         }
         r = requests.post(f"{BASE_URL}/inventory/", json=item_data)
         item = r.json()
    else:
        item = items[0]
        # Ensure stock
        if item['quantity'] < 10:
             requests.put(f"{BASE_URL}/inventory/{item['id']}", json={**item, "quantity": 100})
             item['quantity'] = 100

    print(f"Selling Item: {item['name']} @ {item['selling_price']}")

    # 3. Create Sale (Paid)
    sale_paid = {
        "customer_id": cid,
        "payment_status": "Paid",
        "items": [{"trophy_id": item['id'], "quantity": 1}]
    }
    r = requests.post(f"{BASE_URL}/sales/", json=sale_paid)
    assert r.status_code == 200
    
    # Check Balance (Should be 0)
    c_check = requests.get(f"{BASE_URL}/customers/{cid}").json()
    print(f"Balance after PAID sale: {c_check['current_balance']}")
    assert c_check['current_balance'] == 0.0

    # 4. Create Sale (Due)
    sale_due = {
        "customer_id": cid,
        "payment_status": "Due",
        "items": [{"trophy_id": item['id'], "quantity": 2}]
    }
    r = requests.post(f"{BASE_URL}/sales/", json=sale_due)
    assert r.status_code == 200
    
    # Check Balance (Should be -2 * 100 = -200)
    c_check = requests.get(f"{BASE_URL}/customers/{cid}").json()
    print(f"Balance after DUE sale: {c_check['current_balance']}")
    expected_bal = -(2 * item['selling_price'])
    assert c_check['current_balance'] == expected_bal

    print("Ledger Test Passed!")

def test_inventory_search():
    print("\n--- Testing Inventory Search ---")
    # Search for "Test" or part of the name created above
    term = "Item"
    r = requests.get(f"{BASE_URL}/inventory/?search={term}")
    results = r.json()
    print(f"Search for '{term}' found {len(results)} items")
    assert len(results) > 0
    assert term.lower() in results[0]['name'].lower()
    
    print("Search Test Passed!")

if __name__ == "__main__":
    try:
        test_ledger()
        test_inventory_search()
        print("\nAll Backend Tests Passed!")
    except Exception as e:
        print(f"\nTests FAILED: {e}")
