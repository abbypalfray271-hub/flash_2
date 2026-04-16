import openpyxl
import json
import os

path = r"D:\二三言\小学1-6\按年级分类\小学3年级\文言文-3上\04 小学文言文·小古文·中华经典寓言故事《司马光救友》（课本《司马光》）\语句导入模板_《司马光》.xlsx"

try:
    wb = openpyxl.load_workbook(path, data_only=True)
    sheet = wb.active
    
    rows = []
    for row in sheet.iter_rows(min_row=1, max_row=10, values_only=True):
        rows.append(row)
    
    print("--- EXCEL DATA START ---")
    print(json.dumps(rows, ensure_ascii=False, indent=2))
    print("--- EXCEL DATA END ---")
except Exception as e:
    print(f"Error reading excel: {e}")
