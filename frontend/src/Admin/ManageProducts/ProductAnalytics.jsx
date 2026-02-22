
import React, { useState } from "react";
import ProductAveragePriceChart from "./ProductChart/ProductAveragePriceChart";
import ProductCategoryChart from "./ProductChart/ProductCategoryChart";
import ProductCreatedOverTimeChart from "./ProductChart/ProductCreatedOverTimeChart";
// import ProductsPerUser from "./ProductChart/ProductPerUserChart";
import ProductUpdatedOverTimeChart from "./ProductChart/ProductUpdatedOverTimeChart";
import StockPerProductChart from "./ProductChart/StockPerProductChart";
// import TopExpensiveProducts from "./TopExpensiveProducts";

const chartOptions = [
  { key: "avgPrice", label: "📊 Avg Price Per Category", component: ProductAveragePriceChart },
  { key: "categoryDist", label: "📈 Category Distribution", component: ProductCategoryChart },
  { key: "createdOverTime", label: "📆 Created Over Time", component: ProductCreatedOverTimeChart },
  // { key: "perUser", label: "👤 Products Per User", component: ProductsPerUser },
  { key: "updatedOverTime", label: "🛠️ Updated Over Time", component: ProductUpdatedOverTimeChart },
  { key: "stock", label: "📦 Stock Per Product", component: StockPerProductChart },
//   { key: "expensive", label: "💰 Top Expensive Products", component: TopExpensiveProducts },
];

const ProductAnalytics = () => {
  const [activeChart, setActiveChart] = useState(chartOptions[0].key);

  const ActiveComponent = chartOptions.find((c) => c.key === activeChart)?.component;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Product Analytics</h1>
      <div className="flex flex-wrap gap-3 mb-6">
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

export default ProductAnalytics;
