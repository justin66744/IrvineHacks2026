const API_BASE = window.EG_API_BASE || "http://127.0.0.1:8000";

function setActiveNav() {
  const page = document.body.dataset.page;
  const routes = {
    home: "index.html",
    risk: "risk-score.html",
    listings: "listings.html",
    alerts: "alerts.html",
    assistance: "assistance.html"
  };

  document.querySelectorAll(".site-nav a").forEach((link) => {
    if (link.getAttribute("href") === routes[page]) {
      link.classList.add("active");
    }
  });
}

function setupRevealOnScroll() {
  const items = Array.from(document.querySelectorAll(".reveal-on-scroll"));
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.14 }
  );

  items.forEach((item) => observer.observe(item));
}

function setupTiltCards() {
  const nodes = Array.from(document.querySelectorAll("[data-tilt]"));
  if (!nodes.length || window.matchMedia("(max-width: 900px)").matches) {
    return;
  }

  nodes.forEach((node) => {
    node.addEventListener("mousemove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 6;
      const rotateX = (0.5 - y) * 5;
      node.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    node.addEventListener("mouseleave", () => {
      node.style.transform = "";
    });
  });
}

function startHomeSlideshow() {
  const slides = Array.from(document.querySelectorAll(".home-slide"));
  if (slides.length < 2) {
    return;
  }

  let index = 0;
  window.setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }, 3600);
}

function setupTimelineControl() {
  const slider = document.getElementById("ownership-timeline");
  const label = document.getElementById("timeline-label");
  const orb = document.getElementById("risk-orb");
  const orbText = document.getElementById("risk-orb-text");

  if (!slider || !label || !orb || !orbText) {
    return;
  }

  function update() {
    const year = Number(slider.value);
    label.textContent = String(year);

    orb.classList.remove("low-risk", "medium-risk", "high-risk");

    if (year <= 2023) {
      orb.classList.add("low-risk");
      orbText.textContent = "Family ownership is holding";
      return;
    }

    if (year <= 2025) {
      orb.classList.add("medium-risk");
      orbText.textContent = "Investor pressure is building";
      return;
    }

    orb.classList.add("high-risk");
    orbText.textContent = "Elevated family competition";
  }

  slider.addEventListener("input", update);
  update();
}

function setupAlertCards() {
  document.querySelectorAll("[data-expandable]").forEach((card, index) => {
    const button = card.querySelector(".accordion-toggle");
    if (!button) {
      return;
    }

    if (index === 0) {
      card.classList.add("is-open");
    }

    button.addEventListener("click", () => {
      card.classList.toggle("is-open");
    });
  });
}

function setupEmailToggle() {
  const toggle = document.getElementById("email-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOn = toggle.classList.toggle("is-on");
    toggle.setAttribute("aria-pressed", isOn ? "true" : "false");
  });
}

function setupFilters() {
  const filters = Array.from(document.querySelectorAll(".filter-pill"));
  if (!filters.length) {
    return;
  }

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));
      filter.classList.add("active");
    });
  });
}

function setupListingPinLinks() {
  const listings = Array.from(document.querySelectorAll("[data-map-target]"));
  if (!listings.length) {
    return;
  }

  listings.forEach((listing) => {
    const targetId = listing.getAttribute("data-map-target");
    const pin = targetId ? document.getElementById(targetId) : null;

    if (!pin) {
      return;
    }

    function activate() {
      listing.classList.add("is-active");
      pin.classList.add("is-linked");
    }

    function deactivate() {
      listing.classList.remove("is-active");
      pin.classList.remove("is-linked");
    }

    listing.addEventListener("mouseenter", activate);
    listing.addEventListener("mouseleave", deactivate);
    listing.addEventListener("focusin", activate);
    listing.addEventListener("focusout", deactivate);
  });
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.detail || message;
    } catch {
      message = await res.text();
    }
    throw new Error(message);
  }
  return res.json();
}

function toLabel(label) {
  const value = String(label || "").toLowerCase();
  if (value.includes("high")) {
    return "High";
  }
  if (value.includes("moderate") || value.includes("medium")) {
    return "Moderate";
  }
  return "Low";
}

function toStatusText(label) {
  const normalized = toLabel(label);
  if (normalized === "High") {
    return "High Investor Activity";
  }
  if (normalized === "Moderate") {
    return "Moderate Investor Activity";
  }
  return "Low Investor Activity";
}

function setBar(el, value, fallbackClass) {
  if (!el) {
    return;
  }
  el.style.width = `${value}%`;
  el.classList.remove("fill-62", "fill-48", "fill-71");
  if (fallbackClass) {
    el.classList.add(fallbackClass);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Price unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function pseudoDays(index, score) {
  const seed = (Number(score) || 3) + index * 4;
  return (seed % 23) + 3;
}

function tagsForListing(item) {
  const tags = [];
  if (item?.risk?.score >= 7 || item?.risk?.explanation?.toLowerCase().includes("llc")) {
    tags.push("LLC Nearby");
  }
  if (item?.risk?.explanation?.toLowerCase().includes("cash")) {
    tags.push("High Cash Activity");
  }
  if (!tags.length && item?.risk?.score >= 5) {
    tags.push("Investor Watch");
  }
  return tags;
}

async function initRiskPage() {
  if (document.body.dataset.page !== "risk") {
    return;
  }

  const section = document.querySelector("[data-risk-address]");
  const mapCanvas = document.getElementById("risk-map-canvas");
  if (!section || !mapCanvas || !window.L) {
    return;
  }

  const form = document.getElementById("risk-search-form");
  const input = document.getElementById("risk-search-input");
  const stage = document.getElementById("risk-map-stage");
  const slider = document.getElementById("risk-timeline-slider");
  const sliderLabel = document.getElementById("risk-timeline-label");
  const investorLine = document.getElementById("risk-investor-line");
  const familyLine = document.getElementById("risk-family-line");
  const drawer = document.getElementById("risk-detail-drawer");
  const drawerClose = document.getElementById("risk-drawer-close");
  const drawerTitle = document.getElementById("risk-drawer-title");
  const drawerDetail = document.getElementById("risk-drawer-detail");
  const drawerMeta = document.getElementById("risk-drawer-meta");
  const drawerBody = document.getElementById("risk-drawer-body");
  const locationEl = document.getElementById("risk-location");
  const scoreText = document.getElementById("risk-score-text");
  const labelText = document.getElementById("risk-label-text");
  const summaryText = document.getElementById("risk-summary-text");
  const llcValue = document.getElementById("risk-metric-llc-value");
  const cashValue = document.getElementById("risk-metric-cash-value");
  const repeatValue = document.getElementById("risk-metric-repeat-value");
  const llcBar = document.getElementById("risk-metric-llc-bar");
  const cashBar = document.getElementById("risk-metric-cash-bar");
  const repeatBar = document.getElementById("risk-metric-repeat-bar");
  const buyerLines = Array.from(document.querySelectorAll(".buyer-line"));
  const defaultLocation = (section.getAttribute("data-risk-address") || "Irvine, CA").trim();

  const toggleMap = {
    llc: document.getElementById("toggle-llc"),
    cash: document.getElementById("toggle-cash"),
    repeat: document.getElementById("toggle-repeat"),
    trend: document.getElementById("toggle-trend")
  };

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Present"];
  let currentLocation = (input?.value || defaultLocation).trim() || defaultLocation;
  let debounceId = null;

  const map = L.map(mapCanvas, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([33.6846, -117.8265], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  const ownerLayer = L.layerGroup().addTo(map);
  const llcLayer = L.layerGroup().addTo(map);
  const cashLayer = L.layerGroup().addTo(map);
  const repeatLayer = L.layerGroup().addTo(map);
  const trendLayer = L.layerGroup().addTo(map);

  function polylinePoints(values, maxY) {
    const startX = 16;
    const step = 46;
    const chartHeight = 138;
    return values
      .slice(0, 8)
      .map((value, index) => {
        const normalized = Math.max(0, Math.min(100, Number(value) || 0));
        const y = Math.round(chartHeight - (normalized / 100) * maxY);
        const x = startX + step * index;
        return `${x},${y}`;
      })
      .join(" ");
  }

  function openDrawer(data) {
    if (!drawer || !stage || !data) {
      return;
    }
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    stage.classList.add("with-drawer");
    if (drawerTitle) drawerTitle.textContent = data.title || "Market Detail";
    if (drawerDetail) drawerDetail.textContent = data.detail || "";
    if (drawerMeta) drawerMeta.textContent = data.meta || "";
    if (drawerBody) drawerBody.textContent = data.body || "";
  }

  function closeDrawer() {
    if (!drawer || !stage) {
      return;
    }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    stage.classList.remove("with-drawer");
  }

  function syncLayerVisibility() {
    [
      { control: toggleMap.llc, layer: llcLayer },
      { control: toggleMap.cash, layer: cashLayer },
      { control: toggleMap.repeat, layer: repeatLayer },
      { control: toggleMap.trend, layer: trendLayer }
    ].forEach(({ control, layer }) => {
      if (!control) {
        return;
      }

      if (control.checked) {
        if (!map.hasLayer(layer)) {
          layer.addTo(map);
        }
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }

  function updateTrend(trend) {
    if (slider && sliderLabel) {
      const index = Math.max(0, Math.min(monthLabels.length - 1, Number(slider.value) - 1));
      sliderLabel.textContent = trend?.months?.[index] || monthLabels[index];
    }
    if (investorLine) {
      investorLine.setAttribute("points", polylinePoints(trend?.investor || [], 110));
    }
    if (familyLine) {
      familyLine.setAttribute("points", polylinePoints(trend?.family || [], 70));
    }
  }

  function updateBreakdown(breakdown) {
    const llc = Number(breakdown?.llc) || 0;
    const cash = Number(breakdown?.cash) || 0;
    const repeat = Number(breakdown?.repeat) || 0;

    if (llcValue) llcValue.textContent = `${llc}%`;
    if (cashValue) cashValue.textContent = `${cash}%`;
    if (repeatValue) repeatValue.textContent = `${repeat}%`;

    setBar(llcBar, llc, "fill-62");
    setBar(cashBar, cash, "fill-48");
    setBar(repeatBar, repeat, "fill-71");
  }

  function updateBuyers(buyers) {
    buyers.slice(0, 4).forEach((buyer, index) => {
      const row = buyerLines[index];
      if (!row) {
        return;
      }
      const name = row.querySelector("span");
      const count = row.querySelector("strong");
      if (name) {
        name.textContent = buyer.name;
      }
      if (count) {
        count.textContent = `${buyer.count} properties`;
      }
    });
  }

  function clearRiskLayers() {
    ownerLayer.clearLayers();
    llcLayer.clearLayers();
    cashLayer.clearLayers();
    repeatLayer.clearLayers();
    trendLayer.clearLayers();
  }

  function markerColor(kind) {
    if (kind === "owner") {
      return "#16a34a";
    }
    if (kind === "llc") {
      return "#111827";
    }
    return "#dc2626";
  }

  function drawMapPayload(data) {
    clearRiskLayers();

    if (data?.center?.lat && data?.center?.lng) {
      map.setView([data.center.lat, data.center.lng], data.zoom || 14, { animate: true });
    }

    (data.markers || []).forEach((item) => {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: markerColor(item.kind),
        fillOpacity: 0.96
      });

      marker.bindPopup(
        `<strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(item.detail)}</div><div>${escapeHtml(item.date)}</div>`
      );
      marker.on("click", () => {
        openDrawer({
          title: item.title,
          detail: item.detail,
          meta: item.date,
          body: `${item.label} near this address.`
        });
      });

      if (item.kind === "owner") {
        marker.addTo(ownerLayer);
      } else if (item.kind === "llc") {
        marker.addTo(llcLayer);
      } else {
        marker.addTo(cashLayer);
      }
    });

    (data.clusters || []).forEach((cluster) => {
      const heat = L.circle([cluster.lat, cluster.lng], {
        radius: 120 + cluster.count * 14,
        color: "#ef4444",
        weight: 1,
        fillColor: "#ef4444",
        fillOpacity: 0.12
      });
      const marker = L.circleMarker([cluster.lat, cluster.lng], {
        radius: 12 + Math.min(cluster.count, 8),
        color: "#ffffff",
        weight: 2,
        fillColor: "#dc2626",
        fillOpacity: 0.94
      });

      marker.bindPopup(
        `<strong>${escapeHtml(cluster.title)}</strong><div>${escapeHtml(cluster.detail)}</div><div>Top buyer: ${escapeHtml(cluster.top_buyer)}</div>`
      );
      marker.on("click", () => {
        openDrawer({
          title: cluster.title,
          detail: cluster.detail,
          meta: "Last 90 days",
          body: `Top buyer: ${cluster.top_buyer}. View flagged listings in this zone to act quickly.`
        });
      });

      heat.addTo(trendLayer);
      marker.addTo(repeatLayer);
    });

    syncLayerVisibility();
  }

  async function loadRisk(addressValue) {
    const submitted = addressValue === undefined ? currentLocation : String(addressValue).trim();
    const address = submitted || defaultLocation;
    currentLocation = address;
    if (input && !String(input.value || "").trim()) {
      input.value = address;
    }

    try {
      const month = Math.max(1, Math.min(12, Number(slider?.value || 12)));
      const [risk, mapData] = await Promise.all([
        apiPost("/risk/score", { address }),
        apiGet(`/risk/map?location=${encodeURIComponent(address)}&month=${month}`)
      ]);

      const score = Number(risk.score) || 0;
      if (locationEl) {
        locationEl.textContent = mapData.location || address;
      }
      if (scoreText) {
        scoreText.textContent = `Risk Score: ${score} / 10`;
      }
      if (labelText) {
        labelText.textContent = toStatusText(risk.label);
      }
      if (summaryText) {
        summaryText.textContent = risk.explanation || "";
      }

      updateBreakdown(mapData.breakdown || {});
      updateTrend(mapData.trend || {});
      updateBuyers(mapData.buyers || []);
      drawMapPayload(mapData);
      closeDrawer();
    } catch (error) {
      console.error(error);
    }
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    loadRisk((input?.value || "").trim());
  });

  Object.values(toggleMap).forEach((control) => {
    control?.addEventListener("change", syncLayerVisibility);
  });

  slider?.addEventListener("input", () => {
    const value = Math.max(1, Math.min(12, Number(slider.value)));
    if (sliderLabel) {
      sliderLabel.textContent = monthLabels[value - 1];
    }
    window.clearTimeout(debounceId);
    debounceId = window.setTimeout(() => {
      loadRisk((input?.value || currentLocation).trim());
    }, 120);
  });
  drawerClose?.addEventListener("click", closeDrawer);
  await loadRisk(currentLocation);
}

function renderListings(items) {
  const container = document.getElementById("listing-results");
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `<div class="listing-shell"><div class="listing-shell-body"><h2>No listings found</h2><p>Try another ZIP code or adjust the filters.</p></div></div>`;
    return;
  }

  const images = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80"
  ];

  container.innerHTML = items
    .map((item, index) => {
      const label = toLabel(item?.risk?.label);
      const days = pseudoDays(index, item?.risk?.score);
      const tags = tagsForListing(item);
      const pinId = `listing-pin-${String.fromCharCode(97 + (index % 3))}`;
      return `
        <article class="listing-shell" data-map-target="${pinId}">
          <img src="${images[index % images.length]}" alt="${escapeHtml(item.address)} exterior">
          <div class="listing-shell-body">
            <div class="listing-shell-head">
              <div>
                <h2>${escapeHtml(item.address)}</h2>
                <p>${formatPrice(item.price)}</p>
              </div>
              <span class="risk-label ${label.toLowerCase()}">${label}</span>
            </div>
            <div class="listing-meta-row">
              <span>${days} days on market</span>
              <span>${escapeHtml(item.source || "Market data")}</span>
            </div>
            <div class="listing-tag-line">
              ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateListingPins(items) {
  const pinIds = ["listing-pin-a", "listing-pin-b", "listing-pin-c"];
  const mapFrame = document.getElementById("listings-map-frame");
  const searchInput = document.getElementById("listings-search-input");

  if (mapFrame && searchInput) {
    const search = encodeURIComponent(searchInput.value || "92618");
    mapFrame.src = `https://www.google.com/maps?q=${search}&z=14&output=embed`;
  }

  pinIds.forEach((id, index) => {
    const pin = document.getElementById(id);
    if (!pin) {
      return;
    }
    const item = items[index];
    if (!item) {
      pin.style.display = "none";
      return;
    }

    pin.style.display = "";
    const label = toLabel(item?.risk?.label);
    pin.classList.remove("pin-low", "pin-moderate", "pin-high");
    pin.classList.add(`pin-${label.toLowerCase()}`);

    const card = pin.querySelector(".listing-pin-card");
    if (card) {
      const days = pseudoDays(index, item?.risk?.score);
      card.innerHTML = `${escapeHtml(item.address)}<small>${label} risk · ${days} days on market</small>`;
    }
  });
}

function applyListingFilters(items) {
  const price = document.getElementById("filter-price")?.value || "";
  const risk = document.getElementById("filter-risk")?.value || "";
  const days = document.getElementById("filter-days")?.value || "";
  const buyer = document.getElementById("filter-buyer")?.value || "";

  return items.filter((item, index) => {
    const listingPrice = Number(item.price) || 0;
    const riskLabel = toLabel(item?.risk?.label);
    const listingDays = pseudoDays(index, item?.risk?.score);
    const tags = tagsForListing(item).join(" ").toLowerCase();

    if (price) {
      const [min, max] = price.split("-").map(Number);
      if (listingPrice < min || listingPrice > max) {
        return false;
      }
    }

    if (risk && riskLabel !== risk) {
      return false;
    }

    if (days) {
      const [minDays, maxDays] = days.split("-").map(Number);
      if (listingDays < minDays || listingDays > maxDays) {
        return false;
      }
    }

    if (buyer === "llc" && !tags.includes("llc")) {
      return false;
    }
    if (buyer === "cash" && !tags.includes("cash")) {
      return false;
    }

    return true;
  });
}

async function initListingsPage() {
  if (document.body.dataset.page !== "listings") {
    return;
  }

  const searchInput = document.getElementById("listings-search-input");
  const controls = ["filter-price", "filter-risk", "filter-days", "filter-buyer"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let sourceItems = [];

  async function load() {
    const zip = (searchInput?.value || "").trim() || "92618";
    try {
      const data = await apiGet(`/listings?zip_code=${encodeURIComponent(zip)}&limit=9`);
      sourceItems = Array.isArray(data.listings) ? data.listings : [];
    } catch (error) {
      console.error(error);
    }
    render();
  }

  function render() {
    const filtered = applyListingFilters(sourceItems);
    renderListings(filtered);
    updateListingPins(filtered);
    setupListingPinLinks();
  }

  searchInput?.addEventListener("change", load);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      load();
    }
  });
  controls.forEach((control) => control.addEventListener("change", render));

  await load();
}

async function renderAlertsFeed(zip) {
  const feed = document.getElementById("alerts-feed");
  if (!feed) {
    return;
  }

  try {
    const data = await apiGet(`/listings?zip_code=${encodeURIComponent(zip || "92618")}&limit=3`);
    const items = Array.isArray(data.listings) ? data.listings : [];
    if (!items.length) {
      return;
    }

    feed.innerHTML = items
      .map((item, index) => {
        const label = toLabel(item?.risk?.label);
        const details = [
          item?.risk?.signals?.[0],
          tagsForListing(item)[0],
          `${pseudoDays(index, item?.risk?.score)} days on market`
        ].filter(Boolean)[0] || "Live market activity";

        return `
          <div class="linear-row">
            <span>${escapeHtml(item.address)}</span>
            <span>${escapeHtml(item.source || "Live feed")}</span>
            <span>${escapeHtml(details)}</span>
            <strong>${label}</strong>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error(error);
  }
}

function initAlertsPage() {
  if (document.body.dataset.page !== "alerts") {
    return;
  }

  const form = document.getElementById("alerts-subscribe-form");
  const status = document.getElementById("alerts-subscribe-status");
  const email = document.getElementById("alerts-email");
  const zip = document.getElementById("alerts-zip");

  renderAlertsFeed(zip?.value || "92618");

  if (!form || !status) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Submitting...";
    try {
      const result = await apiPost("/alerts/subscribe", {
        email: email?.value || undefined,
        zip_code: zip?.value || undefined
      });
      status.textContent = result.message || "Subscription saved.";
      renderAlertsFeed(zip?.value || "92618");
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Subscription failed";
    }
  });
}

function renderAssistancePrograms(programs) {
  const list = document.getElementById("assistance-program-list");
  if (!list) {
    return;
  }

  if (!programs.length) {
    list.innerHTML = `<div class="assistance-program-row"><span>No programs found for this search.</span></div>`;
    return;
  }

  list.innerHTML = programs
    .slice(0, 6)
    .map((program) => {
      const location = [program.city, program.state].filter(Boolean).join(", ");
      return `
        <div class="assistance-program-row">
          <div>
            <strong>${escapeHtml(program.name || "Housing Counselor")}</strong>
            <span>${escapeHtml(location || "Location unavailable")}</span>
          </div>
          <div class="assistance-program-meta">
            <span>${escapeHtml(program.phone || "Phone unavailable")}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateAssistanceSummary(programs) {
  const summary = document.getElementById("assistance-summary");
  if (!summary || !programs.length) {
    return;
  }

  const first = programs[0] || {};
  const second = programs[1] || {};
  const third = programs[2] || {};

  summary.innerHTML = `
    <div>
      <span class="band-label">Top Match</span>
      <strong>${escapeHtml(first.name || "Housing Counselor")}</strong>
    </div>
    <div>
      <span class="band-label">Location</span>
      <strong>${escapeHtml([second.city || first.city, second.state || first.state].filter(Boolean).join(", ") || "Irvine, CA")}</strong>
    </div>
    <div>
      <span class="band-label">Contact</span>
      <strong>${escapeHtml((third.phone || second.phone || first.phone || "Available on request"))}</strong>
    </div>
  `;
}

function initAssistancePage() {
  if (document.body.dataset.page !== "assistance") {
    return;
  }

  const form = document.getElementById("assistance-search-form");
  const city = document.getElementById("assistance-city");
  const state = document.getElementById("assistance-state");
  const status = document.getElementById("assistance-status");

  async function load() {
    if (status) {
      status.textContent = "Loading programs...";
    }
    const cityValue = (city?.value || "Irvine").trim();
    const stateValue = (state?.value || "CA").trim() || "CA";
    try {
      const data = await apiGet(`/assistance?city=${encodeURIComponent(cityValue)}&state=${encodeURIComponent(stateValue)}&limit=6`);
      const programs = Array.isArray(data.programs) ? data.programs : [];
      renderAssistancePrograms(programs);
      updateAssistanceSummary(programs);
      if (status) {
        status.textContent = data.source || "Programs loaded.";
      }
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : "Unable to load programs";
      }
    }
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    load();
  });

  load();
}

setActiveNav();
setupRevealOnScroll();
setupTiltCards();
startHomeSlideshow();
setupTimelineControl();
setupAlertCards();
setupEmailToggle();
setupFilters();
setupListingPinLinks();
initRiskPage();
initListingsPage();
initAlertsPage();
initAssistancePage();
