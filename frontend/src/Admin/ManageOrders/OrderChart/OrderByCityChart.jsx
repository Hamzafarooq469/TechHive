import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const defaultColors = [
  "#5470C6", "#91CC75", "#EE6666", "#FAC858", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#2E8B57",
  "#8A2BE2", "#FF6347", "#20B2AA", "#FFD700", "#FF69B4",
  "#40E0D0", "#FF7F50", "#6A5ACD", "#00CED1", "#FFB6C1",
  "#CD5C5C", "#6495ED", "#FFA500", "#DC143C", "#7B68EE"
];

const chartTypes = ["bar", "horizontal", "pie"];

const OrdersByCityChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/order/stats/ordersByCity");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching orders by city:", err.message);
      }
    };
    fetchStats();
  }, []);

  const getOption = () => {
      const labels = data.map((item) => item._id);
      const counts = data.map((item) => item.count);

    if (chartType === "pie") {
      return {
        title: { text: "Orders by City", left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: {c} orders ({d}%)" },
        legend: { bottom: 10, type: "scroll", orient: "horizontal" },
        series: [
          {
            type: "pie",
            radius: "55%",
            data: data.map((item, idx) => ({
              value: item.count,
              name: item._id,
              itemStyle: { color: defaultColors[idx % defaultColors.length] },
            })),
          },
        ],
      };
    }

    const base = {
      title: { text: "Orders by City", left: "center" },
      tooltip: { trigger: "axis", formatter: "{b}: {c} orders" },
      xAxis:
        chartType === "horizontal"
          ? { type: "value", name: "Orders" }
          : {
              type: "category",
              data: labels,
              name: "City",
              axisLabel: { rotate: 45 },
            },
      yAxis:
        chartType === "horizontal"
          ? {
              type: "category",
              data: labels,
              name: "City",
              axisLabel: { interval: 0 },
            }
          : { type: "value", name: "Orders" },
      series: [
        {
          type: "bar",
          data: counts,
          itemStyle: {
            color: (params) => defaultColors[params.dataIndex % defaultColors.length],
          },
        },
      ],
    };

    return base;
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">📍 Orders by City</h2>

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
            {type === "bar" && "📊 Vertical Bar"}
            {type === "horizontal" && "📊 Horizontal Bar"}
            {type === "pie" && "🍕 Pie Chart"}
          </button>
        ))}
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 500 }} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default OrdersByCityChart;
