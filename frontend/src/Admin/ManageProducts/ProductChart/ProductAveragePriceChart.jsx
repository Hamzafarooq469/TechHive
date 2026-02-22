import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const defaultColors = [
  "#3BA272", // green
  "#5470C6", // blue
  "#FAC858", // yellow
  "#EE6666", // red
  "#91CC75", // light green
  "#73C0DE", // teal
  "#FC8452", // orange
  "#9A60B4", // purple
  "#EA7CCC", // pink
  "#6E7074", // gray
  "#FF9F7F", // coral
  "#00C1D4"  // cyan
];

const ProductAveragePriceChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("pie");
  const [colors, setColors] = useState([...defaultColors]);

  useEffect(() => {
    const fetchAverageStats = async () => {
      try {
        const res = await axios.get("/product/stats/averagePriceCategory");
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching average price stats:", err.message);
      }
    };
    fetchAverageStats();
  }, []);

  const isValidData =
    Array.isArray(data) &&
    data.length > 0 &&
    data.every((item) => typeof item.averagePrice === "number");

  const handleColorChange = (index, newColor) => {
    const updatedColors = [...colors];
    updatedColors[index] = newColor;
    setColors(updatedColors);
  };

  const getOption = () => {
    const labels = data.map((item) => item._id || "Unknown");

    const seriesData = data.map((item, index) => ({
      value: Number(item.averagePrice) || 0,
      name: item._id || "Unknown",
      itemStyle: { color: colors[index % colors.length] }
    }));

    switch (chartType) {
      case "pie":
        return {
          title: { text: "Average Price per Category (Pie)", left: "center" },
          tooltip: { trigger: "item", formatter: "{b}: ${c} ({d}%)" },
          legend: { orient: "vertical", left: "left" },
          series: [
            {
              type: "pie",
              radius: "50%",
              data: seriesData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)"
                }
              }
            }
          ]
        };

      case "bar":
        return {
          title: { text: "Average Price per Category (Bar)", left: "center" },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: "{b}: ${c}"
          },
          xAxis: {
            type: "category",
            data: labels
          },
          yAxis: {
            type: "value"
          },
          series: [
            {
              type: "bar",
              data: data.map((item) => Number(item.averagePrice) || 0),
              itemStyle: {
                color: (params) =>
                  colors[params.dataIndex % colors.length]
              }
            }
          ]
        };

      case "doughnut":
        return {
          title: {
            text: "Average Price per Category (Doughnut)",
            left: "center"
          },
          tooltip: { trigger: "item", formatter: "{b}: ${c} ({d}%)" },
          legend: { orient: "vertical", left: "left" },
          series: [
            {
              type: "pie",
              radius: ["40%", "70%"],
              data: seriesData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)"
                }
              }
            }
          ]
        };

      default:
        return {};
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Average Price per Category</h2>

      <div className="flex gap-4 mb-4">
        {["pie", "bar", "doughnut"].map((type) => (
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

      <div className="flex flex-wrap gap-4 mb-4">
        {data.map((item, index) => (
          <label key={index} className="flex items-center gap-2">
            <span>{item._id || "Unknown"}:</span>
            <input
              type="color"
              value={colors[index % colors.length]}
              onChange={(e) => handleColorChange(index, e.target.value)}
              className="w-6 h-6 border rounded"
            />
          </label>
        ))}
      </div>

      {isValidData ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default ProductAveragePriceChart;
