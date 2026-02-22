import React, { useState } from "react";

import OrderByCityChart from "./OrderChart/OrderByCityChart"
import OrdersOverTimeChart from "./OrderChart/OrdersOverTimeChart";
import GuestVsRegisteredUser from "./OrderChart/GuestVsRegisteredCharts"
import TopCustomersChart from "./OrderChart/TopCustomersChart";
import RevenueByCityChart from "./OrderChart/RevenueByCityChart";
import RevenueByPeriodChart from "./OrderChart/RevenueByPeriodChart";



const chartOptions = [
  { key: "orderByCity", label: "Orders by City", component: OrderByCityChart },
  { key: "ordersTime", label: " Orders Over Time", component: OrdersOverTimeChart },
  { key: "GuestVsRegistered", label: " Guest vs Registered", component: GuestVsRegisteredUser },
  { key: "TopCustomersChart", label: " Top Customers", component: TopCustomersChart },
  { key: "RevenueByCityChart", label: " Revenue by City", component: RevenueByCityChart },
  { key: "RevenueByPeriodChart", label: " Revenue by Period", component: RevenueByPeriodChart },
];


const OrderAnalytics = () => {
  const [activeChart, setActiveChart] = useState(chartOptions[0].key);
  const ActiveComponent = chartOptions.find((c) => c.key === activeChart)?.component;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6"> Order Analytics</h1>

      <div className="flex flex-wrap gap-3 mb-6 mt-2">
        {chartOptions.map((chart) => (
          <button
            key={chart.key}
            className={`px-4 py-2 rounded ${
              activeChart === chart.key ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setActiveChart(chart.key)}
          >
            {chart.label}
          </button>
        ))}
      </div>

      <div className="bg-white shadow rounded p-4">
        {ActiveComponent ? <ActiveComponent /> : <p>No chart selected</p>}
      </div>
    </div>
  );
};

export default OrderAnalytics;
