/**
 * LankaWeather - Alerts Page JavaScript
 */

let allAlerts = [];
let currentFilter = "all";
let monitoringRegions = ["Ratnapura", "Colombo"];

// ─── API Functions ─────────────────────────────────────────────────
async function fetchAlerts(severity) {
  try {
    let url = "/api/alerts/?active=true";
    if (severity && severity !== "all") url += `&severity=${severity}`;
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    console.error("Error fetching alerts:", e);
    return [];
  }
}

async function fetchAlertStats() {
  try {
    const res = await fetch("/api/alerts/stats/");
    return await res.json();
  } catch (e) {
    return { red: 0, orange: 0, yellow: 0 };
  }
}

async function fetchSettings() {
  try {
    const res = await fetch("/api/alerts/settings/");
    return await res.json();
  } catch (e) {
    return [];
  }
}

// ─── Render Functions ──────────────────────────────────────────────
function renderAlertStats(stats) {
  document.getElementById("red-count").textContent = stats.red || 0;
  document.getElementById("orange-count").textContent = stats.orange || 0;
  document.getElementById("yellow-count").textContent = stats.yellow || 0;
}

function renderRegionTags() {
  const container = document.getElementById("region-tags");
  container.innerHTML = monitoringRegions
    .map(
      (region) => `
    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
      ${region}
      <button class="text-slate-400 hover:text-red-500 ml-1 remove-region" data-region="${region}">&times;</button>
    </span>
  `,
    )
    .join("");

  // Bind remove events
  container.querySelectorAll(".remove-region").forEach((btn) => {
    btn.addEventListener("click", () => {
      monitoringRegions = monitoringRegions.filter(
        (r) => r !== btn.dataset.region,
      );
      renderRegionTags();
    });
  });
}

function renderAlertCards(alerts) {
  const container = document.getElementById("alert-cards");

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-4xl text-slate-400 mb-4">check_circle</span>
        <p class="text-slate-500 font-medium">No active alerts</p>
        <p class="text-xs text-muted-text mt-1">All clear for your monitored regions</p>
      </div>`;
    return;
  }

  const severityConfig = {
    RED: {
      border: "border-red-500",
      bg: "bg-red-500",
      badgeText: "RED ALERT",
      headerBg: "bg-red-500/10",
      textColor: "text-red-600 dark:text-red-400",
      icon: "crisis_alert",
    },
    ORANGE: {
      border: "border-orange-500",
      bg: "bg-orange-500",
      badgeText: "ORANGE WARNING",
      headerBg: "bg-orange-500/10",
      textColor: "text-orange-600 dark:text-orange-400",
      icon: "warning",
    },
    YELLOW: {
      border: "border-yellow-500",
      bg: "bg-yellow-500",
      badgeText: "YELLOW ADVISORY",
      headerBg: "bg-yellow-500/10",
      textColor: "text-yellow-600 dark:text-yellow-400",
      icon: "info",
    },
  };

  container.innerHTML = alerts
    .map((alert) => {
      const config = severityConfig[alert.severity] || severityConfig["YELLOW"];
      const instructions = alert.instructions || [];

      return `
      <div class="bg-white dark:bg-card-dark rounded-xl shadow-sm overflow-hidden border-l-4 ${config.border}">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined ${config.textColor}">${config.icon}</span>
              <div>
                <span class="inline-block px-2 py-0.5 ${config.bg} text-white text-[10px] font-bold rounded uppercase tracking-wider mb-1">${config.badgeText}</span>
                <h3 class="font-bold">${alert.title}</h3>
              </div>
            </div>
            <span class="text-xs text-muted-text">${alert.time_ago}</span>
          </div>

          <div class="flex flex-wrap gap-4 mb-4 text-sm">
            <div class="flex items-center gap-1 text-slate-500">
              <span class="material-symbols-outlined text-sm">location_on</span>
              ${alert.district}
            </div>
            ${
              alert.validity
                ? `
            <div class="flex items-center gap-1 text-slate-500">
              <span class="material-symbols-outlined text-sm">schedule</span>
              Valid until: ${new Date(alert.validity).toLocaleString()}
            </div>`
                : ""
            }
            ${
              alert.sources
                ? `
            <div class="flex items-center gap-1 text-slate-500">
              <span class="material-symbols-outlined text-sm">source</span>
              Source: ${alert.sources}
            </div>`
                : ""
            }
          </div>

          <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">${alert.description}</p>

          ${
            instructions.length > 0
              ? `
          <div class="bg-slate-50 dark:bg-background-dark rounded-lg p-4 mb-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Safety Instructions</h4>
            <ul class="space-y-2">
              ${instructions
                .map(
                  (inst) => `
                <li class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span class="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                  ${inst}
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>`
              : ""
          }

          <div class="flex items-center gap-3">
            <button class="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">Full Advisory</button>
            <button class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span class="material-symbols-outlined text-sm align-middle">share</span> Share
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// ─── Filter Handling ───────────────────────────────────────────────
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    // Update active state
    document.querySelectorAll(".filter-btn").forEach((b) => {
      b.classList.remove("bg-primary", "text-white");
      if (b.dataset.severity === "RED")
        b.className =
          "filter-btn px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-colors";
      else if (b.dataset.severity === "ORANGE")
        b.className =
          "filter-btn px-4 py-2 rounded-lg bg-orange-500/10 text-orange-500 text-sm font-bold hover:bg-orange-500/20 transition-colors";
      else if (b.dataset.severity === "YELLOW")
        b.className =
          "filter-btn px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm font-bold hover:bg-yellow-500/20 transition-colors";
      else
        b.className =
          "filter-btn px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold";
    });
    btn.className =
      "filter-btn px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold";

    currentFilter = btn.dataset.severity;
    const alerts = await fetchAlerts(currentFilter);
    renderAlertCards(alerts);
  });
});

// ─── Save Preferences ──────────────────────────────────────────────
document
  .getElementById("save-prefs-btn")
  .addEventListener("click", async () => {
    const data = {
      region: monitoringRegions.join(", "),
      emergency_monsoon: document.getElementById("toggle-monsoon").checked,
      sms_alerts: document.getElementById("toggle-sms").checked,
      email_summary: document.getElementById("toggle-email").checked,
    };

    try {
      const res = await fetch("/api/alerts/settings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("Preferences saved successfully!");
      }
    } catch (e) {
      console.error("Error saving preferences:", e);
    }
  });

// ─── Add District ──────────────────────────────────────────────────
document.getElementById("add-district-btn").addEventListener("click", () => {
  const district = prompt("Enter district name:");
  if (district && !monitoringRegions.includes(district)) {
    monitoringRegions.push(district);
    renderRegionTags();
  }
});

// ─── CSRF Helper ───────────────────────────────────────────────────
function getCookie(name) {
  let value = null;
  document.cookie.split(";").forEach((c) => {
    const [k, v] = c.trim().split("=");
    if (k === name) value = v;
  });
  return value;
}

// ─── Initialize ────────────────────────────────────────────────────
async function initAlerts() {
  const [alerts, stats, settings] = await Promise.all([
    fetchAlerts(),
    fetchAlertStats(),
    fetchSettings(),
  ]);

  renderAlertStats(stats);
  renderAlertCards(alerts);
  renderRegionTags();

  // Apply settings if available
  if (settings && settings.length > 0) {
    const pref = settings[0];
    document.getElementById("toggle-monsoon").checked = pref.emergency_monsoon;
    document.getElementById("toggle-sms").checked = pref.sms_alerts;
    document.getElementById("toggle-email").checked = pref.email_summary;
  }
}

initAlerts();
