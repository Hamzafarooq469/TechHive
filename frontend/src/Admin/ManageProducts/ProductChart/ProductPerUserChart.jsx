
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const chartTypes = ["bar", "horizontal", "pie", "doughnut"];
const defaultColors = ["#91CC75", "#FAC858", "#5470C6", "#EE6666", "#73C0DE"];

const ProductsPerUserChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [colors, setColors] = useState(defaultColors);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/product/stats/productsPerUser");
        console.log(res.data)
        if (res.data?.data) setData(res.data.data);
      } catch (err) {
        console.error("Error fetching product per user stats:", err.message);
      }
    };
    fetchData();
  }, []);

  const isValidData = Array.isArray(data) && data.length > 0;

  const getOption = () => {
    const labels = data.map((item) => item.user || "Unknown");
    const counts = data.map((item) => item.count);

    const seriesData = labels.map((label, i) => ({
      name: label,
      value: counts[i],
      itemStyle: { color: colors[i % colors.length] }
    }));

    if (chartType === "pie" || chartType === "doughnut") {
      return {
        title: {
          text: "Products Per User",
          left: "center"
        },
        tooltip: {
          trigger: "item",
          formatter: "{b}: {c} products ({d}%)"
        },
        legend: {
          orient: "vertical",
          left: "left"
        },
        series: [
          {
            name: "Products",
            type: "pie",
            radius: chartType === "doughnut" ? ["40%", "70%"] : "60%",
            data: seriesData
          }
        ]
      };
    }

    return {
      title: {
        text: "Products Per User",
        left: "center"
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c} products"
      },
      xAxis: {
        type: chartType === "horizontal" ? "value" : "category",
        data: chartType === "horizontal" ? undefined : labels,
        name: chartType === "horizontal" ? undefined : "Users"
      },
      yAxis: {
        type: chartType === "horizontal" ? "category" : "value",
        data: chartType === "horizontal" ? labels : undefined,
        name: "Products"
      },
      series: [
        {
          type: "bar",
          data: counts,
          itemStyle: {
            color: (params) => colors[params.dataIndex % colors.length]
          },
          label: {
            show: true,
            position: chartType === "horizontal" ? "right" : "top"
          }
        }
      ]
    };
  };

  const handleColorChange = (index, value) => {
    const updated = [...colors];
    updated[index] = value;
    setColors(updated);
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Products Per User</h2>

      {/* Chart Type Selector */}
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

      {/* Color Pickers */}
      <div className="flex flex-wrap gap-4 mb-4">
        {data.map((item, i) => (
          <label key={i} className="flex items-center gap-2">
            <span>{item.user}</span>
            <input
              type="color"
              value={colors[i % colors.length]}
              onChange={(e) => handleColorChange(i, e.target.value)}
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

export default ProductsPerUserChart;
