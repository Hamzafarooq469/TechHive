// components/Charts/ProductCreatedOverTimeChart.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const defaultColor = "#5470C6";
const chartTypes = ["line", "area", "bar"];

const ProductCreatedOverTimeChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [color, setColor] = useState(defaultColor);

  useEffect(() => {
    const fetchCreatedStats = async () => {
      try {
        const res = await axios.get("/product/stats/createdOverTime");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching created over time stats:", err.message);
      }
    };

    fetchCreatedStats();
  }, []);

  const isValidData = Array.isArray(data) && data.length > 0;

  const getOption = () => {
    const baseConfig = {
      title: {
        text: "Products Created Over Time",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c} products",
      },
      xAxis: {
        type: "category",
        data: data.map((item) => item._id),
        name: "Month",
      },
      yAxis: {
        type: "value",
        name: "Products",
      },
    };

    const counts = data.map((item) => item.count);

    if (chartType === "bar") {
      return {
        ...baseConfig,
        series: [
          {
            type: "bar",
            data: counts,
            itemStyle: {
              color,
            },
          },
        ],
      };
    }

    return {
      ...baseConfig,
      series: [
        {
          type: "line",
          data: counts,
          smooth: true,
          areaStyle: chartType === "area" ? {} : null,
          itemStyle: {
            color,
          },
          lineStyle: {
            color,
          },
        },
      ],
    };
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Products Created Over Time</h2>

      {/* Chart Type Switch */}
      <div className="flex gap-4 mb-4">
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-3 py-1 border rounded ${
              chartType === type ? "bg-gray-200 font-bold" : ""
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Color Picker */}
      <div className="mb-4">
        <label className="flex items-center gap-2 font-medium">
          Chart Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 border rounded"
          />
        </label>
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

export default ProductCreatedOverTimeChart;
