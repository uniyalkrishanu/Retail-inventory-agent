import pandas as pd

# Create Purchase Order Template
purchase_data = {
    'vendor_name': ['Example Vendor', 'Example Vendor'],
    'vendor_address': ['123 Main Street', '123 Main Street'],
    'vendor_mobile': ['9876543210', '9876543210'],
    'vendor_email': ['vendor@example.com', 'vendor@example.com'],
    'invoice_number': ['INV-001', 'INV-001'],
    'sku': ['TRP-001', 'TRP-002'],
    'product_name': ['Gold Trophy 12 inch', 'Silver Medal'],
    'quantity': [50, 100],
    'unit_cost': [150.00, 50.00],
    'selling_price': [250.00, 85.00],
    'category': ['Trophies', 'Medals'],
    'material': ['Metal', 'Metal']
}
pd.DataFrame(purchase_data).to_excel('templates/purchase_order_template.xlsx', index=False)
print("Created purchase_order_template.xlsx")

# Create Inventory Template
inventory_data = {
    'name': ['Gold Trophy 12 inch', 'Silver Medal', 'Bronze Cup'],
    'sku': ['TRP-001', 'MDL-001', 'CUP-001'],
    'quantity': [100, 200, 50],
    'cost_price': [150.00, 50.00, 80.00],
    'selling_price': [250.00, 85.00, 130.00],
    'category': ['Trophies', 'Medals', 'Cups'],
    'material': ['Metal', 'Metal', 'Brass'],
    'min_stock_level': [10, 20, 5]
}
pd.DataFrame(inventory_data).to_excel('templates/inventory_template.xlsx', index=False)
print("Created inventory_template.xlsx")

print("Templates created successfully!")
