from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
from scipy import stats
from scipy.stats.mstats import winsorize
import os
import json
from datetime import datetime
import io
import zipfile
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import matplotlib
matplotlib.use('Agg') # Use a non-interactive backend for server environments
import matplotlib.pyplot as plt
import seaborn as sns
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
REPORTS_FOLDER = 'reports'
CHARTS_FOLDER = 'charts'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

# --- Directory Setup ---
for folder in [UPLOAD_FOLDER, REPORTS_FOLDER, CHARTS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

def allowed_file(filename):
    """Checks if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Custom JSON Encoder for NumPy types ---
class NpEncoder(json.JSONEncoder):
    """ Custom encoder for numpy data types """
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            if np.isnan(obj):
                return None
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if pd.isna(obj):
            return None
        return super(NpEncoder, self).default(obj)

app.json_encoder = NpEncoder

# --- Main DataCleaner Class ---
class AdvancedDataCleaner:
    def __init__(self):
        self.original_data = None
        self.cleaned_data = None
        self.cleaning_log = []
        self.stats_before = {}
        self.stats_after = {}
        self.outliers_info = {}
        self.missing_info = {}
        self.missing_tokens = {"", "na", "n/a", "nan", "null", "none", "unknown", "error"}

    def _normalize_missing_values(self, df):
        """Normalize common missing-value tokens to NaN for object columns."""
        object_cols = df.select_dtypes(include=['object']).columns
        for col in object_cols:
            series = df[col]
            mask = series.astype(str).str.strip().str.lower().isin(self.missing_tokens)
            if mask.any():
                df.loc[mask, col] = np.nan

    def _coerce_numeric_columns(self, df, threshold=0.6):
        """Coerce object columns to numeric when mostly numeric."""
        object_cols = df.select_dtypes(include=['object']).columns
        for col in object_cols:
            series = df[col]
            non_null_count = series.notna().sum()
            if non_null_count == 0:
                continue
            numeric_series = pd.to_numeric(series, errors='coerce')
            numeric_count = numeric_series.notna().sum()
            if numeric_count / non_null_count >= threshold:
                df[col] = numeric_series

    def load_data(self, file_path):
        """Loads and performs initial analysis on the dataset."""
        try:
            file_extension = file_path.rsplit('.', 1)[1].lower()
            if file_extension == 'csv':
                self.original_data = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip')
            else:
                self.original_data = pd.read_excel(file_path)
            
            self.original_data.columns = [str(col).strip() for col in self.original_data.columns]
            self._normalize_missing_values(self.original_data)
            self._coerce_numeric_columns(self.original_data)
            self.cleaned_data = self.original_data.copy()
            self.analyze_data_quality(is_before=True)
            self.log_action(f"Data loaded: {len(self.original_data)} rows, {len(self.original_data.columns)} columns")
            return True
        except Exception as e:
            self.log_action(f"Error loading data: {str(e)}")
            return False

    def analyze_data_quality(self, is_before=True):
        """Performs a comprehensive data quality analysis."""
        df = self.original_data if is_before else self.cleaned_data
        health_score = self.calculate_health_score(df)
        stats_dict = {
            'total_rows': len(df),
            'total_columns': len(df.columns),
            'missing_values': int(df.isnull().sum().sum()),
            'duplicate_rows': int(df.duplicated().sum()),
            'health_score': health_score
        }
        
        if is_before:
            self.stats_before = stats_dict
            self.missing_info = {col: {'count': int(df[col].isnull().sum())} for col in df.columns if df[col].isnull().sum() > 0}
            self.outliers_info = self._detect_outliers_info(df)
        else:
            self.stats_after = stats_dict

    def calculate_health_score(self, df):
        """Calculates a health score for the dataset."""
        if df.empty: return 0
        completeness = 1 - (df.isnull().sum().sum() / (df.size or 1))
        uniqueness = 1 - (df.duplicated().sum() / (len(df) or 1))
        health_score = (completeness * 0.7) + (uniqueness * 0.3)
        return round(health_score * 100, 2)

    def _calculate_mad_bounds(self, series):
        """Calculates outlier bounds using the robust Median Absolute Deviation (MAD) method."""
        if series.count() < 3: return None, None
        median = series.median()
        mad = (series - median).abs().median()
        if mad == 0: return None, None
        
        # FIX: Reduced multiplier from 3.5 to 2.5 for more aggressive outlier capping
        upper_bound = median + 2.5 * mad / 0.6745
        lower_bound = median - 2.5 * mad / 0.6745
        return lower_bound, upper_bound

    def _detect_outliers_info(self, df):
        """Helper to detect outlier counts for analysis using MAD."""
        outliers_info = {}
        numeric_cols = df.select_dtypes(include=np.number).columns
        for col in numeric_cols:
            lower, upper = self._calculate_mad_bounds(df[col].dropna())
            if lower is not None:
                count = int(((df[col] < lower) | (df[col] > upper)).sum())
                if count > 0:
                    outliers_info[col] = {'count': count}
        return outliers_info
        
    def get_outlier_indices_for_preview(self, df):
        """Identifies the [row, column_name] coordinates of outliers for the preview using MAD."""
        outlier_indices = []
        preview_df = df.head(100)
        numeric_cols = preview_df.select_dtypes(include=np.number).columns
        for col in numeric_cols:
            series = preview_df[col].dropna()
            if not series.empty:
                lower, upper = self._calculate_mad_bounds(series)
                if lower is not None:
                    outlier_rows = preview_df.index[(preview_df[col] < lower) | (preview_df[col] > upper)].tolist()
                    for row_idx in outlier_rows:
                        outlier_indices.append([row_idx, col])
        return outlier_indices

    def log_action(self, action):
        self.cleaning_log.append({'timestamp': datetime.now().isoformat(), 'action': action})

    def run_cleaning(self, options):
        """Executes the selected cleaning operations and rounds results."""
        self._normalize_missing_values(self.cleaned_data)
        self._coerce_numeric_columns(self.cleaned_data)
        initial_rows = len(self.cleaned_data)
        initial_missing = self.cleaned_data.isnull().sum().sum()
        initial_duplicates = self.cleaned_data.duplicated().sum()
        
        numeric_cols = self.cleaned_data.select_dtypes(include=np.number).columns
        original_int_cols = [col for col in numeric_cols if pd.api.types.is_integer_dtype(self.cleaned_data[col].dropna())]

        imputation_method = options.get('imputationMethod')
        if imputation_method == 'mean':
            self.cleaned_data[numeric_cols] = self.cleaned_data[numeric_cols].fillna(self.cleaned_data[numeric_cols].mean())
            self.log_action("Applied mean imputation.")
        elif imputation_method == 'median':
            self.cleaned_data[numeric_cols] = self.cleaned_data[numeric_cols].fillna(self.cleaned_data[numeric_cols].median())
            self.log_action("Applied median imputation.")
        elif imputation_method == 'knn':
            if not self.cleaned_data[numeric_cols].empty and self.cleaned_data[numeric_cols].isnull().sum().sum() > 0:
                imputer = KNNImputer(n_neighbors=5)
                imputed_data = imputer.fit_transform(self.cleaned_data[numeric_cols])
                self.cleaned_data[numeric_cols] = pd.DataFrame(imputed_data, index=self.cleaned_data[numeric_cols].index, columns=numeric_cols)
                self.log_action("Applied KNN imputation.")

        outlier_method = options.get('outlierMethod')
        if outlier_method == 'iqr': 
            for col in numeric_cols:
                series = self.cleaned_data[col].dropna()
                if not series.empty:
                    lower_bound, upper_bound = self._calculate_mad_bounds(series)
                    if lower_bound is not None:
                        self.cleaned_data[col] = self.cleaned_data[col].clip(lower_bound, upper_bound)
            self.log_action("Capped outliers using the robust MAD method.")
        elif outlier_method == 'zscore':
            for col in numeric_cols:
                if self.cleaned_data[col].count() > 0:
                    mean = self.cleaned_data[col].mean()
                    std = self.cleaned_data[col].std()
                    lower_bound = mean - 3 * std
                    upper_bound = mean + 3 * std
                    self.cleaned_data[col] = self.cleaned_data[col].clip(lower_bound, upper_bound)
            self.log_action("Capped outliers using the Z-Score method.")
        elif outlier_method == 'winsorization':
            for col in numeric_cols:
                 if self.cleaned_data[col].count() > 0:
                    non_null_series = self.cleaned_data[col].dropna()
                    if not non_null_series.empty:
                        winsorized_values = winsorize(non_null_series, limits=[0.05, 0.05])
                        self.cleaned_data.loc[non_null_series.index, col] = winsorized_values
            self.log_action("Applied Winsorization to outliers.")

        for col in numeric_cols:
            if self.cleaned_data[col].count() > 0:
                if col in original_int_cols:
                    self.cleaned_data[col] = self.cleaned_data[col].round().astype('Int64')
                else:
                    self.cleaned_data[col] = self.cleaned_data[col].round(1)
        if any([imputation_method != 'none', outlier_method != 'none']):
            self.log_action("Rounded numerical columns.")
    
        if options.get('removeDuplicates'):
            if initial_duplicates > 0:
                self.cleaned_data.drop_duplicates(inplace=True, keep='first')
                self.log_action(f"Removed {initial_duplicates} duplicate rows.")

        final_rows = len(self.cleaned_data)
        final_missing = self.cleaned_data.isnull().sum().sum()
        
        self.analyze_data_quality(is_before=False)
        
        return {
            'rows_removed': int(initial_rows - final_rows),
            'missing_fixed': int(initial_missing - final_missing),
            'duplicates_fixed': int(initial_duplicates)
        }

    def get_visualization_data(self, df):
        """Generates data suitable for frontend charting libraries."""
        viz_data = []
        numeric_cols = df.select_dtypes(include=np.number).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns

        for col in categorical_cols:
            if 1 < df[col].nunique() <= 30:
                counts = df[col].value_counts().nlargest(10)
                viz_data.append({ 'type': 'bar', 'column': col, 'data': [{'name': str(k), 'value': int(v)} for k, v in counts.items()] })
        
        for col in numeric_cols:
            if df[col].nunique() > 1:
                scatter_data = df[[col]].dropna().reset_index().head(500)
                viz_data.append({ 'type': 'scatter', 'column': col, 'data': [{'x': int(row['index']), 'y': float(row[col])} for index, row in scatter_data.iterrows()] })
        return viz_data

    def generate_visualizations_for_pdf(self):
        """Generates multiple smaller chart images to prevent oversized flowables in PDF."""
        plt.style.use('dark_background')
        numeric_cols = self.cleaned_data.select_dtypes(include=np.number).columns
        if len(numeric_cols) == 0: return []

        chart_paths = []
        COLS_PER_CHART = 2
        
        for i in range(0, len(numeric_cols), COLS_PER_CHART):
            chunk_cols = numeric_cols[i:i + COLS_PER_CHART]
            fig, axes = plt.subplots(len(chunk_cols), 1, figsize=(8, 4 * len(chunk_cols)))
            if len(chunk_cols) == 1: axes = [axes]
            fig.patch.set_facecolor('#111827')

            for j, col in enumerate(chunk_cols):
                sns.histplot(self.cleaned_data[col].dropna(), ax=axes[j], kde=True, color="cyan")
                axes[j].set_title(f'Distribution of {col}', color='white')
                axes[j].tick_params(colors='white')
            
            plt.tight_layout()
            chart_path = os.path.join(CHARTS_FOLDER, f'pdf_report_{datetime.now().strftime("%Y%m%d%H%M%S")}_{i}.png')
            plt.savefig(chart_path, dpi=100, facecolor='#111827')
            plt.close(fig)
            chart_paths.append(chart_path)
        return chart_paths

# --- Global State ---
cleaner = AdvancedDataCleaner()

# --- API Endpoints ---
@app.route('/upload', methods=['POST'])
def upload_file_route():
    global cleaner
    cleaner = AdvancedDataCleaner()
    if 'file' not in request.files: return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename): return jsonify({'error': 'Invalid file'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        if cleaner.load_data(filepath):
            preview_df = cleaner.original_data.head(100).replace({np.nan: None})
            outlier_indices = cleaner.get_outlier_indices_for_preview(cleaner.original_data)
            return jsonify({
                'stats': cleaner.stats_before,
                'missing_info': cleaner.missing_info,
                'outliers_info': cleaner.outliers_info,
                'preview': {'columns': list(cleaner.original_data.columns), 'data': preview_df.to_dict(orient='records'), 'indices': preview_df.index.tolist()},
                'visualizations': cleaner.get_visualization_data(cleaner.original_data),
                'outlier_indices': outlier_indices
            })
        else:
            return jsonify({'error': 'Failed to load or process file'}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/clean', methods=['POST'])
def clean_data_route():
    if cleaner.original_data is None: return jsonify({'error': 'No data uploaded'}), 400
    options = request.json
    
    original_preview_df = cleaner.cleaned_data.head(100).copy(deep=True).replace({np.nan: None})

    summary = cleaner.run_cleaning(options)
    
    cleaned_preview_df = cleaner.cleaned_data.head(100).replace({np.nan: None})
    return jsonify({
        'summary': summary,
        'stats_before': cleaner.stats_before,
        'stats_after': cleaner.stats_after,
        'preview': {'columns': list(cleaner.cleaned_data.columns), 'data': cleaned_preview_df.to_dict(orient='records'), 'indices': cleaned_preview_df.index.tolist()},
        'original_preview': {'data': original_preview_df.to_dict(orient='records'), 'indices': original_preview_df.index.tolist()},
        'visualizations': cleaner.get_visualization_data(cleaner.cleaned_data)
    })

@app.route('/download/report', methods=['GET'])
def download_report_route():
    if cleaner.cleaned_data is None: return jsonify({'error': 'No data for report'}), 400
    try:
        chart_paths = cleaner.generate_visualizations_for_pdf()
        report_buffer = io.BytesIO()
        doc = SimpleDocTemplate(report_buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Data Cleaning Report", styles['h1']))
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Health Score Summary", styles['h2']))
        health_data = [['', 'Before', 'After'], ['Health Score', f"{cleaner.stats_before['health_score']}%", f"{cleaner.stats_after['health_score']}%"]]
        story.append(Table(health_data))
        story.append(Spacer(1, 0.2 * inch))
        stats_data = [['Metric', 'Before', 'After'], ['Total Rows', cleaner.stats_before['total_rows'], cleaner.stats_after['total_rows']], ['Missing Values', cleaner.stats_before['missing_values'], cleaner.stats_after['missing_values']], ['Duplicate Rows', cleaner.stats_before['duplicate_rows'], cleaner.stats_after['duplicate_rows']]]
        table = Table(stats_data)
        table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.grey), ('GRID', (0,0), (-1,-1), 1, colors.black)]))
        story.append(table)
        story.append(Spacer(1, 0.2 * inch))
        
        if chart_paths:
            story.append(Paragraph("Cleaned Data Distributions", styles['h2']))
            for chart_path in chart_paths:
                if os.path.exists(chart_path):
                    img = Image(chart_path, width=6*inch, height=4*inch, kind='proportional')
                    story.append(img)
                    story.append(PageBreak())
        
        story.append(Paragraph("Cleaning Log", styles['h2']))
        for entry in cleaner.cleaning_log: story.append(Paragraph(f"- {entry['action']}", styles['Normal']))
        doc.build(story)
        report_buffer.seek(0)
        return send_file(report_buffer, mimetype='application/pdf', as_attachment=True, download_name='data_cleaning_report.pdf')
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500

@app.route('/reset', methods=['POST'])
def reset_session():
    global cleaner
    cleaner = AdvancedDataCleaner()
    # Also clean up files
    for folder in [UPLOAD_FOLDER, REPORTS_FOLDER, CHARTS_FOLDER]:
        for filename in os.listdir(folder):
            try:
                os.remove(os.path.join(folder, filename))
            except OSError:
                pass # Ignore if file is already gone
    return jsonify({'message': 'Session reset successfully'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

