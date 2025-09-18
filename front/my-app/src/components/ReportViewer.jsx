import React from "react";

export default function ReportViewer({ reportData }) {
  if (!reportData) return null;

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4">Report</h2>
      <pre className="bg-black/20 p-4 rounded text-sm overflow-auto">{JSON.stringify(reportData, null, 2)}</pre>
    </div>
  );
}
