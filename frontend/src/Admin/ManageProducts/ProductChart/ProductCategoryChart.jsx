import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const ProductCategoryChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("pie");

  const [colors, setColors] = useState([
    "#3BA272", "#5470C6", "#FAC858", "#EE6666",
    "#91CC75", "#73C0DE", "#FC8452", "#9A60B4",
    "#EA7CCC", "#6E7074", "#FF9F7F", "#00C1D4"
  ]);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        const res = await axios.get("/product/stats/category");
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching category stats:", err.message);
      }
    };
    fetchCategoryStats();
  }, []);

  const isValidData = Array.isArray(data) && data.length > 0;

  const handleColorChange = (index, newColor) => {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    setColors(updatedColors);
  };

  const getOption = () => {
    const labels = data.map((item) => item._id || "Unknown");
    const values = data.map((item) => item.count || 0);
    const appliedColors = colors.slice(0, data.length);

    const basePieConfig = {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: "Categories",
          type: "pie",
          data: data.map((item, index) => ({
            value: item.count,
            name: item._id || "Unknown",
            itemStyle: {
              color: appliedColors[index % appliedColors.length],
            },
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };

    switch (chartType) {
      case "pie":
        return {
          title: { text: "Products by Category (Pie)", left: "center" },
          ...basePieConfig,
          series: [{ ...basePieConfig.series[0], radius: "50%" }],
        };

      case "doughnut":
        return {
          title: { text: "Products by Category (Doughnut)", left: "center" },
          ...basePieConfig,
          series: [{ ...basePieConfig.series[0], radius: ["40%", "70%"] }],
        };

      case "bar":
        return {
          title: { text: "Products by Category (Bar)", left: "center" },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: "{b}: {c}",
          },
          xAxis: { type: "category", data: labels },
          yAxis: { type: "value" },
          series: [
            {
              data: values,
              type: "bar",
              itemStyle: {
                color: (params) =>
                  appliedColors[params.dataIndex % appliedColors.length],
              },
            },
          ],
        };

      default:
        return {};
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Product Categories Chart</h2>

      {/* Chart type toggle buttons */}
      <div className="flex gap-4 mb-4">
        {["pie", "bar", "doughnut"].map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-1 rounded ${
              chartType === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Horizontal color pickers */}
      <div className="flex flex-wrap gap-4 mb-4">
        {data.map((item, index) => (
          <label key={index} className="flex items-center gap-2">
            <span className="text-sm">{item._id || "Unknown"}:</span>
            <input
              type="color"
              value={colors[index % colors.length]}
              onChange={(e) => handleColorChange(index, e.target.value)}
              className="w-6 h-6 border rounded"
            />
          </label>
        ))}
      </div>

      {/* Chart rendering */}
      {isValidData ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default ProductCategoryChart;
