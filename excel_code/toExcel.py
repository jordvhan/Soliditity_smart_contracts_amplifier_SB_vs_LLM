import json
import os
import openpyxl
from openpyxl.styles import Font

# Define input/output paths
coverage_path = os.path.join("..", "hardhat_testing", "coverage.json")
output_excel = "coverage_report.xlsx"

# Load JSON data
with open(coverage_path, "r") as f:
    data = json.load(f)

# Create workbook
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Coverage Report"

# Add header
headers = ["File", "% Stmts", "% Branches", "% Funcs", "% Lines"]
ws.append(headers)

for cell in ws[1]:
    cell.font = Font(bold=True)

def calc_coverage(metric_dict):
    if not isinstance(metric_dict, dict) or len(metric_dict) == 0:
        return 100.0  # Assume full coverage if nothing to measure
    total = len(metric_dict)
    covered = sum(1 for v in metric_dict.values() if isinstance(v, int) and v > 0)
    return round((covered / total) * 100, 2)

# Fill data
for file_path, metrics in data.items():
    file_name = os.path.basename(file_path)  # <-- this strips the path, keeps just the file name

    pct_s = calc_coverage(metrics.get("s", {}))  # Statements
    pct_b = calc_coverage({f"{k}_{i}": x for k, v in metrics.get("b", {}).items() for i, x in enumerate(v)})  # Branches
    pct_f = calc_coverage(metrics.get("f", {}))  # Functions
    pct_l = calc_coverage(metrics.get("l", {}))  # Lines

    ws.append([file_name, pct_s, pct_b, pct_f, pct_l])

# Save Excel file
wb.save(output_excel)
print(f"✅ Excel file written: {output_excel}")
