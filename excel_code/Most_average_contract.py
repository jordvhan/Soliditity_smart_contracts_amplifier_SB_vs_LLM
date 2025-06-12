import pandas as pd

# Load the Excel file
file_path = "amplification_results.xlsx"  # Update this path if necessary
xls = pd.ExcelFile(file_path)

# Load the relevant sheet
#df = xls.parse('Test Bench 1')
df = xls.parse('Test Bench 2')

# Drop rows with no data and reset index
df_cleaned = df.dropna(how='all').reset_index(drop=True)

# Assume the third row (index 2) is the first data row, and second row (index 1) contains column headers
df_data = df_cleaned.iloc[2:].copy()
df_data.columns = df_cleaned.iloc[1]  # Set proper headers
df_data = df_data.rename(columns={"File": "filename"})

# Ensure all columns except 'filename' have unique names
new_columns = ['filename'] + [f"{col}_{i}" for i, col in enumerate(df_data.columns[1:], start=1)]
df_data.columns = new_columns

# Convert numeric columns to float
for col in df_data.columns[1:]:
    df_data[col] = pd.to_numeric(df_data[col], errors='coerce')

# Remove 'Average' row if it exists
df_data = df_data[df_data["filename"] != "Average"]

# Compute the mean vector of the numeric data
mean_vector = df_data.iloc[:, 1:].mean()

# Compute Euclidean distance of each row to the mean vector
df_data["distance_to_mean"] = df_data.iloc[:, 1:].sub(mean_vector).pow(2).sum(axis=1).pow(0.5)

# Find the contract with the smallest distance to the mean
most_representative_contract = df_data.loc[df_data["distance_to_mean"].idxmin()]
print("Most representative contract:", most_representative_contract["filename"])
