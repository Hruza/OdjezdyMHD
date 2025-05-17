export default (container, data) => {
  // Ensure Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not loaded. Please include it in your project.");
  }

  const weatherContainer = document.createElement("div");
  weatherContainer.className =
    "flex flex-wrap gap-4 flex-center justify-center";
  const backgroundContainer = document.createElement("div");
  backgroundContainer.className =
    "bg-gray-300/60 backdrop-blur-xs rounded-lg text-center mt-4 p-4";
  const weatherElement = document.createElement("div");
  weatherElement.className =
    "py-2 pr-3 bg-gray-100 gap-x-5 shadow-md rounded-lg border border-gray-200";
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 150;
  weatherElement.appendChild(canvas);

  const temperatures = data.properties.timeseries
    .slice(0, 48)
    .map((entry) => entry.data.instant.details.air_temperature);
  const precipitation_amount = data.properties.timeseries
    .slice(0, 48)
    .map((entry) => entry.data.next_1_hours.details.precipitation_amount);
  const timestamps = data.properties.timeseries.slice(0, 48).map((entry) =>
    new Date(entry.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  new Chart(canvas, {
    data: {
      labels: timestamps,
      datasets: [
        {
          type: "bar",
          data: precipitation_amount,
          backgroundColor: "rgba(43, 127, 255, 0.5)",
          borderWidth: 0,
          yAxisID: "y1",
          order: 1,
        },
        {
          type: "line",
          data: temperatures,
          borderColor: "rgba(214,158,46, 1)",
          backgroundColor: "rgba(214,158,46, 0.3)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0, // Remove markers
          yAxisID: "y",
          order: 2,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true, // Enable tooltips
          mode: "index",
          intersect: false,
          position: "nearest",
          backgroundColor: "rgba(243, 244, 246, 0.7)",
          titleColor: "rgb(26, 32, 44)",
          bodyColor: "rgb(26, 32, 44)",
          displayColors: false,
          itemSort: function (a, b) {
            return b.datasetIndex - a.datasetIndex; // Sort by the raw data values
          },
          callbacks: {
            label: function (context) {
              if (context.datasetIndex === 1) {
                return `${context.raw}°C`;
              } else if (context.datasetIndex === 0) {
                return `${context.raw} mm`;
              }
              return context.raw;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: function (value, index) {
              return parseInt(this.getLabelForValue(value).split(":")[0]) %
                4 ===
                0
                ? this.getLabelForValue(value)
                : "";
            },
            autoSkip: false,
          },
          grid: {
            display: true,
            drawTicks: true,
            tickColor: "rgba(0, 0, 0, 0.1)",
            tickLength: 0,
            drawOnChartArea: true,
            drawBorder: true,
            color: function (context) {
              if (context.type === "scale") {
                return "transparent";
              } else if (context.tick.label === "") {
                return "transparent";
              } else if (context.tick.label === "00:00") {
                return "rgba(0, 0, 0, 0.6)";
              } else {
                return "rgba(0, 0, 0, 0.2)";
              }
            },
          },
        },
        y: {
          position: "left",
          title: {
            display: true,
          },
          grid: {
            tickLength: 0,
          },
        },
        y1: {
          display: false,
          min: 0,
          max: 8,
        },
      },
    },
  });
  backgroundContainer.appendChild(weatherElement);
  weatherContainer.appendChild(backgroundContainer);
  container.appendChild(weatherContainer);
};
