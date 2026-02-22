import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const chartTypes = ["pie", "donut", "bar", "horizontal"];

const GuestVsRegisteredChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("pie");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/order/stats/guestVsRegistered");
        if (res.data?.data) setData(res.data.data);
      } catch (err) {
        console.error("Error fetching guest vs registered:", err.message);
      }
    };
    fetchStats();
  }, []);

  const colors = ["#91CC75", "#5470C6"];

  const getOption = () => {
    const labels = data.map((item) => item.type);
    const values = data.map((item) => item.count);

    // Pie & Donut
    if (chartType === "pie" || chartType === "donut") {
      return {
        title: {
          text: "👤 Guest vs Registered Orders",
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{b}: {c} orders ({d}%)",
        },
        legend: {
          bottom: 10,
          orient: "horizontal",
        },
        series: [
          {
            type: "pie",
            radius: chartType === "donut" ? ["40%", "60%"] : "55%",
            data: data.map((item, idx) => ({
              value: item.count,
              name: item.type,
              itemStyle: { color: colors[idx % colors.length] },
            })),
          },
        ],
      };
    }

    // Bar or Horizontal Bar
    return {
      title: {
        text: "👤 Guest vs Registered Orders",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        formatter: "{b}: {c} orders",
      },
      xAxis:
        chartType === "horizontal"
          ? { type: "value", name: "Orders" }
          : { type: "category", data: labels, name: "User Type" },
      yAxis:
        chartType === "horizontal"
          ? { type: "category", data: labels, name: "User Type" }
          : { type: "value", name: "Orders" },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: {
            color: (params) => colors[params.dataIndex % colors.length],
          },
        },
      ],
    };
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">🧍‍♂️ Guest vs Registered Orders</h2>

      {/* Chart type toggle */}
      <div className="flex gap-4 mb-6 mt-4 flex-wrap">
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded border ${
              chartType === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {type === "pie" && "🍕 Pie"}
            {type === "donut" && "🍩 Donut"}
            {type === "bar" && "📊 Bar"}
            {type === "horizontal" && "📊 Horizontal Bar"}
          </button>
        ))}
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default GuestVsRegisteredChart;
