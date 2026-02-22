import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

// Default color palette
const defaultColors = [
  "#5470C6", "#91CC75", "#EE6666", "#FAC858", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#2E8B57",
  "#8A2BE2", "#FF6347", "#20B2AA", "#FFD700", "#FF69B4",
  "#40E0D0", "#FF7F50", "#6A5ACD", "#00CED1", "#FFB6C1"
];

const StockPerProductChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar"); // bar | horizontalBar
  const [colors, setColors] = useState([]);

  useEffect(() => {
    const fetchStockStats = async () => {
      try {
        const res = await axios.get("/product/stats/stockPerProduct");
        if (res.data?.data) {
          setData(res.data.data);
          setColors(
            res.data.data.map((_, index) => defaultColors[index % defaultColors.length])
          );
        }
      } catch (err) {
        console.error("Error fetching stock per product stats:", err.message);
      }
    };

    fetchStockStats();
  }, []);

  const isValidData = Array.isArray(data) && data.length > 0;

  const handleColorChange = (index, newColor) => {
    const updated = [...colors];
    updated[index] = newColor;
    setColors(updated);
  };

  const getOption = () => {
    const labels = data.map((item) => item.name || "Unknown");
    const values = data.map((item) => Number(item.stock) || 0);

    const common = {
      title: { text: "Stock per Product", left: "center" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: "{b}: {c} units",
      },
      series: [
        {
          type: "bar",
          data: values.map((value, index) => ({
            value,
            itemStyle: { color: colors[index] },
          })),
        },
      ],
    };

    if (chartType === "bar") {
      return {
        ...common,
        xAxis: { type: "category", data: labels, name: "Product" },
        yAxis: { type: "value", name: "Stock" },
      };
    } else {
      // horizontal bar
      return {
        ...common,
        xAxis: { type: "value", name: "Stock" },
        yAxis: { type: "category", data: labels, name: "Product" },
      };
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Stock per Product</h2>

      {/* Chart Type Buttons */}
      <div className="flex gap-4 mb-4">
        {["bar", "horizontalBar"].map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-3 py-1 border rounded ${
              chartType === type ? "bg-gray-200 font-bold" : ""
            }`}
          >
            {type === "bar" ? "Bar" : "Horizontal Bar"}
          </button>
        ))}
      </div>

      {/* Color Pickers */}
      <div className="flex flex-wrap gap-4 mb-4">
        {data.map((item, index) => (
          <label key={index} className="flex items-center gap-2">
            <span>{item.name}:</span>
            <input
              type="color"
              value={colors[index]}
              onChange={(e) => handleColorChange(index, e.target.value)}
              className="w-6 h-6 border rounded"
            />
          </label>
        ))}
      </div>

      {/* Chart */}
      {isValidData ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default StockPerProductChart;
