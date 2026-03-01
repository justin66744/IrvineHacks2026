const API = "/api";

async function getRiskScore(address) {
  const res = await fetch(`${API}/risk/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: address || "" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getListings(zipCode) {
  const url = zipCode ? `${API}/listings?zip_code=${encodeURIComponent(zipCode)}&limit=20` : `${API}/listings?limit=20`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Failed to load listings. Is the backend running?");
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error("Invalid response from server.");
  }
}

async function subscribeAlerts(body) {
  const res = await fetch(`${API}/alerts/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    const msg = Array.isArray(d) ? (d[0] && d[0].msg) || d.map((x) => x.msg || x).join(", ") : (d || res.statusText || "Subscription failed");
    throw new Error(msg);
  }
  return data;
}

async function getAssistance(city, state) {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (state) params.set("state", state || "CA");
  params.set("limit", "30");
  const res = await fetch(`${API}/assistance?${params}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function initRiskPage() {
  const form = document.getElementById("risk-form");
  const addressInput = document.getElementById("risk-address");
  const resultSection = document.getElementById("risk-result");
  const resultLocation = document.getElementById("risk-result-location");
  const resultScore = document.getElementById("risk-result-score");
  const resultLabel = document.getElementById("risk-result-label");
  const resultSummary = document.getElementById("risk-result-summary");
  const resultError = document.getElementById("risk-result-error");

  if (!form || !resultSection) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const address = (addressInput && addressInput.value.trim()) || "";
    resultError && (resultError.textContent = "");
    resultSection.classList.add("loading");
    try {
      const data = await getRiskScore(address);
      resultSection.classList.remove("loading");
      resultSection.classList.add("has-result");
      if (resultLocation) resultLocation.textContent = address || "Your area";
      if (resultScore) resultScore.textContent = `${data.score} / 10`;
      if (resultLabel) resultLabel.textContent = data.label;
      if (resultSummary) resultSummary.textContent = data.explanation || "";
    } catch (err) {
      resultSection.classList.remove("loading");
      if (resultError) resultError.textContent = err.message || "Request failed";
    }
  });
}

function initListingsPage() {
  const form = document.getElementById("listings-form");
  const zipInput = document.getElementById("listings-zip");
  const container = document.getElementById("listings-container");
  const mapEl = document.getElementById("listings-map");
  const sourceEl = document.getElementById("listings-source");
  const errorEl = document.getElementById("listings-error");

  if (!container) return;

  let map = null;
  let markersLayer = null;
  if (mapEl && typeof L !== "undefined") {
    map = L.map("listings-map").setView([33.68, -117.85], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }

  function riskColor(score) {
    if (score >= 7) return "#dc2626";
    if (score >= 5) return "#f59e0b";
    return "#16a34a";
  }

  function updateMapMarkers(listings) {
    if (!markersLayer || !map) return;
    markersLayer.clearLayers();
    const withCoords = listings.filter((l) => l.lat != null && l.lng != null);
    withCoords.forEach((l) => {
      const risk = l.risk || {};
      const score = risk.score != null ? risk.score : 4;
      const marker = L.circleMarker([l.lat, l.lng], {
        radius: 12,
        fillColor: riskColor(score),
        color: "#1f2937",
        weight: 1,
        fillOpacity: 0.85,
      });
      const price = l.price != null ? "$" + Number(l.price).toLocaleString() : "—";
      marker.bindPopup(
        "<strong>" + escapeHtml(l.address || l.id) + "</strong><br>Risk " + score + "/10 · " + escapeHtml(risk.label || "") + "<br>" + escapeHtml(String(price))
      );
      markersLayer.addLayer(marker);
    });
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((l) => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
    }
  }

  function renderListings(listings) {
    if (!listings.length) {
      container.innerHTML = "<p class=\"listings-empty\">No listings or market data for that area. Try a ZIP like 92618 or leave blank for sample areas.</p>";
      updateMapMarkers([]);
      return;
    }
    container.innerHTML = listings
      .map((l) => {
        const risk = l.risk || {};
        const riskClass = risk.score >= 7 ? "high" : risk.score >= 5 ? "moderate" : "low";
        const price = l.price != null ? `$${Number(l.price).toLocaleString()}` : "—";
        const meta = [l.population != null ? `Pop. ${Number(l.population).toLocaleString()}` : null, l.address].filter(Boolean).join(" · ");
        return `
          <article class="listing-shell" data-listing-id="${l.id}">
            <div class="listing-shell-body">
              <div class="listing-shell-head">
                <div>
                  <h2>${escapeHtml(l.address || l.id)}</h2>
                  <p>${price}</p>
                </div>
                <span class="risk-label ${riskClass}">Risk ${risk.score != null ? risk.score : "—"}/10</span>
              </div>
              <div class="listing-meta-row"><span>${escapeHtml(meta)}</span></div>
              ${risk.label ? `<p class="listing-risk-copy">${escapeHtml(risk.label)}</p>` : ""}
            </div>
          </article>`;
      })
      .join("");
    updateMapMarkers(listings);
  }

  async function load(zip) {
    if (errorEl) errorEl.textContent = "";
    container.classList.add("loading");
    container.innerHTML = "<p class=\"listings-empty\">Loading…</p>";
    try {
      const data = await getListings(zip);
      container.classList.remove("loading");
      const list = Array.isArray(data.listings) ? data.listings : [];
      renderListings(list);
      if (sourceEl) sourceEl.textContent = data.source || "";
    } catch (err) {
      container.classList.remove("loading");
      container.innerHTML = "<p class=\"listings-empty\">Could not load listings. Make sure the backend is running (uvicorn app.main:app --reload).</p>";
      if (errorEl) errorEl.textContent = err.message || "Failed to load listings";
      if (markersLayer) markersLayer.clearLayers();
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      load(zipInput ? zipInput.value.trim() : "");
    });
  }
  load(zipInput ? zipInput.value.trim() : "");
}

function initAlertsPage() {
  const form = document.getElementById("alerts-form");
  const messageEl = document.getElementById("alerts-message");

  if (!form) return;

  function setMsg(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.style.color = isError ? "#dc2626" : "#16a34a";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (form.querySelector('[name="email"]') && form.querySelector('[name="email"]').value) ? String(form.querySelector('[name="email"]').value).trim() : "";
    const phone = (form.querySelector('[name="phone"]') && form.querySelector('[name="phone"]').value) ? String(form.querySelector('[name="phone"]').value).trim() : "";
    const zip_code = (form.querySelector('[name="zip_code"]') && form.querySelector('[name="zip_code"]').value) ? String(form.querySelector('[name="zip_code"]').value).trim() : "";
    if (!email && !phone) {
      setMsg("Enter at least email or phone.", true);
      return;
    }
    setMsg("Subscribing…", false);
    try {
      const data = await subscribeAlerts({ email: email || null, phone: phone || null, zip_code: zip_code || null });
      setMsg(data.message || "You're subscribed.", false);
      form.reset();
    } catch (err) {
      setMsg(err && err.message ? err.message : "Subscription failed. Is the backend running?", true);
    }
  });
}

function initAssistancePage() {
  const form = document.getElementById("assistance-form");
  const container = document.getElementById("assistance-programs");
  const errorEl = document.getElementById("assistance-error");

  if (!container) return;

  function render(programs) {
    if (!programs.length) {
      container.innerHTML = "<p class=\"assistance-empty\">No counselors found. Try a different city or state.</p>";
      return;
    }
    container.innerHTML = programs
      .map((p) => `
        <div class="assistance-card">
          <strong>${escapeHtml(p.name || "Program")}</strong>
          ${p.city || p.state ? `<p>${escapeHtml([p.city, p.state].filter(Boolean).join(", "))}</p>` : ""}
          ${p.phone ? `<p><a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a></p>` : ""}
          ${p.url ? `<p><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Website</a></p>` : ""}
        </div>`)
      .join("");
  }

  async function load(city, state) {
    if (errorEl) errorEl.textContent = "";
    container.classList.add("loading");
    try {
      const data = await getAssistance(city, state);
      container.classList.remove("loading");
      render(data.programs || []);
    } catch (err) {
      container.classList.remove("loading");
      render([]);
      if (errorEl) errorEl.textContent = err.message || "Failed to load assistance.";
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const city = (form.querySelector("[name=city]") || {}).value?.trim() || "";
      const state = (form.querySelector("[name=state]") || {}).value?.trim() || "CA";
      load(city, state);
    });
  }
  load("", "CA");
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  if (page === "risk") initRiskPage();
  if (page === "listings") initListingsPage();
  if (page === "alerts") initAlertsPage();
  if (page === "assistance") initAssistancePage();
});
