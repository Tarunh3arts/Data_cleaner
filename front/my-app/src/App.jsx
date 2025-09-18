import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentCheckIcon, CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon, DocumentTextIcon, ArrowPathIcon, TableCellsIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';

// Configuration for the backend API URL
const API_URL = 'http://localhost:5000';

// --- CSS Styles ---
const Style = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
    :root { --color-cyan-400: #22d3ee; --color-blue-600: #2563eb; }
    body { font-family: 'Inter', sans-serif; background-color: #000; color: #fff; }
    .app-container { min-height: 100vh; background-color: #000; color: #fff; overflow: hidden; position: relative; }
    .gradient-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; }
    .gradient-blob1 { position: absolute; top: -25%; left: -25%; width: 50%; height: 50%; background-color: rgba(6, 182, 212, 0.2); border-radius: 50%; filter: blur(100px); animation: pulse 10s infinite alternate; }
    .gradient-blob2 { position: absolute; bottom: -25%; right: -25%; width: 50%; height: 50%; background-color: rgba(37, 99, 235, 0.2); border-radius: 50%; filter: blur(100px); animation: pulse 12s infinite alternate-reverse; }
    @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(1.2); } }
    .main-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; padding: 2rem; width: 100%; }
    .app-header { text-align: center; margin: 1rem 0 3rem 0; width: 100%; }
    .app-title { font-size: clamp(3rem, 7vw, 5rem); font-weight: 900; letter-spacing: -0.05em; margin-bottom: 1rem; background-clip: text; -webkit-background-clip: text; color: transparent; background-image: linear-gradient(to right, #67e8f9, #3b82f6, #67e8f9); background-size: 200% 200%; animation: gradient-flow 4s linear infinite; }
    @keyframes gradient-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .app-subtitle { max-width: 600px; margin: 0 auto; font-size: 1.125rem; color: #9ca3af; }
    .main-view { width: 100%; max-width: 80rem; flex-grow: 1; display: flex; align-items: center; justify-content: center; }
    /* Action Button */
    .action-button { padding: 0.75rem 1.5rem; font-weight: 600; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.3s ease-in-out; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .action-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-button-primary { background-image: linear-gradient(to right, #22d3ee, #2563eb); color: white; }
    .action-button-secondary { background-color: rgba(55, 65, 81, 0.5); border: 1px solid #4b5563; color: #d1d5db; }
    /* Upload Step */
    .upload-step-container { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 56rem; margin: 0 auto; }
    .dropzone { position: relative; width: 100%; height: 20rem; border-radius: 1.5rem; border: 2px dashed #4b5563; transition: all 0.3s ease; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; background-color: rgba(17, 24, 39, 0.5); }
    .dropzone-active { border-color: #facc15; background-color: rgba(250, 204, 21, 0.1); }
    /* Report Step */
    .report-container { width: 100%; display: flex; flex-direction: column; gap: 2rem; }
    @media (min-width: 1024px) { .report-container { flex-direction: row; } }
    .report-sidebar { width: 100%; min-width: 300px; flex-shrink: 0; }
    @media (min-width: 1024px) { .report-sidebar { width: 25%; } }
    .report-main { flex-grow: 1; min-width: 0; }
    .report-card { background-color: rgba(17, 24, 39, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
    .report-card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #67e8f9; }
    /* Health Score */
    .health-score-container { display: flex; justify-content: space-around; text-align: center; }
    .health-score-value { font-size: 2.5rem; font-weight: 700; }
    .health-score-label { color: #9ca3af; }
    /* Data Preview Table */
    .data-preview { max-height: 400px; overflow: auto; }
    .data-preview table { width: 100%; border-collapse: collapse; }
    .data-preview th, .data-preview td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #374151; white-space: nowrap; transition: background-color 0.3s; }
    .data-preview th { font-weight: 600; position: sticky; top: 0; z-index: 1; background-color: #111827; }
    .cell-outlier, .cell-null { background-color: rgba(239, 68, 68, 0.2) !important; }
    .cell-changed { background-color: rgba(74, 222, 128, 0.2) !important; }
    /* Radio Group for Cleaning Options */
    .radio-group label { display: block; padding: 0.75rem; border-radius: 0.5rem; cursor: pointer; border: 1px solid #374151; margin-bottom: 0.5rem; transition: all 0.2s; }
    .radio-group input:checked + label { background-color: rgba(34, 211, 238, 0.2); border-color: #22d3ee; }
    .radio-group input { display: none; }
    /* Visualization scrolling container */
    .viz-scroll-container { display: flex; overflow-x: auto; padding: 1rem 0; }
    .viz-item { flex: 0 0 400px; margin-right: 1.5rem; }
    .viz-sub-header { font-weight: 500; color: #d1d5db; margin-bottom: 1rem; padding-left: 0.5rem; border-left: 2px solid var(--color-cyan-400); }
  `}</style>
);

// --- Helper & UI Components ---
const ActionButton = ({ onClick, children, variant = 'primary', disabled = false, style }) => ( <motion.button onClick={onClick} className={`action-button action-button-${variant}`} style={style} whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.98 }} disabled={disabled}>{children}</motion.button> );
const ReportCard = ({ title, icon, children }) => ( <div className="report-card"><h3 className="report-card-title">{icon}{title}</h3>{children}</div> );
const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

// --- Main Application Steps ---
const UploadStep = ({ onUploadSuccess, setIsLoading, setError }) => {
    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');
            onUploadSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [onUploadSuccess, setIsLoading, setError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }, multiple: false });

    return (
        <div className="upload-step-container">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}>
                <input {...getInputProps()} />
                <ArrowUpTrayIcon style={{width: '4rem', color: '#6b7280'}}/>
                <h3 style={{fontSize: '1.5rem', fontWeight: 600}}>{isDragActive ? "Drop it like it's hot" : "Drag & drop your dataset"}</h3>
                <p style={{color: '#9ca3af'}}>or click to browse files</p>
            </div>
            <ActionButton onClick={() => document.querySelector('input[type="file"]')?.click()}><DocumentCheckIcon style={{width: '1.25rem'}}/><span>Upload Dataset</span></ActionButton>
        </div>
    );
};

const ReportStep = ({ reportData, onClean, onReset }) => {
    const [cleaningOptions, setCleaningOptions] = useState({ imputationMethod: 'none', outlierMethod: 'none', removeDuplicates: true });
    
    const { before, after, isLoading, outlierIndices } = reportData;
    const currentData = after || before;

    const outlierLookup = useMemo(() => {
        const lookup = new Set();
        if (outlierIndices) {
            outlierIndices.forEach(([rowIndex, colName]) => {
                lookup.add(`${rowIndex}-${colName}`);
            });
        }
        return lookup;
    }, [outlierIndices]);
    
    const areValuesDifferent = (val1, val2) => {
        const v1 = val1 === null || val1 === undefined ? "" : String(val1);
        const v2 = val2 === null || val2 === undefined ? "" : String(val2);
        return v1 !== v2;
    };

    const { barCharts, scatterCharts } = useMemo(() => {
        if (!currentData || !currentData.visualizations) {
            return { barCharts: [], scatterCharts: [] };
        }
        const barCharts = currentData.visualizations.filter(v => v.type === 'bar');
        const scatterCharts = currentData.visualizations.filter(v => v.type === 'scatter');
        return { barCharts, scatterCharts };
    }, [currentData]);

    const renderVisualization = (viz) => {
        if (viz.type === 'bar') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={viz.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                        <XAxis dataKey="name" tick={{fill: '#9ca3af'}} angle={-30} textAnchor="end" height={70} interval={0}/>
                        <YAxis tick={{fill: '#9ca3af'}}/>
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}} 
                            cursor={{fill: 'rgba(255,255,255,0.1)'}}
                            itemStyle={{ color: '#d1d5db' }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Bar dataKey="value" name="Count">
                            {viz.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );
        }
        if (viz.type === 'scatter') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                        <XAxis type="number" dataKey="x" name="Row Index" tick={{ fill: '#9ca3af' }} domain={['dataMin', 'dataMax']}/>
                        <YAxis type="number" dataKey="y" name="Value" tick={{ fill: '#9ca3af' }} domain={['auto', 'auto']}/>
                        {/* FIX: Corrected tooltip text color for scatter plot */}
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            contentStyle={{backgroundColor: '#1f2937', border: '1px solid #374151'}}
                            itemStyle={{ color: '#d1d5db' }}
                            labelStyle={{ color: 'white' }}
                        />
                        <Scatter name={viz.column} data={viz.data} fill="#22d3ee" />
                    </ScatterChart>
                </ResponsiveContainer>
            );
        }
        return null;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="report-container">
            <aside className="report-sidebar">
                <ReportCard title="Cleaning Options" icon={<SparklesIcon style={{width: '1.5rem'}}/>}>
                    <div>
                        <h4 style={{fontWeight: 600, marginBottom: '0.5rem'}}>Handle Missing Values</h4>
                        <div className="radio-group">
                            <input type="radio" id="impute-none" name="imputation" value="none" checked={cleaningOptions.imputationMethod === 'none'} onChange={(e) => setCleaningOptions({...cleaningOptions, imputationMethod: e.target.value})} />
                            <label htmlFor="impute-none">None</label>
                            <input type="radio" id="impute-mean" name="imputation" value="mean" checked={cleaningOptions.imputationMethod === 'mean'} onChange={(e) => setCleaningOptions({...cleaningOptions, imputationMethod: e.target.value})} />
                            <label htmlFor="impute-mean">Impute with Mean</label>
                            <input type="radio" id="impute-median" name="imputation" value="median" checked={cleaningOptions.imputationMethod === 'median'} onChange={(e) => setCleaningOptions({...cleaningOptions, imputationMethod: e.target.value})} />
                            <label htmlFor="impute-median">Impute with Median</label>
                            <input type="radio" id="impute-knn" name="imputation" value="knn" checked={cleaningOptions.imputationMethod === 'knn'} onChange={(e) => setCleaningOptions({...cleaningOptions, imputationMethod: e.target.value})} />
                            <label htmlFor="impute-knn">Impute with KNN</label>
                        </div>
                    </div>
                    <div style={{marginTop: '1.5rem'}}>
                        <h4 style={{fontWeight: 600, marginBottom: '0.5rem'}}>Handle Outliers</h4>
                         <div className="radio-group">
                            <input type="radio" id="outlier-none" name="outlier" value="none" checked={cleaningOptions.outlierMethod === 'none'} onChange={(e) => setCleaningOptions({...cleaningOptions, outlierMethod: e.target.value})} />
                            <label htmlFor="outlier-none">None</label>
                            <input type="radio" id="outlier-iqr" name="outlier" value="iqr" checked={cleaningOptions.outlierMethod === 'iqr'} onChange={(e) => setCleaningOptions({...cleaningOptions, outlierMethod: e.target.value})} />
                            <label htmlFor="outlier-iqr">Cap with Percentiles</label>
                            <input type="radio" id="outlier-zscore" name="outlier" value="zscore" checked={cleaningOptions.outlierMethod === 'zscore'} onChange={(e) => setCleaningOptions({...cleaningOptions, outlierMethod: e.target.value})} />
                            <label htmlFor="outlier-zscore">Cap with Z-Score</label>
                            <input type="radio" id="outlier-winsorization" name="outlier" value="winsorization" checked={cleaningOptions.outlierMethod === 'winsorization'} onChange={(e) => setCleaningOptions({...cleaningOptions, outlierMethod: e.target.value})} />
                            <label htmlFor="outlier-winsorization">Apply Winsorization</label>
                        </div>
                    </div>
                     <div style={{marginTop: '1.5rem'}}>
                        <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}>
                            <input type="checkbox" checked={cleaningOptions.removeDuplicates} onChange={(e) => setCleaningOptions({...cleaningOptions, removeDuplicates: e.target.checked})} style={{width: '1rem', height: '1rem'}}/>
                            Remove Duplicates
                        </label>
                    </div>
                    <ActionButton onClick={() => onClean(cleaningOptions)} variant="primary" disabled={isLoading} style={{width: '100%', marginTop: '1.5rem'}}>
                        {isLoading ? 'Cleaning...' : 'Apply Cleaning'}
                    </ActionButton>
                </ReportCard>
                <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                    <ActionButton onClick={onReset} variant="secondary" style={{flex: 1}}><ArrowPathIcon style={{width: '1.25rem'}}/>New File</ActionButton>
                    <ActionButton onClick={() => window.open(`${API_URL}/download/report`, '_blank')} variant="secondary" style={{flex: 1}}><DocumentTextIcon style={{width: '1.25rem'}}/>PDF Report</ActionButton>
                </div>
            </aside>
            <main className="report-main">
                <ReportCard title="Data Health" icon={<SparklesIcon style={{width: '1.5rem'}}/>}>
                    <div className="health-score-container">
                        <div>
                            <p className="health-score-value" style={{color: '#f87171'}}>{before.stats.health_score}%</p>
                            <p className="health-score-label">Before</p>
                        </div>
                        {after && (
                            <div>
                                <p className="health-score-value" style={{color: '#4ade80'}}>{after.stats_after.health_score}%</p>
                                <p className="health-score-label">After</p>
                            </div>
                        )}
                    </div>
                </ReportCard>
                 <ReportCard title="Data Preview" icon={<TableCellsIcon style={{width: '1.5rem'}}/>}>
                    <div className="data-preview">
                        <table>
                            <thead><tr>{currentData.preview.columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
                            <tbody>
                                {currentData.preview.data.map((row, rowIndex) => {
                                    const originalRowIndex = currentData.preview.indices[rowIndex];
                                    return (
                                        <tr key={originalRowIndex}>
                                            {currentData.preview.columns.map(col => {
                                                const cellValue = row[col];
                                                let className = '';
                                                const isNull = cellValue === null || cellValue === undefined;

                                                if (after && after.original_preview && after.original_preview.data[rowIndex]) {
                                                    const originalValue = after.original_preview.data[rowIndex][col];
                                                    if (areValuesDifferent(originalValue, cellValue)) {
                                                        className = 'cell-changed';
                                                    }
                                                } else if (outlierLookup.has(`${originalRowIndex}-${col}`)) {
                                                    className = 'cell-outlier';
                                                } else if (isNull) {
                                                    className = 'cell-null';
                                                }
                                                return <td key={col} className={className}>{isNull ? <i>null</i> : String(cellValue)}</td>
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </ReportCard>
                <ReportCard title="Visualizations" icon={<ChartBarIcon style={{width: '1.5rem'}}/>}>
                    {barCharts.length > 0 && (
                        <>
                            <h4 className="viz-sub-header">Categorical Data</h4>
                            <div className="viz-scroll-container">
                                {barCharts.map(viz => (
                                    <div key={viz.column} className="viz-item">
                                        <h5 style={{fontWeight: 500, marginBottom: '1rem', textAlign: 'center'}}>{viz.column}</h5>
                                        {renderVisualization(viz)}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {scatterCharts.length > 0 && (
                         <>
                            <h4 className="viz-sub-header" style={{marginTop: '2rem'}}>Numerical Data</h4>
                            <div className="viz-scroll-container">
                                {scatterCharts.map(viz => (
                                    <div key={viz.column} className="viz-item">
                                        <h5 style={{fontWeight: 500, marginBottom: '1rem', textAlign: 'center'}}>{viz.column}</h5>
                                        {renderVisualization(viz)}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {barCharts.length === 0 && scatterCharts.length === 0 && (
                        <p style={{color: '#9ca3af', textAlign: 'center'}}>No visualizations could be generated for this dataset.</p>
                    )}
                </ReportCard>
            </main>
        </motion.div>
    );
};

// --- Main App Component ---
const DataCleanerApp = () => {
    const [step, setStep] = useState('upload'); // upload, report
    const [reportData, setReportData] = useState({ before: null, after: null, isLoading: false, outlierIndices: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUploadSuccess = (data) => {
        setReportData({ before: data, after: null, isLoading: false, outlierIndices: data.outlier_indices });
        setStep('report');
    };

    const handleClean = async (options) => {
        setReportData(prev => ({ ...prev, isLoading: true }));
        setError('');
        try {
            const response = await fetch(`${API_URL}/clean`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Cleaning failed');
            setReportData(prev => ({ ...prev, after: data, isLoading: false }));
        } catch (err) {
            setError(err.message);
            setReportData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleReset = async () => {
        try {
            await fetch(`${API_URL}/reset`, { method: 'POST' });
        } catch(e) { console.error("Reset failed", e) }
        setStep('upload');
        setReportData({ before: null, after: null, isLoading: false, outlierIndices: [] });
        setError('');
    };
    
    return (
        <>
            <Style />
            <div className="app-container">
                <div className="gradient-background"><div className="gradient-blob1"></div><div className="gradient-blob2"></div></div>
                <div className="main-content">
                    <header className="app-header">
                        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="app-title">DataCleaner</motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="app-subtitle">
                            Transform your raw datasets into clean, analysis-ready data with advanced cleaning algorithms and comprehensive reporting.
                        </motion.p>
                    </header>
                    {error && <div style={{color: '#f87171', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem'}}>{error}</div>}
                    {isLoading && <div style={{color: '#facc15', marginBottom: '1rem'}}>Loading...</div>}
                    <main className="main-view">
                        <AnimatePresence mode="wait">
                            {step === 'upload' && <UploadStep key="upload" onUploadSuccess={handleUploadSuccess} setIsLoading={setIsLoading} setError={setError} />}
                            {reportData.before && step === 'report' && <ReportStep key="report" reportData={reportData} onClean={handleClean} onReset={handleReset} />}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </>
    );
};

export default DataCleanerApp;

