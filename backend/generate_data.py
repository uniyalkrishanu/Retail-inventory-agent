import pandas as pd
import random

def generate_data():
    vendors = []
    for i in range(1, 16):
        vendors.append({
            "name": f"Trophy Supplier {chr(64+i)}",
            "address": f"{random.randint(100, 999)} Industrial Area, City {chr(64+i)}",
            "mobile": f"9876543{i:03d}",
            "email": f"contact@supplier{chr(64+i).lower()}.com"
        })

    categories = ["Cups", "Medals", "Plaques", "Shields", "Crystal"]
    materials = ["Gold", "Silver", "Bronze", "Wood", "Glass", "Acrylic"]

    data = []
    for i in range(1, 51):
        vendor = random.choice(vendors)
        category = random.choice(categories)
        material = random.choice(materials)
        cost = random.randint(100, 5000)
        
        data.append({
            "vendor_name": vendor["name"],
            "vendor_address": vendor["address"],
            "vendor_mobile": vendor["mobile"],
            "vendor_email": vendor["email"],
            "sku": f"SKU-{1000+i}",
            "product_name": f"{material} {category} - {i}",
            "category": category,
            "material": material,
            "quantity": random.randint(10, 100),
            "unit_cost": cost,
            "selling_price": cost * 1.5, # 50% margin
        })

    df = pd.DataFrame(data)
    df.to_excel("inventory_purchase.xlsx", index=False)
    print("Generated inventory_purchase.xlsx with 50 records.")

if __name__ == "__main__":
    generate_data()
