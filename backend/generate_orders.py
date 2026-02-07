import pandas as pd
import random
from datetime import datetime, timedelta

def generate_orders():
    vendors = [
        {"name": "Apex Trophies", "address": "123 Winner Lane", "mobile": "9998887771", "email": "apex@trophy.com"},
        {"name": "Elite Awards", "address": "456 Champion St", "mobile": "9998887772", "email": "elite@awards.com"}
    ]

    # Order 1
    data1 = []
    vendor1 = vendors[0]
    for i in range(1, 11):
        cost = random.randint(200, 1000)
        data1.append({
            "vendor_name": vendor1["name"],
            "vendor_address": vendor1["address"],
            "vendor_mobile": vendor1["mobile"],
            "vendor_email": vendor1["email"],
            "sku": f"APEX-{100+i}",
            "product_name": f"Apex Cup {i}",
            "category": "Cups",
            "material": "Metal",
            "quantity": random.randint(5, 20),
            "unit_cost": cost,
            "selling_price": cost * 1.6
        })
    
    df1 = pd.DataFrame(data1)
    df1.to_excel("order1.xlsx", index=False)
    print("Generated order1.xlsx")

    # Order 2
    data2 = []
    vendor2 = vendors[1]
    for i in range(1, 11):
        cost = random.randint(500, 2000)
        data2.append({
            "vendor_name": vendor2["name"],
            "vendor_address": vendor2["address"],
            "vendor_mobile": vendor2["mobile"],
            "vendor_email": vendor2["email"],
            "sku": f"ELITE-{200+i}",
            "product_name": f"Elite Plaque {i}",
            "category": "Plaques",
            "material": "Wood",
            "quantity": random.randint(10, 30),
            "unit_cost": cost,
            "selling_price": cost * 1.8
        })

    df2 = pd.DataFrame(data2)
    df2.to_excel("order2.xlsx", index=False)
    print("Generated order2.xlsx")

if __name__ == "__main__":
    generate_orders()
