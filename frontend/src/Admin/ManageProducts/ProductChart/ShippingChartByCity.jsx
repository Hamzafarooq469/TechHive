import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";

const ShippingChartByCity = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [colors, setColors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/shipping/stats/city");
        if (res.data && res.data.data) {
          const cityData = res.data.data;
          setData(cityData);

          // Set default colors if not already set
          const initialColors = {};
          cityData.forEach((item, idx) => {
            const city = item?._id || "Unknown";
            initialColors[city] = getDefaultColor(idx);
          });
          setColors(initialColors);
        }
      } catch (error) {
        console.error("Failed to load chart data:", error.message);
      }
    };
    fetchData();
  }, []);

  const getDefaultColor = (index) => {
    const defaultColors = [
      "#5470C6", "#91CC75", "#FAC858", "#EE6666",
      "#73C0DE", "#3BA272", "#FC8452", "#9A60B4", "#EA7CCC"
    ];
    return defaultColors[index % defaultColors.length];
  };

  const handleColorChange = (city, newColor) => {
    setColors((prev) => ({
      ...prev,
      [city]: newColor,
    }));
  };

  const isValidData = Array.isArray(data) && data.length > 0;

  const getOption = () => {
    const labels = data.map(item => item?._id || "Unknown");
    const values = data.map(item => item?.total || 0);

    const pieData = labels.map((label, index) => ({
      value: values[index],
      name: label,
      itemStyle: {
        color: colors[label] || getDefaultColor(index)
      }
    }));

    switch (chartType) {
      case "pie":
        return {
          title: { text: "Shipping by City (Pie)", left: "center" },
          tooltip: {
            trigger: "item",
            formatter: "{b}: {c} ({d}%)"
          },
          legend: {
            orient: "vertical",
            left: "left"
          },
          series: [
            {
              type: "pie",
              radius: "50%",
              data: pieData
            }
          ]
        };

      case "doughnut":
        return {
          title: { text: "Shipping by City (Doughnut)", left: "center" },
          tooltip: {
            trigger: "item",
            formatter: "{b}: {c} ({d}%)"
          },
          legend: {
            orient: "vertical",
            left: "left"
          },
          series: [
            {
              type: "pie",
              radius: ["40%", "70%"],
              data: pieData
            }
          ]
        };

      case "bar":
      default:
        return {
          title: { text: "Shipping by City (Bar)" },
          tooltip: {
            trigger: "axis",
            formatter: function (params) {
              const total = values.reduce((acc, val) => acc + val, 0);
              const percent = ((params[0].value / total) * 100).toFixed(2);
              return `${params[0].name}: ${params[0].value} (${percent}%)`;
            }
          },
          xAxis: {
            type: "category",
            data: labels
          },
          yAxis: {
            type: "value"
          },
          series: [
            {
              type: "bar",
              data: labels.map((label, idx) => ({
                value: values[idx],
                itemStyle: {
                  color: colors[label] || getDefaultColor(idx)
                }
              }))
            }
          ]
        };
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Shipping Chart by City</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setChartType("bar")} className="px-3 py-1 bg-blue-500 text-white rounded">Bar</button>
        <button onClick={() => setChartType("pie")} className="px-3 py-1 bg-green-500 text-white rounded">Pie</button>
        <button onClick={() => setChartType("doughnut")} className="px-3 py-1 bg-purple-500 text-white rounded">Doughnut</button>
      </div>

      {/* Color pickers for each city */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {data.map((item, idx) => {
          const city = item?._id || "Unknown";
          return (
            <div key={city} className="flex items-center gap-2">
              <label>{city}</label>
              <input
                type="color"
                value={colors[city] || getDefaultColor(idx)}
                onChange={(e) => handleColorChange(city, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {isValidData ? (
        <ReactECharts option={getOption()} style={{ height: 400 }} />
      ) : (
        <p>Loading or no data available...</p>
      )}
    </div>
  );
};

export default ShippingChartByCity;
