import pandas as pd
from .cleaning_modules import impute_missing, detect_outliers, winsorize, apply_weights

def process_data(file_path, config):
    # Load data
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)
    
    # Apply missing value imputation
    df = impute_missing(df, config.get("missing_method", "mean"))
    
    # Handle outliers
    outliers = detect_outliers(df, config.get("outlier_method", "zscore"))
    df = winsorize(df) if config.get("winsorize", False) else df
    
    # Apply weights
    if config.get("weights_col"):
        df = apply_weights(df, config["weights_col"])
    
    return df, outliers
