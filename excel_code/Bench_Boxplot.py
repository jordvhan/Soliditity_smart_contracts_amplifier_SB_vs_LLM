# Re-import necessary libraries after code execution state reset
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib.ticker as mtick
import matplotlib

matplotlib.use('TkAgg')

# Reload the Excel file after environment reset
file_path = 'boxplottestbenches.xlsx'
bench1_df = pd.read_excel(file_path, sheet_name='Bench1')
bench2_df = pd.read_excel(file_path, sheet_name='Bench2')


# Function to clean and transform data
def prepare_bench_data(df):
    df = df.iloc[2:].copy()
    df.columns = ['File', 'Statements', 'Branches', 'Functions', 'Lines']
    df[['Statements', 'Branches', 'Functions', 'Lines']] = df[['Statements', 'Branches', 'Functions', 'Lines']].astype(
        float)
    long_df = df.melt(id_vars=['File'], var_name='Coverage Type', value_name='Coverage (%)')
    return long_df


# Function to plot
# Updated plot function with manual color palette
def plot_coverage_metrics(data, bench_name="Current Test Bench"):
    plt.figure(figsize=(10, 6))

    # Define custom colors for the four coverage types
    coverage_order = ["Statements", "Branches", "Functions", "Lines"]
    color_palette = {
        "Statements": "#1f77b4",  # blue
        "Branches": "#ff7f0e",  # orange
        "Functions": "#2ca02c",  # green
        "Lines": "#d62728"  # red
    }

    sns.boxplot(
        data=data,
        x='Coverage Type',
        y='Coverage (%)',
        order=coverage_order,
        palette=[color_palette[c] for c in coverage_order]
    )

    plt.title(f'Coverage Metrics – Test {bench_name}')
    plt.ylabel('Coverage in %')
    plt.gca().yaxis.set_major_formatter(mtick.PercentFormatter(decimals=0))
    plt.xlabel('Coverage Type')
    plt.xticks(ticks=[0, 1, 2, 3], labels=["Statement", "Branch", "Function", "Line"])
    plt.tight_layout()
    plt.show()


# Prepare data
bench1_long = prepare_bench_data(bench1_df)
bench2_long = prepare_bench_data(bench2_df)

# Plot results
plot_coverage_metrics(bench1_long, bench_name="Bench 1")
plot_coverage_metrics(bench2_long, bench_name="Bench 2")
