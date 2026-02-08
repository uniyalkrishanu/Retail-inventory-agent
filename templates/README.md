# Template Files for Import

This folder contains sample Excel templates that you can use to import data into the system.

## Available Templates

### 1. purchase_order_template.xlsx
Use this template to import purchase orders from vendors.

**Required Columns:**
| Column | Description | Example |
|--------|-------------|---------|
| vendor_name | Name of the vendor | "ABC Traders" |
| sku | Product SKU code | "TRP-001" |
| quantity | Number of items purchased | 50 |
| unit_cost | Cost per unit (₹) | 150.00 |

**Optional Columns:**
| Column | Description |
|--------|-------------|
| vendor_address | Vendor's address |
| vendor_mobile | Vendor's phone number |
| vendor_email | Vendor's email |
| invoice_number | Invoice reference number |
| product_name | Name for new products |
| selling_price | Selling price for new products |
| category | Product category |
| material | Product material |

---

### 2. inventory_template.xlsx
Use this template to bulk update inventory items.

**Required Columns:**
| Column | Description | Example |
|--------|-------------|---------|
| name | Product name | "Gold Trophy 12 inch" |
| sku | Unique SKU code | "GT-12" |
| quantity | Current stock | 100 |
| cost_price | Cost price (₹) | 200.00 |
| selling_price | Selling price (₹) | 350.00 |

**Optional Columns:**
| Column | Description |
|--------|-------------|
| category | Product category |
| material | Material type |
| min_stock_level | Low stock alert threshold |

---

## How to Use

1. Download the template you need
2. Fill in your data following the column format
3. Save the file as .xlsx
4. Go to the application and use the Import feature
5. Select the appropriate import type (Purchase Order / Inventory)
6. Upload your file

## Notes
- Do not change column names
- SKU must be unique for each product
- Leave optional columns empty if not needed
