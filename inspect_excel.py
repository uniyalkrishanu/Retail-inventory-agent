import pandas as pd
import os

files = [
    'C:/RetailInventoryData/exports/master/inventory.xlsx',
    'C:/RetailInventoryData/exports/master/customers.xlsx',
    'C:/RetailInventoryData/exports/master/vendors.xlsx',
    'C:/RetailInventoryData/exports/master/purchases.xlsx'
]

for f in files:
    if os.path.exists(f):
        df = pd.read_excel(f)
        print(f"\n--- {os.path.basename(f)} ---")
        print(df.columns.tolist())
        print(df.head(1).to_dict(orient='records'))
    else:
        print(f"\nFile not found: {f}")
