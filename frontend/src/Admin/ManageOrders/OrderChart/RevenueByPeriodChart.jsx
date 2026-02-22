import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const periods = ["day", "month", "quarter", "year"];

// Default solid colors (20 visually distinct)
const defaultColors = [
  "#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE",
  "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC", "#FF9F7F",
  "#B1BA00", "#FF8C00", "#8B0000", "#008080", "#20B2AA",
  "#5F9EA0", "#4682B4", "#9ACD32", "#FFD700", "#6495ED",
];

const RevenueByPeriodChart = () => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/order/stats/revenueByPeriod");
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching revenue by period:", err.message);
      }
    };
    fetchData();
  }, [period]);

  const chartData = data?.[period] || [];

  const getOption = () => ({
    title: {
      text: `📈 Revenue by ${period[0].toUpperCase() + period.slice(1)}`,
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}: ${c}",
    },
    xAxis: {
      type: "category",
      data: chartData.map((item) => item.label),
      axisLabel: { rotate: 45 },
    },
    yAxis: {
      type: "value",
      name: "Revenue ($)",
    },
    series: [
      {
        data: chartData.map((item) => item.total),
        type: "bar",
        itemStyle: {
          color: (params) =>
            defaultColors[params.dataIndex % defaultColors.length],
        },
      },
    ],
  });

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">📆 Revenue by Period</h2>

      <div className="flex gap-4 mb-6 mt-2 flex-wrap">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded border ${
              period === p ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {chartData.length > 0 ? (
        <ReactECharts option={getOption()} style={{ height: 500 }} />
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default RevenueByPeriodChart;
