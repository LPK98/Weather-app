/**
 * LankaWeather - Explorer Page JavaScript
 * Uses Leaflet.js for interactive map visualization
 */

const OWM_API_KEY = ""; // Tile layers use the backend proxy key
const SL_CENTER = [7.8731, 80.7718];
const SL_ZOOM = 8;

let map = null;
let markers = [];
let activeLayer = null;
let activeCityId = null;

// ─── Map Initialization ───────────────────────────────────────────
function initMap() {
  map = L.map("map", {
    center: SL_CENTER,
    zoom: SL_ZOOM,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 18,
  }).addTo(map);

  // Default: temperature layer
  setWeatherLayer("temp");
}

// ─── Weather Tile Layers ──────────────────────────────────────────
const OWM_LAYERS = {
  temp: "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=8aa9d1ee7ba9001b7f8c8f0dd61a4326",
  clouds:
    "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=8aa9d1ee7ba9001b7f8c8f0dd61a4326",
  rain: "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=8aa9d1ee7ba9001b7f8c8f0dd61a4326",
  wind: "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=8aa9d1ee7ba9001b7f8c8f0dd61a4326",
};

function setWeatherLayer(type) {
  if (activeLayer) map.removeLayer(activeLayer);
  activeLayer = L.tileLayer(OWM_LAYERS[type], { opacity: 0.5, maxZoom: 18 });
  activeLayer.addTo(map);
}

// ─── Layer Buttons ─────────────────────────────────────────────────
document.querySelectorAll(".layer-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".layer-btn").forEach((b) => {
      b.classList.remove("bg-primary", "text-white");
      b.classList.add("bg-slate-100", "dark:bg-slate-800", "text-slate-500");
    });
    btn.classList.remove("bg-slate-100", "dark:bg-slate-800", "text-slate-500");
    btn.classList.add("bg-primary", "text-white");
    setWeatherLayer(btn.dataset.layer);
  });
});

// ─── Geolocation ───────────────────────────────────────────────────
document.getElementById("locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 11);
    },
    (err) => console.warn("Geolocation failed:", err),
  );
});

// ─── API Functions ─────────────────────────────────────────────────
async function fetchExplorerCities() {
  try {
    const res = await fetch("/api/explorer/cities/");
    return await res.json();
  } catch (e) {
    console.error("Error fetching explorer cities:", e);
    return [];
  }
}

async function fetchActivities() {
  try {
    const res = await fetch("/api/activities/");
    return await res.json();
  } catch (e) {
    console.error("Error fetching activities:", e);
    return [];
  }
}

// ─── Render Functions ──────────────────────────────────────────────
function addCityMarkers(cities) {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];

  cities.forEach((city) => {
    const icon = L.divIcon({
      className: "city-marker",
      iconSize: [14, 14],
    });

    const marker = L.marker([city.latitude, city.longitude], { icon }).addTo(
      map,
    ).bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 160px;">
          <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 6px 0;">${city.name}</h4>
          <p style="margin: 2px 0; font-size: 12px;">
            <strong>${city.current_weather?.temperature ?? "--"}°C</strong> · ${city.current_weather?.description ?? "N/A"}
          </p>
          <p style="margin: 2px 0; font-size: 11px; color: #8e99cc;">
            Humidity: ${city.current_weather?.humidity ?? "--"}% · Wind: ${city.current_weather?.wind_speed ?? "--"} km/h
          </p>
        </div>
      `);

    marker.cityData = city;
    marker.on("click", () => selectCity(city));
    markers.push(marker);
  });
}

function selectCity(city) {
  activeCityId = city.id;
  document.getElementById("active-city-name").textContent = city.name;
  const w = city.current_weather || {};
  document.getElementById("active-temp").textContent = w.temperature
    ? `${w.temperature}°C`
    : "--°C";
  document.getElementById("active-humidity").textContent = w.humidity
    ? `${w.humidity}%`
    : "--%";
  document.getElementById("active-wind").textContent = w.wind_speed
    ? `${w.wind_speed} km/h`
    : "-- km/h";
  document.getElementById("active-condition").textContent =
    w.description || "--";
  document.getElementById("active-pressure").textContent = w.pressure
    ? `${w.pressure} hPa`
    : "-- hPa";

  // Highlight active marker
  markers.forEach((m) => {
    const el = m.getElement();
    if (!el) return;
    const dot = el.querySelector(".city-marker") || el;
    if (m.cityData.id === city.id) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });

  map.flyTo([city.latitude, city.longitude], 10, { duration: 0.8 });
}

function renderCitiesList(cities) {
  const container = document.getElementById("cities-list");
  document.getElementById("city-count").textContent =
    `${cities.length} stations`;

  container.innerHTML = cities
    .map((city) => {
      const temp = city.current_weather?.temperature ?? "--";
      const desc = city.current_weather?.description ?? "";
      return `
      <button class="city-item w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              data-city-id="${city.id}">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-sm">location_on</span>
          <div>
            <p class="text-sm font-medium">${city.name}</p>
            <p class="text-xs text-muted-text">${desc}</p>
          </div>
        </div>
        <span class="text-sm font-bold">${temp}°</span>
      </button>
    `;
    })
    .join("");

  container.querySelectorAll(".city-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cityId = parseInt(btn.dataset.cityId);
      const city = cities.find((c) => c.id === cityId);
      if (city) selectCity(city);
    });
  });
}

function renderActivities(data) {
  const container = document.getElementById("activities-list");
  if (!data.length) {
    container.innerHTML =
      '<p class="text-sm text-muted-text">No activities loaded.</p>';
    return;
  }
  const colors = {
    GREAT: "text-green-500",
    FAIR: "text-yellow-500",
    POOR: "text-red-500",
  };
  const icons = { GREAT: "check_circle", FAIR: "info", POOR: "cancel" };

  container.innerHTML = data
    .map(
      (a) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-background-dark">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-sm ${colors[a.suitability] || "text-slate-400"}">${icons[a.suitability] || "help"}</span>
        <span class="text-sm">${a.activity_name}</span>
      </div>
      <span class="text-xs font-bold ${colors[a.suitability] || "text-slate-400"}">${a.suitability}</span>
    </div>
  `,
    )
    .join("");
}

// ─── Bootstrap ─────────────────────────────────────────────────────
async function loadExplorer() {
  initMap();

  const [cities, activities] = await Promise.all([
    fetchExplorerCities(),
    fetchActivities(),
  ]);

  if (cities.length) {
    addCityMarkers(cities);
    renderCitiesList(cities);
    selectCity(cities[0]);
  }

  renderActivities(activities);
}

loadExplorer();
