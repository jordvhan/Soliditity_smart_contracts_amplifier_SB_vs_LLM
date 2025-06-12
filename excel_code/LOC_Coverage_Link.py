import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib

matplotlib.use('TkAgg')

# Load Excel file with proper header row
excel_path = "Boxplot+LOC.xlsx"  # Adjust path if needed
bench1_df = pd.read_excel(excel_path, sheet_name="Bench1", header=2)
bench2_df = pd.read_excel(excel_path, sheet_name="Bench2", header=2)

# choose coverage type
coverageTypes = ['% Stmts', '% Branches', '% Funcs', '% Lines']
coverageType = coverageTypes[3]

# Keep relevant columns and drop rows with missing values
bench1_df = bench1_df[['File', coverageType, 'LOC']].dropna()
bench2_df = bench2_df[['File', coverageType, 'LOC']].dropna()

# Convert to numeric types (if not already)
bench1_df[coverageType] = pd.to_numeric(bench1_df[coverageType], errors='coerce')
bench1_df['LOC'] = pd.to_numeric(bench1_df['LOC'], errors='coerce')
bench2_df[coverageType] = pd.to_numeric(bench2_df[coverageType], errors='coerce')
bench2_df['LOC'] = pd.to_numeric(bench2_df['LOC'], errors='coerce')

# Drop any rows with NaNs after conversion
bench1_df.dropna(subset=[coverageType, 'LOC'], inplace=True)
bench2_df.dropna(subset=[coverageType, 'LOC'], inplace=True)

# Plot Bench1
plt.figure(figsize=(10, 6))
sns.scatterplot(data=bench1_df, x='LOC', y=coverageType)
plt.title('Bench1: ' + coverageType + ' Coverage vs Lines of Code')
plt.xlabel('Lines of Code')
plt.ylabel(coverageType)
plt.grid(True)
plt.tight_layout()
plt.show()

# Plot Bench2
plt.figure(figsize=(10, 6))
sns.scatterplot(data=bench2_df, x='LOC', y=coverageType, color='orange')
plt.title('Bench2: ' + coverageType + ' Coverage vs Lines of Code')
plt.xlabel('Lines of Code')
plt.ylabel(coverageType)
plt.grid(True)
plt.tight_layout()
plt.show()
