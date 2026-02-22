import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

// Define default color palette (20 colors)
const defaultColors = [
  "#5470C6", "#91CC75", "#EE6666", "#FAC858", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#D2B48C",
  "#A0522D", "#20B2AA", "#FF7F50", "#4682B4", "#6A5ACD",
  "#8FBC8F", "#CD5C5C", "#FFD700", "#40E0D0", "#BDB76B"
];

const chartTypes = ["line", "area", "bar"];

const OrdersOverTimeChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("line");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/order/stats/ordersOverTime");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching orders over time:", err.message);
      }
    };
    fetchStats();
  }, []);

  const getOption = () => {
    const labels = data.map((item) => item._id);
    const counts = data.map((item) => item.count);

    return {
      title: { text: "📆 Orders Over Time", left: "center" },
      tooltip: { trigger: "axis", formatter: "{b}: {c} orders" },
      xAxis: { type: "category", data: labels, name: "Time" },
      yAxis: { type: "value", name: "Orders" },
      series: [
        {
          type: chartType === "area" ? "line" : chartType,
          data: counts,
          smooth: true,
          areaStyle: chartType === "area" ? {} : null,
          itemStyle: {
            color: (params) =>
              defaultColors[params.dataIndex % defaultColors.length],
          },
          lineStyle: { color: defaultColors[0] }, // consistent color for line/area
        },
      ],
    };
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">📦 Orders Over Time</h2>

      {/* Chart type buttons */}
      <div className="flex gap-4 mb-6 mt-4 flex-wrap">
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded border ${
              chartType === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {type === "line" && "📈 Line Chart"}
            {type === "bar" && "📊 Bar Chart"}
            {type === "area" && "🌊 Area Chart"}
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

export default OrdersOverTimeChart;
