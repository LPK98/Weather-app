/**
 * LankaWeather - Dashboard JavaScript
 * Fetches live weather data from the Django backend API
 */

// ─── State ─────────────────────────────────────────────────────────
let weatherData = null;
let hourlyData = [];
let dailyData = [];

// ─── DOM Elements ──────────────────────────────────────────────────
const cityName = document.getElementById("city-name");
const cityProvince = document.getElementById("city-province");
const currentTemp = document.getElementById("current-temp");
const weatherIcon = document.getElementById("weather-icon");
const weatherCondition = document.getElementById("weather-condition");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const visibilityEl = document.getElementById("visibility");
const uvIndex = document.getElementById("uv-index");
const weatherDescription = document.getElementById("weather-description");
const hourlyContainer = document.getElementById("hourly-container");
const dailyContainer = document.getElementById("daily-container");
const alertsContainer = document.getElementById("alerts-container");
const activitiesContainer = document.getElementById("activities-container");

// ─── API Functions ─────────────────────────────────────────────────
async function fetchCurrentWeather(city) {
  try {
    const res = await fetch(
      `/api/weather/current/?city=${encodeURIComponent(city)}`,
    );
    if (!res.ok) throw new Error("Weather data unavailable");
    return await res.json();
  } catch (e) {
    console.error("Error fetching current weather:", e);
    return null;
  }
}

async function fetchHourlyForecast(city) {
  try {
    const res = await fetch(
      `/api/weather/hourly/?city=${encodeURIComponent(city)}`,
    );
    if (!res.ok) throw new Error("Forecast unavailable");
    return await res.json();
  } catch (e) {
    console.error("Error fetching hourly forecast:", e);
    return null;
  }
}

async function fetchDailyForecast(city) {
  try {
    const res = await fetch(
      `/api/weather/daily/?city=${encodeURIComponent(city)}`,
    );
    if (!res.ok) throw new Error("Forecast unavailable");
    return await res.json();
  } catch (e) {
    console.error("Error fetching daily forecast:", e);
    return null;
  }
}

async function fetchAlerts() {
  try {
    const res = await fetch("/api/alerts/?limit=3&active=true");
    if (!res.ok) throw new Error("Alerts unavailable");
    return await res.json();
  } catch (e) {
    console.error("Error fetching alerts:", e);
    return null;
  }
}

async function fetchActivities(city) {
  try {
    const res = await fetch(
      `/api/activities/?city=${encodeURIComponent(city)}`,
    );
    if (!res.ok) throw new Error("Activities unavailable");
    return await res.json();
  } catch (e) {
    console.error("Error fetching activities:", e);
    return null;
  }
}

// ─── Render Functions ──────────────────────────────────────────────
function renderCurrentWeather(data) {
  if (!data) {
    cityName.textContent = "Error loading data";
    return;
  }
  weatherData = data;
  cityName.textContent = data.city_name || "Unknown";
  cityProvince.textContent = (data.province || "Sri Lanka") + ", Sri Lanka";
  currentTemp.textContent = formatTemp(data.temperature);
  weatherIcon.textContent = data.icon || "cloud";
  weatherCondition.textContent = data.condition || "Unknown";
  humidity.textContent = `${data.humidity}%`;
  wind.textContent = `${data.wind_speed} km/h ${data.wind_direction || ""}`;
  visibilityEl.textContent = `${data.visibility || 10} km`;
  uvIndex.textContent = data.uv_index
    ? `${data.uv_index} ${getUVLabel(data.uv_index)}`
    : "N/A";
  weatherDescription.textContent = `${data.description || data.condition}. Feels like ${formatTempFull(data.feels_like || data.temperature)}.`;
}

function getUVLabel(uv) {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

function renderHourlyForecast(data) {
  if (!data || data.length === 0) {
    hourlyContainer.innerHTML =
      '<p class="text-sm text-slate-500 text-center py-4">No hourly data available</p>';
    return;
  }
  hourlyData = data;
  let html = "";
  data.slice(0, 8).forEach((hour, i) => {
    const isNow = i === 0;
    const highlight = isNow ? "bg-primary/10 rounded-lg py-2" : "";
    const textColor = isNow
      ? "text-primary"
      : "text-slate-500 dark:text-slate-400";
    const iconColor = isNow ? "text-primary" : "text-slate-400";
    const tempColor = isNow ? "text-primary" : "";

    html += `
      <div class="flex flex-col items-center gap-3 min-w-[60px] ${highlight}">
        <p class="text-xs font-bold ${textColor}">${isNow ? "Now" : hour.time}</p>
        <span class="material-symbols-outlined ${iconColor}">${hour.icon || "cloud"}</span>
        <p class="text-lg font-bold ${tempColor}">${formatTemp(hour.temperature)}</p>
      </div>`;
  });
  hourlyContainer.innerHTML = html;
}

function renderDailyForecast(data) {
  if (!data || data.length === 0) {
    dailyContainer.innerHTML =
      '<p class="text-sm text-slate-500 text-center py-4">No forecast data available</p>';
    return;
  }
  dailyData = data;
  const conditionIcons = {
    Thunderstorm: "thunderstorm",
    Drizzle: "rainy",
    Rain: "rainy",
    Snow: "cloudy_snowing",
    Clear: "wb_sunny",
    Clouds: "cloud",
    Mist: "foggy",
    Fog: "foggy",
    Haze: "foggy",
  };

  let html = "";
  data.forEach((day) => {
    const icon = day.icon || conditionIcons[day.condition] || "cloud";
    const iconColor = ["thunderstorm", "rainy"].includes(icon)
      ? "text-primary"
      : icon === "wb_sunny"
        ? "text-yellow-500"
        : "text-slate-400";

    html += `
      <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
        <p class="w-20 font-medium text-sm">${day.day_name}</p>
        <div class="flex items-center gap-3 flex-1 px-4">
          <span class="material-symbols-outlined ${iconColor}">${icon}</span>
          <p class="text-xs text-slate-500 dark:text-slate-400">${day.description || day.condition}</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="font-bold temp-high">${formatTemp(day.temp_high)}</span>
          <span class="text-slate-400 text-sm temp-low">${formatTemp(day.temp_low)}</span>
        </div>
      </div>`;
  });
  dailyContainer.innerHTML = html;
}

function renderAlerts(data) {
  if (!data || data.length === 0) {
    alertsContainer.innerHTML =
      '<p class="text-sm text-slate-500 text-center py-4">No active alerts</p>';
    return;
  }

  const borderColors = {
    RED: "border-red-500",
    ORANGE: "border-orange-500",
    YELLOW: "border-yellow-500",
  };

  let html = "";
  data.slice(0, 3).forEach((alert) => {
    const borderColor = borderColors[alert.severity] || "border-slate-500";
    html += `
      <div class="p-4 rounded-lg bg-slate-50 dark:bg-background-dark border-l-4 ${borderColor}">
        <h4 class="font-bold text-sm mb-1">${alert.title}</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${alert.description.substring(0, 120)}...</p>
        <p class="text-[10px] mt-2 font-bold text-slate-400 uppercase">${alert.time_ago}</p>
      </div>`;
  });
  alertsContainer.innerHTML = html;
}

function renderActivities(data) {
  if (!data || data.length === 0) {
    activitiesContainer.innerHTML =
      '<p class="text-sm text-slate-500 text-center py-4">No activities available</p>';
    return;
  }

  const colorMap = {
    green: {
      bg: "bg-green-100 dark:bg-green-500/20",
      text: "text-green-600 dark:text-green-400",
    },
    yellow: {
      bg: "bg-yellow-100 dark:bg-yellow-500/20",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-500/20",
      text: "text-red-600 dark:text-red-400",
    },
  };

  let html = "";
  data.forEach((activity) => {
    const color = colorMap[activity.suitability_color] || colorMap["yellow"];
    const suitabilityLabel =
      activity.suitability === "GREAT"
        ? "Great"
        : activity.suitability === "FAIR"
          ? "Fair"
          : "Poor";
    html += `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">${activity.icon || "sports"}</span>
          <p class="text-sm font-medium">${activity.activity_name} (${activity.location})</p>
        </div>
        <span class="text-xs font-bold px-2 py-1 rounded ${color.bg} ${color.text}">${suitabilityLabel}</span>
      </div>`;
  });
  activitiesContainer.innerHTML = html;
}

// ─── Load All Data ─────────────────────────────────────────────────
async function loadDashboard(city) {
  // Fetch all data in parallel
  const [current, hourly, daily, alerts, activities] = await Promise.all([
    fetchCurrentWeather(city),
    fetchHourlyForecast(city),
    fetchDailyForecast(city),
    fetchAlerts(),
    fetchActivities(city),
  ]);

  renderCurrentWeather(current);
  renderHourlyForecast(hourly);
  renderDailyForecast(daily);
  renderAlerts(alerts);
  renderActivities(activities);
}

// ─── Event Listeners ───────────────────────────────────────────────
document.addEventListener("cityChanged", (e) => {
  loadDashboard(e.detail.city);
});

document.addEventListener("unitChanged", () => {
  if (weatherData) renderCurrentWeather(weatherData);
  if (hourlyData.length) renderHourlyForecast(hourlyData);
  if (dailyData.length) renderDailyForecast(dailyData);
});

// ─── Initialize ────────────────────────────────────────────────────
loadDashboard(window.LW.currentCity);
