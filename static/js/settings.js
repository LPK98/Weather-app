// Settings modal and Premium toggle (MVP - mock)
(function () {
  function getCookie(name) {
    let value = null;
    document.cookie.split(";").forEach((c) => {
      const [k, v] = c.trim().split("=");
      if (k === name) value = v;
    });
    return value;
  }

  const modal = document.getElementById("settings-modal");
  const openBtn = document.getElementById("open-settings");
  const closeBtn = document.getElementById("close-settings");
  const saveBtn = document.getElementById("save-settings-btn");
  const togglePremiumBtn = document.getElementById("toggle-premium-btn");
  const premiumStatus = document.getElementById("premium-status");
  const openPremiumPage = document.getElementById("open-premium-page");

  async function fetchCities() {
    try {
      const res = await fetch("/api/explorer/cities/");
      return await res.json();
    } catch (e) {
      return [];
    }
  }

  async function populateCitySelect() {
    const cities = await fetchCities();
    const sel = document.getElementById("default-city-select");
    sel.innerHTML =
      '<option value="">(none)</option>' +
      cities.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  }

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile/");
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function openModal() {
    const profile = await fetchProfile();
    await populateCitySelect();
    if (profile) {
      document.getElementById("pref-unit").value = profile.unit || "C";
      document.getElementById("pref-email").checked =
        !!profile.email_notifications;
      if (profile.default_city)
        document.getElementById("default-city-select").value =
          profile.default_city;
      document.getElementById("pref-rainfall").value =
        (profile.alert_thresholds && profile.alert_thresholds.rainfall) || "";
      premiumStatus.textContent = profile.is_premium
        ? "Premium Member"
        : "Not a premium member";
      togglePremiumBtn.textContent = profile.is_premium
        ? "Deactivate"
        : "Activate";
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  openBtn && openBtn.addEventListener("click", openModal);
  closeBtn && closeBtn.addEventListener("click", closeModal);

  saveBtn &&
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const payload = {
        unit: document.getElementById("pref-unit").value,
        email_notifications: document.getElementById("pref-email").checked,
        default_city:
          document.getElementById("default-city-select").value || null,
        alert_thresholds: {
          rainfall: Number(document.getElementById("pref-rainfall").value || 0),
        },
      };

      try {
        const res = await fetch("/api/user/profile/", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          alert("Settings saved");
          closeModal();
          location.reload();
        } else {
          const err = await res.json();
          console.error(err);
          alert("Failed to save settings");
        }
      } catch (err) {
        console.error(err);
        alert("Network error");
      }
    });

  togglePremiumBtn &&
    togglePremiumBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/user/subscription/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ action: "toggle" }),
        });
        if (res.ok) {
          const data = await res.json();
          premiumStatus.textContent = data.is_premium
            ? "Premium Member"
            : "Not a premium member";
          togglePremiumBtn.textContent = data.is_premium
            ? "Deactivate"
            : "Activate";
          // reflect change in sidebar if present
          location.reload();
        }
      } catch (e) {
        console.error(e);
      }
    });

  openPremiumPage &&
    openPremiumPage.addEventListener("click", () => {
      window.location.href = "/premium/";
    });
})();
