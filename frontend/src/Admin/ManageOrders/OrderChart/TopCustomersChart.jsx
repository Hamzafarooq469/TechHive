
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const chartTypes = ["bar", "pie"];

const TopCustomersChart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");

  const colors = [
    "#5470C6", "#91CC75", "#EE6666", "#FAC858", "#73C0DE",
    "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#FFA07A"
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/order/stats/topCustomers");
        console.log(res.data)
        if (res.data?.data) setData(res.data.data);
      } catch (err) {
        console.error("Error fetching top customers:", err.message);
      }
    };
    fetchStats();
  }, []);

  const getOption = () => {
    const labels = data.map((item) => `${item.name} (${item.email})`);
    const counts = data.map((item) => item.totalOrders);

    if (chartType === "pie") {
      return {
        title: { text: "🏆 Top Customers", left: "center" },
        tooltip: { trigger: "item", formatter: "{b}: {c} orders ({d}%)" },
        legend: { bottom: 10, type: "scroll" },
        series: [
          {
            type: "pie",
            radius: "55%",
            data: data.map((item, i) => ({
              value: item.totalOrders,
              name: `${item.name} (${item.email})`,
              itemStyle: { color: colors[i % colors.length] },
            })),
          },
        ],
      };
    }

    return {
      title: { text: "🏆 Top Customers", left: "center" },
      tooltip: { trigger: "axis", formatter: "{b}: {c} orders" },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value" },
      series: [
        {
          type: "bar",
          data: counts,
          itemStyle: {
            color: (params) => colors[params.dataIndex % colors.length],
          },
        },
      ],
    };
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">🏅 Top Customers (By Orders)</h2>

      {/* Chart type switch */}
      <div className="flex gap-4 mb-6 mt-4 flex-wrap">
        {chartTypes.map((type) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`px-4 py-2 rounded border ${
              chartType === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {type === "bar" && "📊 Bar Chart"}
            {type === "pie" && "🍕 Pie Chart"}
          </button>
        ))}
      </div>

      {/* Chart Display */}
      {data.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 500 }} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default TopCustomersChart;
