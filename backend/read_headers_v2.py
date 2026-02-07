import pandas as pd

file_path = 'Natraj India Sales Purchase Sample.xlsx'
try:
    # Based on previous output, row 0 in DF was headers. So file header is likely row 1 (0-indexed)
    xl = pd.ExcelFile(file_path)
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        # Header is row 1
        df = pd.read_excel(file_path, sheet_name=sheet, header=1, nrows=10) 
        print(df.to_string())
except Exception as e:
    print(f"Error reading excel: {e}")
