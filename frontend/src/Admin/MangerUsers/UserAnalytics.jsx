
import React, { useState } from "react";
import UsersCreatedOverTimeChart from "./UserChart/UserCreatedOverTime";
// import RoleDistributionChart from "../Charts/UserRoleDistributionChart"; // Optional future chart

const chartOptions = [
  {
    key: "usersCreatedOverTime",
    label: "📅 Users Created Over Time",
    component: UsersCreatedOverTimeChart,
  },
  // {
  //   key: "roleDistribution",
  //   label: "🧑‍💼 Role Distribution",
  //   component: RoleDistributionChart,
  // },
];

const UserAnalytics = () => {
  const [activeChart, setActiveChart] = useState(chartOptions[0].key);

  const ActiveComponent = chartOptions.find((c) => c.key === activeChart)?.component;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👥 User Analytics</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        {chartOptions.map((chart) => (
          <button
            key={chart.key}
            onClick={() => setActiveChart(chart.key)}
            className={`px-4 py-2 rounded ${
              activeChart === chart.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
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

export default UserAnalytics;
