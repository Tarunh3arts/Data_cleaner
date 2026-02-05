# Data Cleaner 🧹✨

A powerful web-based data cleaning and analysis tool built with Flask and React that helps you clean, analyze, and visualize your datasets with ease. Upload CSV or Excel files, perform advanced data cleaning operations, and download comprehensive reports.

## 🌟 Features

### Data Processing
- **File Upload**: Support for CSV, XLSX, and XLS file formats
- **Missing Value Handling**: Multiple imputation methods (Mean, Median, KNN)
- **Outlier Detection & Treatment**: IQR (MAD-based), Z-Score, and Winsorization methods
- **Duplicate Removal**: Automatic detection and removal of duplicate rows
- **Smart Type Inference**: Automatic detection and conversion of numeric columns
- **Data Normalization**: Handles common missing value tokens (na, n/a, null, none, etc.)

### Analysis & Visualization
- **Data Quality Metrics**: Calculate health scores based on completeness and uniqueness
- **Interactive Preview**: View first 100 rows with outlier highlighting
- **Visual Analytics**: Bar charts for categorical data and scatter plots for numeric data
- **Before/After Comparison**: Side-by-side comparison of data before and after cleaning

### Reporting
- **PDF Reports**: Generate comprehensive cleaning reports with visualizations
- **Cleaning Logs**: Detailed logs of all cleaning operations performed
- **Statistical Summary**: Before and after statistics including missing values, duplicates, and health scores
- **Distribution Charts**: Visualize cleaned data distributions

## 🛠️ Technology Stack

### Backend
- **Flask**: Web framework for Python
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **Scikit-learn**: Machine learning for KNN imputation
- **Matplotlib & Seaborn**: Data visualization
- **ReportLab**: PDF report generation
- **Flask-CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Recharts**: Charting library
- **Framer Motion**: Animation library
- **Axios**: HTTP client
- **Heroicons**: Icon library
- **React Dropzone**: File upload component
- **TailwindCSS**: Utility-first CSS framework

## 📋 Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn package manager

## 🚀 Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd back
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python main.py
```

The backend server will start at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd front/my-app
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend application will start at `http://localhost:5173` (or the next available port)

## 💡 Usage

1. **Upload Data**: Drag and drop or click to upload a CSV/Excel file
2. **Review Analysis**: View initial data quality metrics, missing values, and outliers
3. **Configure Cleaning**: Select cleaning options:
   - Choose imputation method for missing values
   - Select outlier handling method
   - Enable duplicate removal
4. **Clean Data**: Click "Clean Data" to apply selected operations
5. **Review Results**: View cleaned data preview and updated statistics
6. **Download Report**: Generate and download a comprehensive PDF report

## 📁 Project Structure

```
Data_cleaner/
├── back/                      # Backend (Flask API)
│   ├── main.py               # Main Flask application
│   ├── requirements.txt      # Python dependencies
│   ├── charts/               # Generated chart images
│   ├── uploads/              # Uploaded data files
│   ├── reports/              # Generated PDF reports
│   └── utils/                # Utility modules
│       ├── cleaning_modules.py
│       └── data_processing.py
├── front/                     # Frontend (React)
│   └── my-app/
│       ├── src/
│       │   ├── App.jsx       # Main application component
│       │   ├── components/   # React components
│       │   └── styles/       # CSS styles
│       ├── public/           # Static assets
│       ├── package.json      # Node.js dependencies
│       └── vite.config.js    # Vite configuration
├── DS/                        # Sample datasets
│   ├── Cola.xlsx
│   └── dirty_cafe_sales.csv
├── package.json              # Root package configuration
└── README.md                 # This file
```

## 🔌 API Endpoints

### POST `/upload`
Upload a data file for cleaning
- **Request**: Multipart form data with file
- **Response**: Initial data analysis, statistics, and preview

### POST `/clean`
Clean the uploaded data with specified options
- **Request**: JSON with cleaning options
  ```json
  {
    "imputationMethod": "mean|median|knn|none",
    "outlierMethod": "iqr|zscore|winsorization|none",
    "removeDuplicates": true|false
  }
  ```
- **Response**: Cleaned data preview, statistics, and summary

### GET `/download/report`
Download a PDF report of the cleaning session
- **Response**: PDF file with cleaning report

### POST `/reset`
Reset the current cleaning session
- **Response**: Success message

## 🧪 Data Cleaning Methods

### Missing Value Imputation
- **Mean**: Replace missing values with column mean
- **Median**: Replace missing values with column median (robust to outliers)
- **KNN**: Use K-Nearest Neighbors algorithm for intelligent imputation

### Outlier Handling
- **IQR Method**: Despite the name, this option uses Median Absolute Deviation (MAD) for robust outlier detection and capping (see Note below)
- **Z-Score**: Standard score method (mean ± 3 standard deviations)
- **Winsorization**: Cap extreme values at 5th and 95th percentiles

> **Note**: The API accepts `"outlierMethod": "iqr"` but internally implements MAD (Median Absolute Deviation) algorithm, which is a robust statistical method for outlier detection.

## 🎨 Features in Detail

### Health Score Calculation
The health score is computed based on:
- **Completeness (70%)**: Percentage of non-missing values
- **Uniqueness (30%)**: Percentage of non-duplicate rows
- Score ranges from 0-100%

### Smart Data Processing
- Automatically detects and normalizes common missing value tokens
- Identifies columns that should be numeric based on content
- Rounds integer columns after imputation to maintain data type
- Preserves decimal precision for float columns

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available for educational and commercial use.

## 👥 Authors

Built with ❤️ by the Data Cleaner team

## 🐛 Known Issues

- Large files (>100MB) may take longer to process
- PDF generation is limited to numeric column distributions

## 🔮 Future Enhancements

- [ ] Support for more file formats (JSON, Parquet)
- [ ] Advanced feature engineering capabilities
- [ ] Machine learning model integration
- [ ] Real-time collaborative cleaning
- [ ] Cloud storage integration
- [ ] Custom cleaning rule creation

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Note**: This application is designed for data cleaning and analysis purposes. Always review the cleaned data before using it in production environments.
