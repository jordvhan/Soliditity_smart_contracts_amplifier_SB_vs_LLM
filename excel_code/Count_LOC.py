import os
import pandas as pd

# Path to your contract folder
folder_path = "../hardhat_testing/contracts bench2"

# Prepare data
data = []

# Loop over .sol files and count lines
for filename in os.listdir(folder_path):
    if filename.endswith(".sol"):
        file_path = os.path.join(folder_path, filename)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            line_count = len(lines)
            data.append({"File": filename, "Number of Lines": line_count})

# Convert to DataFrame
df = pd.DataFrame(data)

# Sort by filename if needed
df = df.sort_values(by="File")

# Save to Excel
output_path = "contract_line_counts.xlsx"
df.to_excel(output_path, index=False)

print(f"Saved line counts to {output_path}")
