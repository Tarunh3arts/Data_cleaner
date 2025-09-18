import React from "react";

export default function CleaningConfig({ config, setConfig }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Cleaning Configuration</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Missing Value Method:</label>
          <select
            className="text-black w-full p-2 rounded"
            value={config.missing_method || ""}
            onChange={(e) => setConfig({ ...config, missing_method: e.target.value })}
          >
            <option value="mean">Mean</option>
            <option value="median">Median</option>
            <option value="knn">KNN</option>
          </select>
        </div>

        <div>
          <label>Outlier Detection:</label>
          <select
            className="text-black w-full p-2 rounded"
            value={config.outlier_method || ""}
            onChange={(e) => setConfig({ ...config, outlier_method: e.target.value })}
          >
            <option value="zscore">Z-Score</option>
            <option value="iqr">IQR</option>
          </select>
        </div>

        <div>
          <label>Winsorize Outliers:</label>
          <input
            type="checkbox"
            checked={config.winsorize || false}
            onChange={(e) => setConfig({ ...config, winsorize: e.target.checked })}
          />
        </div>

        <div>
          <label>Weights Column:</label>
          <input
            type="text"
            className="text-black w-full p-2 rounded"
            value={config.weights_col || ""}
            onChange={(e) => setConfig({ ...config, weights_col: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
