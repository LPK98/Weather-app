(function () {
  const activateBtn = document.getElementById("activate-premium-btn");
  const deactivateBtn = document.getElementById("deactivate-premium-btn");
  const stateEl = document.getElementById("premium-state");

  function getCookie(name) {
    let value = null;
    document.cookie.split(";").forEach((c) => {
      const [k, v] = c.trim().split("=");
      if (k === name) value = v;
    });
    return value;
  }

  function setPending(isPending) {
    [activateBtn, deactivateBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = isPending;
      btn.classList.toggle("opacity-60", isPending);
      btn.classList.toggle("cursor-not-allowed", isPending);
    });
  }

  function renderState(isPremium) {
    if (!stateEl) return;
    stateEl.textContent = isPremium
      ? "Current plan: Premium"
      : "Current plan: Free";
  }

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile/");
      if (res.status === 403 || res.status === 401) {
        renderState(false);
        if (stateEl) {
          stateEl.textContent = "Sign in required to manage premium status.";
        }
        return null;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function updateSubscription(action) {
    setPending(true);
    try {
      const res = await fetch("/api/user/subscription/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ action }),
      });

      if (res.status === 403 || res.status === 401) {
        alert("Please sign in first to change premium status.");
        window.location.href = "/login/?next=/premium/";
        return;
      }

      if (!res.ok) {
        alert("Could not update subscription right now.");
        return;
      }

      const data = await res.json();
      renderState(!!data.is_premium);
      alert(data.is_premium ? "Premium activated." : "Premium deactivated.");
    } catch (e) {
      alert("Network error while updating subscription.");
    } finally {
      setPending(false);
    }
  }

  activateBtn &&
    activateBtn.addEventListener("click", () => {
      updateSubscription("enable");
    });

  deactivateBtn &&
    deactivateBtn.addEventListener("click", () => {
      updateSubscription("disable");
    });

  fetchProfile().then((profile) => {
    if (profile) renderState(!!profile.is_premium);
  });
})();
