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

setActiveNav();
setupRevealOnScroll();
setupTiltCards();
startHomeSlideshow();
setupTimelineControl();
setupAlertCards();
setupEmailToggle();
setupFilters();
setupListingPinLinks();
