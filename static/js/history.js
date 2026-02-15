/**
 * LankaWeather - History Page JavaScript
 * Uses Chart.js for interactive data visualization
 */

let historyChart = null;
let chartType = "line";
let chartData = null;
let climateData = null;
let climateSortKey = "station_name";
let climateSortAsc = true;
let visibleColumns = [
  "station_name",
  "max_temp",
  "min_temp",
  "annual_rainfall",
  "rainy_days",
  "sunshine_hours",
];

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

// ─── Unit Helpers ──────────────────────────────────────────────────
function fmtTemp(val) {
  const unit = window.LW?.unit || "C";
  if (unit === "F") return `${((val * 9) / 5 + 32).toFixed(1)}°F`;
  return `${val}°C`;
}

// ─── Render Functions ──────────────────────────────────────────────
function renderStats(data) {
  if (!data) return;
  document.getElementById("stat-temp").textContent = fmtTemp(data.avg_temp);
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
  const unit = window.LW?.unit || "C";
  const tempLabel = unit === "F" ? "Temperature (°F)" : "Temperature (°C)";

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
    const tempData =
      unit === "F"
        ? data.temperature.map((t) => parseFloat(((t * 9) / 5 + 32).toFixed(1)))
        : data.temperature;
    datasets.push({
      label: tempLabel,
      data: tempData,
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
  climateData = data;

  // Sort
  const sorted = [...data].sort((a, b) => {
    const aVal = a[climateSortKey];
    const bVal = b[climateSortKey];
    const cmp =
      typeof aVal === "string" ? aVal.localeCompare(bVal) : aVal - bVal;
    return climateSortAsc ? cmp : -cmp;
  });

  const tbody = document.getElementById("climate-tbody");
  const colMap = {
    station_name: (r) =>
      `<td class="py-3 px-4 font-medium">${r.station_name}</td>`,
    max_temp: (r) => `<td class="py-3 px-4 text-right">${r.max_temp}</td>`,
    min_temp: (r) => `<td class="py-3 px-4 text-right">${r.min_temp}</td>`,
    annual_rainfall: (r) =>
      `<td class="py-3 px-4 text-right">${r.annual_rainfall.toLocaleString()}</td>`,
    rainy_days: (r) => `<td class="py-3 px-4 text-right">${r.rainy_days}</td>`,
    sunshine_hours: (r) =>
      `<td class="py-3 px-4 text-right">${r.sunshine_hours.toLocaleString()}</td>`,
  };

  tbody.innerHTML = sorted
    .map(
      (row) => `
    <tr class="border-b border-slate-100 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      ${visibleColumns.map((c) => colMap[c](row)).join("")}
    </tr>
  `,
    )
    .join("");

  // Update header visibility
  const headers = document.querySelectorAll("#climate-thead th");
  const allCols = [
    "station_name",
    "max_temp",
    "min_temp",
    "annual_rainfall",
    "rainy_days",
    "sunshine_hours",
  ];
  headers.forEach((h, i) => {
    h.style.display = visibleColumns.includes(allCols[i]) ? "" : "none";
  });
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

// ─── Sort By Dropdown ──────────────────────────────────────────────
document.getElementById("sort-by-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const existing = document.getElementById("sort-dropdown");
  if (existing) {
    existing.remove();
    return;
  }

  const labels = {
    station_name: "Station",
    max_temp: "Max Temp",
    min_temp: "Min Temp",
    annual_rainfall: "Rainfall",
    rainy_days: "Rainy Days",
    sunshine_hours: "Sunshine",
  };
  const dd = document.createElement("div");
  dd.id = "sort-dropdown";
  dd.className =
    "absolute right-0 top-full mt-1 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-slate-200 dark:border-border-dark py-1 z-20 min-w-[160px]";
  dd.innerHTML = Object.entries(labels)
    .map(
      ([k, v]) =>
        `<button class="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${climateSortKey === k ? "text-primary font-bold" : ""}" data-col="${k}">${v} ${climateSortKey === k ? (climateSortAsc ? "↑" : "↓") : ""}</button>`,
    )
    .join("");
  e.target.closest(".relative, .flex").style.position = "relative";
  e.target.closest(".flex").appendChild(dd);

  dd.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (climateSortKey === btn.dataset.col) climateSortAsc = !climateSortAsc;
      else {
        climateSortKey = btn.dataset.col;
        climateSortAsc = true;
      }
      dd.remove();
      renderClimateTable(climateData);
    });
  });
  document.addEventListener("click", () => dd.remove(), { once: true });
});

// ─── Columns Toggle ────────────────────────────────────────────────
document.getElementById("columns-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const existing = document.getElementById("columns-dropdown");
  if (existing) {
    existing.remove();
    return;
  }

  const labels = {
    station_name: "Station",
    max_temp: "Max Temp",
    min_temp: "Min Temp",
    annual_rainfall: "Rainfall",
    rainy_days: "Rainy Days",
    sunshine_hours: "Sunshine",
  };
  const dd = document.createElement("div");
  dd.id = "columns-dropdown";
  dd.className =
    "absolute right-0 top-full mt-1 bg-white dark:bg-card-dark rounded-lg shadow-xl border border-slate-200 dark:border-border-dark py-1 z-20 min-w-[160px]";
  dd.innerHTML = Object.entries(labels)
    .map(
      ([k, v]) =>
        `<label class="flex items-center gap-2 px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
      <input type="checkbox" ${visibleColumns.includes(k) ? "checked" : ""} ${k === "station_name" ? "disabled" : ""} data-col="${k}" class="rounded text-primary focus:ring-primary"> ${v}
    </label>`,
    )
    .join("");
  e.target.closest(".flex").style.position = "relative";
  e.target.closest(".flex").appendChild(dd);

  dd.querySelectorAll("input").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked && !visibleColumns.includes(cb.dataset.col))
        visibleColumns.push(cb.dataset.col);
      else if (!cb.checked)
        visibleColumns = visibleColumns.filter((c) => c !== cb.dataset.col);
      renderClimateTable(climateData);
    });
  });
  document.addEventListener("click", () => dd.remove(), { once: true });
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

// ─── Event Listeners ───────────────────────────────────────────────
document.addEventListener("cityChanged", (e) => {
  document.getElementById("filter-city").value = e.detail.city;
  loadHistory();
});

document.addEventListener("unitChanged", () => {
  // Re-render stats and chart with new unit
  if (chartData) renderChart(chartData);
  const statsEl = document.getElementById("stat-temp");
  if (statsEl && statsEl._rawValue !== undefined) {
    statsEl.textContent = fmtTemp(statsEl._rawValue);
  }
  // Reload to re-render all stats
  loadHistory();
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
