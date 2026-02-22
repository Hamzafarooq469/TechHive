import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const chartTypes = ["bar", "horizontal", "pie"];

// 🎨 Default color palette (20 unique colors)
const defaultColors = [
  "#5470C6", "#91CC75", "#EE6666", "#FAC858", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#FFA07A",
  "#40E0D0", "#DA70D6", "#FF6347", "#87CEEB", "#20B2AA",
  "#B0C4DE", "#00CED1", "#FF69B4", "#708090", "#FFD700"
];

const RevenueByCityChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/order/stats/revenueByCity");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch revenue by city:", err.message);
      }
    };
    fetchData();
  }, []);

  const getOption = () => {
    const labels = data.map((item) => item._id);
    const values = data.map((item) => item.totalRevenue);

    if (chartType === "pie") {
      return {
        title: { text: "💰 Revenue by City", left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: ${c} ({d}%)" },
        legend: { bottom: 10, type: "scroll" },
        series: [
          {
            type: "pie",
            radius: "55%",
            data: data.map((item, idx) => ({
              value: item.totalRevenue,
              name: item._id,
              itemStyle: { color: defaultColors[idx % defaultColors.length] },
            })),
          },
        ],
      };
    }

    return {
      title: { text: "💰 Revenue by City", left: "center" },
      tooltip: { trigger: "axis", formatter: "{b}: ${c}" },
      xAxis:
        chartType === "horizontal"
          ? { type: "value", name: "Revenue" }
          : { type: "category", data: labels, axisLabel: { rotate: 45 } },
      yAxis:
        chartType === "horizontal"
          ? { type: "category", data: labels }
          : { type: "value", name: "Revenue" },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: {
            color: (params) => defaultColors[params.dataIndex % defaultColors.length],
          },
        },
      ],
    };
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">🏙️ Revenue by City</h2>

      <div className="flex gap-4 mb-6 mt-4 flex-wrap">
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded border ${
              chartType === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {type === "bar" && "📊 Vertical Bar"}
            {type === "horizontal" && "📊 Horizontal Bar"}
            {type === "pie" && "🍕 Pie Chart"}
          </button>
        ))}
      </div>

      {data.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 500 }} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default RevenueByCityChart;
