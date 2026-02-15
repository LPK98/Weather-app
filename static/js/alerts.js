/**
 * LankaWeather - Alerts Page JavaScript
 */

let allAlerts = [];
let currentFilter = "all";
let monitoringRegions = ["Ratnapura", "Colombo"];
let visibleCount = 5;

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
  allAlerts = alerts || [];
  const container = document.getElementById("alert-cards");
  const loadMoreBtn = document.getElementById("load-more-btn");

  if (!allAlerts.length) {
    container.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-4xl text-slate-400 mb-4">check_circle</span>
        <p class="text-slate-500 font-medium">No active alerts</p>
        <p class="text-xs text-muted-text mt-1">All clear for your monitored regions</p>
      </div>`;
    loadMoreBtn.style.display = "none";
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

  const visible = allAlerts.slice(0, visibleCount);

  container.innerHTML = visible
    .map((alert, idx) => {
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
            <button onclick="showFullAdvisory(${idx})" class="px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">Full Advisory</button>
            <button onclick="shareAlert(${idx})" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span class="material-symbols-outlined text-sm align-middle">share</span> Share
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Show/hide Load More
  loadMoreBtn.style.display =
    allAlerts.length > visibleCount ? "inline-block" : "none";
}

// ─── Full Advisory Modal ───────────────────────────────────────────
function showFullAdvisory(idx) {
  const alert = allAlerts[idx];
  if (!alert) return;
  const instructions = alert.instructions || [];

  // Create modal
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
    <div class="relative bg-white dark:bg-card-dark rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 z-10">
      <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="flex items-center gap-3 mb-4">
        <span class="material-symbols-outlined text-2xl ${alert.severity === "RED" ? "text-red-500" : alert.severity === "ORANGE" ? "text-orange-500" : "text-yellow-500"}">${alert.severity === "RED" ? "crisis_alert" : alert.severity === "ORANGE" ? "warning" : "info"}</span>
        <div>
          <span class="inline-block px-2 py-0.5 ${alert.severity === "RED" ? "bg-red-500" : alert.severity === "ORANGE" ? "bg-orange-500" : "bg-yellow-500"} text-white text-[10px] font-bold rounded uppercase">${alert.severity} ALERT</span>
          <h2 class="text-xl font-bold mt-1">${alert.title}</h2>
        </div>
      </div>
      <div class="space-y-3 text-sm text-slate-600 dark:text-slate-400 mb-6">
        <p><strong>District:</strong> ${alert.district}</p>
        ${alert.validity ? `<p><strong>Valid until:</strong> ${new Date(alert.validity).toLocaleString()}</p>` : ""}
        ${alert.sources ? `<p><strong>Source:</strong> ${alert.sources}</p>` : ""}
        <p><strong>Issued:</strong> ${alert.time_ago}</p>
      </div>
      <p class="text-sm leading-relaxed mb-6">${alert.description}</p>
      ${
        instructions.length
          ? `
        <div class="bg-slate-50 dark:bg-background-dark rounded-lg p-5">
          <h4 class="font-bold text-sm uppercase tracking-wider text-slate-500 mb-3">Safety Instructions</h4>
          <ul class="space-y-3">
            ${instructions.map((inst) => `<li class="flex items-start gap-2 text-sm"><span class="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>${inst}</li>`).join("")}
          </ul>
        </div>`
          : ""
      }
    </div>`;
  document.body.appendChild(modal);
}

// ─── Share Alert ───────────────────────────────────────────────────
async function shareAlert(idx) {
  const alert = allAlerts[idx];
  if (!alert) return;
  const text = `⚠️ ${alert.severity} ALERT: ${alert.title}\n📍 ${alert.district}\n${alert.description.substring(0, 200)}...\n\n— LankaWeather`;

  if (navigator.share) {
    try {
      await navigator.share({ title: alert.title, text });
    } catch (e) {
      /* user cancelled */
    }
  } else {
    await navigator.clipboard.writeText(text);
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-6 right-6 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-medium";
    toast.textContent = "Alert copied to clipboard!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
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
    visibleCount = 5;
    const alerts = await fetchAlerts(currentFilter);
    renderAlertCards(alerts);
  });
});

// ─── Load More ─────────────────────────────────────────────────────
document.getElementById("load-more-btn").addEventListener("click", () => {
  visibleCount += 5;
  renderAlertCards(allAlerts);
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
        const toast = document.createElement("div");
        toast.className =
          "fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm font-medium";
        toast.textContent = "Preferences saved successfully!";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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

// ─── Safety Guide ──────────────────────────────────────────────────
document.querySelector(".bg-primary button")?.addEventListener("click", () => {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4";
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="this.parentElement.remove()"></div>
    <div class="relative bg-white dark:bg-card-dark rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 z-10">
      <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <span class="material-symbols-outlined">close</span>
      </button>
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary">emergency</span>
        Safety Protocols
      </h2>
      <div class="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <div class="bg-red-50 dark:bg-red-500/10 rounded-lg p-4">
          <h3 class="font-bold text-red-600 dark:text-red-400 mb-2">🌊 Flood Emergency</h3>
          <ul class="list-disc ml-4 space-y-1"><li>Move to higher ground immediately</li><li>Avoid walking through floodwaters</li><li>Call emergency services: <strong>117</strong></li></ul>
        </div>
        <div class="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-4">
          <h3 class="font-bold text-orange-600 dark:text-orange-400 mb-2">⛈️ Severe Storm</h3>
          <ul class="list-disc ml-4 space-y-1"><li>Stay indoors away from windows</li><li>Unplug electrical appliances</li><li>Have emergency kit ready</li></ul>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-500/10 rounded-lg p-4">
          <h3 class="font-bold text-yellow-600 dark:text-yellow-400 mb-2">🏔️ Landslide Risk</h3>
          <ul class="list-disc ml-4 space-y-1"><li>Avoid steep slopes during heavy rain</li><li>Watch for unusual ground cracks</li><li>Evacuate if warned by authorities</li></ul>
        </div>
        <p class="text-xs text-muted-text mt-4">Emergency Hotline: <strong class="text-primary">117</strong> | Disaster Management Centre: <strong class="text-primary">011-2136136</strong></p>
      </div>
    </div>`;
  document.body.appendChild(modal);
});

// ─── City Changed Listener ─────────────────────────────────────────
document.addEventListener("cityChanged", async () => {
  visibleCount = 5;
  const [alerts, stats] = await Promise.all([
    fetchAlerts(currentFilter),
    fetchAlertStats(),
  ]);
  renderAlertStats(stats);
  renderAlertCards(alerts);
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

  // Restore settings if available
  if (settings && settings.length > 0) {
    const pref = settings[0];
    document.getElementById("toggle-monsoon").checked = pref.emergency_monsoon;
    document.getElementById("toggle-sms").checked = pref.sms_alerts;
    document.getElementById("toggle-email").checked = pref.email_summary;
    // Restore monitoring regions from saved preference
    if (pref.region) {
      monitoringRegions = pref.region
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    }
  }

  renderRegionTags();
}

initAlerts();
