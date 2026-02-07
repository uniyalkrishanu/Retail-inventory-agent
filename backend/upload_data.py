import requests

url = "http://localhost:8000/import_export/import?import_type=purchase"
files = {'file': open('inventory_purchase.xlsx', 'rb')}

try:
    response = requests.post(url, files=files)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
