/**
 * LankaWeather - History Page JavaScript
 * Uses Chart.js for interactive data visualization
 */

let historyChart = null;
let chartType = "line";
let chartData = null;

// ─── API Functions ─────────────────────────────────────────────────
async function fetchHistoryStats(city, start, end) {
  try {
    const res = await fetch(
      `/api/history/stats/?city=${encodeURIComponent(city)}&start=${start}&end=${end}`,
    );
    return await res.json();
  } catch (e) {
    console.error("Error fetching history stats:", e);
    return null;
  }
}

async function fetchChartData(city, start, end) {
  try {
    const res = await fetch(
      `/api/history/chart/?city=${encodeURIComponent(city)}&start=${start}&end=${end}`,
    );
    return await res.json();
  } catch (e) {
    console.error("Error fetching chart data:", e);
    return null;
  }
}

async function fetchClimateNormals() {
  try {
    const res = await fetch("/api/history/climate-normals/");
    return await res.json();
  } catch (e) {
    console.error("Error fetching climate normals:", e);
    return null;
  }
}

// ─── Render Functions ──────────────────────────────────────────────
function renderStats(data) {
  if (!data) return;
  document.getElementById("stat-temp").textContent = `${data.avg_temp}°C`;
  document.getElementById("stat-rainfall").textContent =
    `${data.total_rainfall.toLocaleString()}mm`;
  document.getElementById("stat-humidity").textContent =
    `${data.avg_humidity}%`;
  document.getElementById("stat-events").textContent = String(
    data.extreme_events,
  ).padStart(2, "0");

  const tempTrend = document.getElementById("stat-temp-trend");
  tempTrend.textContent = `${data.temp_trend > 0 ? "+" : ""}${data.temp_trend}%`;
  tempTrend.className = `font-bold ${data.temp_trend > 0 ? "text-green-500" : "text-red-500"}`;

  const rainfallTrend = document.getElementById("stat-rainfall-trend");
  rainfallTrend.textContent = `${data.rainfall_trend > 0 ? "+" : ""}${data.rainfall_trend}%`;
  rainfallTrend.className = `font-bold ${data.rainfall_trend > 0 ? "text-green-500" : "text-red-500"}`;

  const humidityTrend = document.getElementById("stat-humidity-trend");
  humidityTrend.textContent = `${data.humidity_trend > 0 ? "+" : ""}${data.humidity_trend}%`;
  humidityTrend.className = `font-bold ${data.humidity_trend > 0 ? "text-green-500" : "text-red-500"}`;

  const eventsTrend = document.getElementById("stat-events-trend");
  eventsTrend.textContent = `${data.events_trend > 0 ? "+" : ""}${data.events_trend}`;
  eventsTrend.className = `font-bold ${data.events_trend > 0 ? "text-red-500" : "text-green-500"}`;
}

function renderChart(data) {
  if (!data) return;
  chartData = data;

  const ctx = document.getElementById("history-chart").getContext("2d");

  if (historyChart) historyChart.destroy();

  const metric = document.getElementById("filter-metric").value;

  const datasets = [];
  if (metric === "all" || metric === "rainfall") {
    datasets.push({
      label: "Rainfall (mm)",
      data: data.rainfall,
      borderColor: "#607AFB",
      backgroundColor: "rgba(96, 122, 251, 0.15)",
      fill: true,
      tension: 0.4,
      yAxisID: "y",
    });
  }
  if (metric === "all" || metric === "temperature") {
    datasets.push({
      label: "Temperature (°C)",
      data: data.temperature,
      borderColor: "#f97316",
      backgroundColor: "rgba(249, 115, 22, 0.15)",
      fill: metric !== "all",
      tension: 0.4,
      yAxisID: metric === "all" ? "y1" : "y",
    });
  }
  if (metric === "humidity") {
    datasets.push({
      label: "Humidity (%)",
      data: data.humidity,
      borderColor: "#22c55e",
      backgroundColor: "rgba(34, 197, 94, 0.15)",
      fill: true,
      tension: 0.4,
      yAxisID: "y",
    });
  }

  const scales = {
    y: {
      beginAtZero: true,
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#8e99cc" },
    },
    x: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#8e99cc" },
    },
  };

  if (metric === "all") {
    scales.y1 = {
      position: "right",
      beginAtZero: true,
      grid: { display: false },
      ticks: { color: "#f97316" },
    };
  }

  historyChart = new Chart(ctx, {
    type: chartType,
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "#8e99cc", usePointStyle: true, padding: 20 },
        },
        tooltip: {
          backgroundColor: "#181d35",
          titleColor: "#fff",
          bodyColor: "#8e99cc",
          borderColor: "#2f396a",
          borderWidth: 1,
        },
      },
      scales,
    },
  });
}

function renderClimateTable(data) {
  if (!data) return;
  const tbody = document.getElementById("climate-tbody");

  tbody.innerHTML = data
    .map(
      (row) => `
    <tr class="border-b border-slate-100 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td class="py-3 px-4 font-medium">${row.station_name}</td>
      <td class="py-3 px-4 text-right">${row.max_temp}</td>
      <td class="py-3 px-4 text-right">${row.min_temp}</td>
      <td class="py-3 px-4 text-right">${row.annual_rainfall.toLocaleString()}</td>
      <td class="py-3 px-4 text-right">${row.rainy_days}</td>
      <td class="py-3 px-4 text-right">${row.sunshine_hours.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");
}

// ─── Chart Type Toggle ─────────────────────────────────────────────
document.querySelectorAll(".chart-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chart-type-btn").forEach((b) => {
      b.classList.remove("bg-primary", "text-white");
      b.classList.add("bg-slate-100", "dark:bg-slate-800", "text-slate-500");
    });
    btn.classList.remove("bg-slate-100", "dark:bg-slate-800", "text-slate-500");
    btn.classList.add("bg-primary", "text-white");
    chartType = btn.dataset.type;
    if (chartData) renderChart(chartData);
  });
});

// ─── Filters ───────────────────────────────────────────────────────
function getFilters() {
  return {
    city: document.getElementById("filter-city").value,
    start: document.getElementById("filter-start").value,
    end: document.getElementById("filter-end").value,
  };
}

document
  .getElementById("apply-btn")
  .addEventListener("click", () => loadHistory());

document.getElementById("reset-filters").addEventListener("click", () => {
  document.getElementById("filter-city").value = "Colombo";
  document.getElementById("filter-start").value = "2018";
  document.getElementById("filter-end").value = "2023";
  document.getElementById("filter-metric").value = "all";
  loadHistory();
});

document.getElementById("filter-metric").addEventListener("change", () => {
  if (chartData) renderChart(chartData);
});

// ─── Export Functions ──────────────────────────────────────────────
document.getElementById("export-csv").addEventListener("click", () => {
  if (!chartData) return;
  let csv =
    "Month," +
    (chartData.temperature ? "Temperature," : "") +
    (chartData.rainfall ? "Rainfall," : "") +
    (chartData.humidity ? "Humidity" : "") +
    "\n";
  chartData.labels.forEach((label, i) => {
    csv += `${label},${chartData.temperature?.[i] || ""},${chartData.rainfall?.[i] || ""},${chartData.humidity?.[i] || ""}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "weather_history.csv";
  a.click();
});

document.getElementById("export-pdf").addEventListener("click", () => {
  window.print();
});

// ─── Load All Data ─────────────────────────────────────────────────
async function loadHistory() {
  const { city, start, end } = getFilters();

  const [stats, chart, normals] = await Promise.all([
    fetchHistoryStats(city, start, end),
    fetchChartData(city, start, end),
    fetchClimateNormals(),
  ]);

  renderStats(stats);
  renderChart(chart);
  renderClimateTable(normals);
  document.getElementById("hotspot-city").textContent = city;
}

loadHistory();
