import pandas as pd

file_path = 'Natraj India Sales Purchase Sample.xlsx'
try:
    xl = pd.ExcelFile(file_path)
    print("Sheet Names:", xl.sheet_names)
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        print(f"\n--- Sheet: {sheet} ---")
        print("Columns:", df.columns.tolist())
        print(df.head())
except Exception as e:
    print(f"Error reading excel: {e}")
