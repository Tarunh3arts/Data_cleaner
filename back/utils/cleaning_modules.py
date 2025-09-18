import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
from scipy import stats

def impute_missing(df, method="mean"):
    if method == "mean":
        return df.fillna(df.mean())
    elif method == "median":
        return df.fillna(df.median())
    elif method == "knn":
        imputer = KNNImputer()
        df_imputed = pd.DataFrame(imputer.fit_transform(df), columns=df.columns)
        return df_imputed
    return df

def detect_outliers(df, method="zscore", threshold=3):
    outlier_mask = pd.DataFrame(False, index=df.index, columns=df.columns)
    for col in df.select_dtypes(include=np.number).columns:
        if method == "zscore":
            outlier_mask[col] = np.abs(stats.zscore(df[col].fillna(df[col].mean()))) > threshold
        elif method == "iqr":
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            outlier_mask[col] = ((df[col] < Q1 - 1.5*IQR) | (df[col] > Q3 + 1.5*IQR))
    return outlier_mask

def winsorize(df, limits=(0.05,0.05)):
    from scipy.stats.mstats import winsorize as w
    df_w = df.copy()
    for col in df.select_dtypes(include=np.number).columns:
        df_w[col] = w(df[col].fillna(df[col].mean()), limits=limits)
    return df_w

def apply_weights(df, weights_col):
    df["weighted_sum"] = df.select_dtypes(include=np.number).multiply(df[weights_col], axis=0).sum(axis=1)
    return df
