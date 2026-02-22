import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const defaultColors = ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE", "#3BA272"];

const UserCreatedOverTimeChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [colors, setColors] = useState([...defaultColors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/user/stats/createdOverTime");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching user stats:", err.message);
      }
    };
    fetchData();
  }, []);

  const getOption = () => {
    const labels = data.map((item) => item._id);
    const counts = data.map((item) => item.count);

    const baseSeries = {
      data: counts,
      itemStyle: {
        color: (params) => colors[params.dataIndex % colors.length],
      },
      smooth: true,
    };

    const baseOptions = {
      title: { text: "Users Created Over Time", left: "center" },
      tooltip: { trigger: "axis", formatter: "{b}: {c} users" },
      xAxis: { type: "category", data: labels, name: "Month" },
      yAxis: { type: "value", name: "Users" },
    };

    if (chartType === "line") {
      return {
        ...baseOptions,
        series: [{ ...baseSeries, type: "line", areaStyle: {} }],
      };
    }

    if (chartType === "horizontal") {
      return {
        ...baseOptions,
        xAxis: { type: "value", name: "Users" },
        yAxis: { type: "category", data: labels, name: "Month" },
        series: [{ ...baseSeries, type: "bar" }],
      };
    }

    return {
      ...baseOptions,
      series: [{ ...baseSeries, type: "bar" }],
    };
  };

  const handleColorChange = (index, color) => {
    const updated = [...colors];
    updated[index] = color;
    setColors(updated);
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Users Created Over Time</h2>

      {/* Chart Type Buttons */}
      <div className="flex gap-4 mb-6 mt-4">
        {["bar", "horizontal", "line"].map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded border ${
              chartType === type ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {type === "bar" && "📊 Vertical Bar"}
            {type === "horizontal" && "📊 Horizontal Bar"}
            {type === "line" && "📈 Line Chart"}
          </button>
        ))}
      </div>

      {/* Color Pickers */}
      <div className="flex flex-wrap gap-6 mb-6 mt-6">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-sm">{item._id}:</span>
            <input
              type="color"
              value={colors[idx % colors.length]}
              onChange={(e) => handleColorChange(idx, e.target.value)}
              className="w-6 h-6"
            />
          </div>
        ))}
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default UserCreatedOverTimeChart;
