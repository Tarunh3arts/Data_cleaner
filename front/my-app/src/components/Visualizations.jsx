import React from "react";
import Plot from "react-plotly.js";

export default function Visualizations({ reportData }) {
  if (!reportData) return null;

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4">Visualizations</h2>
      <Plot
        data={[
          {
            x: reportData.columns,
            y: reportData.sum,
            type: "bar",
            marker: { color: "rgba(255, 99, 71, 0.6)" },
          },
        ]}
        layout={{ width: 700, height: 400, title: "Summary Metrics" }}
      />
    </div>
  );
}
