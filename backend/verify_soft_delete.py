import requests
import pandas as pd
import io

BASE_URL = "http://localhost:8000"

def create_sample_order(filename):
    df = pd.DataFrame({
        'vendor_name': ['TestVendor_SD'],
        'vendor_address': ['123 Test St'],
        'vendor_mobile': ['1234567890'],
        'vendor_email': ['test@test.com'],
        'sku': ['SD_ITEM_001'],
        'quantity': [10],
        'unit_cost': [100],
        'product_name': ['Soft Delete Item'],
        'selling_price': [150],
        'category': ['Test'],
        'material': ['Plastic']
    })
    df.to_excel(filename, index=False)
    print(f"Created {filename}")

def upload_order(filename):
    with open(filename, 'rb') as f:
        files = {'file': (filename, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        response = requests.post(f"{BASE_URL}/import_export/import?import_type=purchase", files=files)
        print(f"Upload {filename}: {response.status_code}")
        return response.json()

def get_stock(sku):
    response = requests.get(f"{BASE_URL}/inventory/")
    items = response.json()
    for item in items:
        if item['sku'] == sku:
            return item['quantity']
    return 0

def get_purchases():
    response = requests.get(f"{BASE_URL}/purchases/")
    return response.json()

def delete_purchase(pid):
    response = requests.delete(f"{BASE_URL}/purchases/{pid}")
    print(f"Delete Purchase {pid}: {response.status_code} - {response.json()}")

def run_test():
    filename = 'verify_sd.xlsx'
    sku = 'SD_ITEM_001'
    
    # 0. Initial State
    initial_stock = get_stock(sku)
    print(f"Initial Stock: {initial_stock}")

    # 1. Create and Upload
    create_sample_order(filename)
    res = upload_order(filename)
    print(res)

    # 2. Check Stock (Should be Initial + 10)
    stock_after_upload = get_stock(sku)
    print(f"Stock after Upload: {stock_after_upload}")
    if stock_after_upload != initial_stock + 10:
        print("ERROR: Stock didn't increase correctly")
    
    # 3. Get Purchase ID
    purchases = get_purchases()
    # Find the purchase for 'TestVendor_SD'
    target_p = None
    for p in purchases:
        if p['vendor_name'] == 'TestVendor_SD':
            target_p = p
            break
    
    if not target_p:
        print("ERROR: Purchase not found")
        return

    pid = target_p['id']
    print(f"Target Purchase ID: {pid}")

    # 4. Soft Delete
    delete_purchase(pid)

    # 5. Check Stock (Should remain Initial + 10)
    stock_after_delete = get_stock(sku)
    print(f"Stock after Delete: {stock_after_delete}")
    if stock_after_delete != stock_after_upload:
        print("ERROR: Stock decreased! Soft Delete failed.")
    else:
        print("SUCCESS: Stock remained unchanged.")

    # 6. Verify Purchase is gone from list
    purchases_after = get_purchases()
    if any(p['id'] == pid for p in purchases_after):
        print("ERROR: Purchase still in list (should be filtered out)")
    else:
        print("SUCCESS: Purchase removed from active list.")

    # 7. Re-upload same file
    print("Re-uploading file...")
    res_reupload = upload_order(filename)
    print(res_reupload)

    # 8. Check Stock (Should STILL be Initial + 10, not 20)
    stock_final = get_stock(sku)
    print(f"Stock Final: {stock_final}")
    
    if stock_final == stock_after_upload:
        print("SUCCESS: Stock did not double count.")
    else:
        print(f"ERROR: Stock changed to {stock_final}. Deduplication failed.")

    # 9. Verify Purchase is back in list
    purchases_final = get_purchases()
    restored_p = next((p for p in purchases_final if p['vendor_name'] == 'TestVendor_SD'), None)
    if restored_p:
        print(f"SUCCESS: Purchase restored (ID: {restored_p['id']})")
    else:
        print("ERROR: Purchase not restored.")

if __name__ == "__main__":
    run_test()
