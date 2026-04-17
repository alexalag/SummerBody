import { loadAthletesFromCsv } from "./data-loader.js";
import { renderStorySections } from "./render-sections.js";
import { drawAthlete, getCountries } from "./utils.js";

const CSV_URL = "./assets/data/final_data.csv";


const state = {
  ageFilter: "Any",
  sexFilter: "Any",
  countryFilter: "Any",
  athletes: [],
  selectedAthlete: null,
  isLoadingData: true,
  dataError: null
};


const elements = {
  ageFilter: document.getElementById("age-filter"),
  sexFilter: document.getElementById("sex-filter"),
  countryFilter: document.getElementById("country-filter"),
  navDrawButton: document.getElementById("nav-draw-button"),
  heroDrawButton: document.getElementById("hero-draw-button"),
  heroStatusText: document.getElementById("hero-status-text"),
  heroMicroText: document.getElementById("hero-micro-text"),
  storyRoot: document.getElementById("story-root")
};

let revealObserver = null;
let parallaxTicking = false;


const getCanDraw = () => !state.isLoadingData && state.athletes.length > 0;


const getHeroStatus = () => {
  if (state.selectedAthlete) {
    return "A new athlete is ready. Continue scrolling.";
  }
  if (state.isLoadingData) {
    return "Loading real athlete stories from final_data.csv...";
  }
  if (state.dataError) {
    return "Data loading failed. Please check the CSV path and retry.";
  }
  return `${state.athletes.length.toLocaleString()} real athlete stories are ready.`;
};


const renderCountryFilter = () => {
  const countries = getCountries(state.athletes);
  if (!countries.includes(state.countryFilter)) {
    state.countryFilter = "Any";
  }

  elements.countryFilter.innerHTML = countries
    .map((country) => `<option value="${country.replaceAll('"', "&quot;")}">${country}</option>`)
    .join("");
  elements.countryFilter.value = state.countryFilter;
};


const syncButtons = () => {
  const canDraw = getCanDraw();

  if (elements.navDrawButton) {
    elements.navDrawButton.disabled = !canDraw;
    elements.navDrawButton.textContent = state.selectedAthlete ? "Redraw Story" : "Draw";
  }

  elements.heroDrawButton.disabled = !canDraw;
};


const renderHeroTexts = () => {
  const canDraw = getCanDraw();
  elements.heroStatusText.textContent = getHeroStatus();
  elements.heroMicroText.textContent = canDraw
    ? "Balblablabla"
    : "Please wait until real data is ready.";
};


const updateControls = () => {
  renderCountryFilter();
  syncButtons();
  renderHeroTexts();
};


const updateParallax = () => {
  const sections = document.querySelectorAll(".section");
  const viewportHeight = window.innerHeight || 1;

  sections.forEach((section) => {
    const content = section.querySelector(".section-content");
    if (!content) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const translateY = 70 + clampedProgress * -140;
    content.style.setProperty("--parallax-y", `${translateY.toFixed(2)}px`);
  });
};


const requestParallax = () => {
  if (parallaxTicking) {
    return;
  }

  parallaxTicking = true;
  window.requestAnimationFrame(() => {
    updateParallax();
    parallaxTicking = false;
  });
};


const setupSectionEffects = () => {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    {
      threshold: 0.18
    }
  );

  document.querySelectorAll(".section").forEach((section) => revealObserver.observe(section));
  updateParallax();
};

// Pipeline de tirage
const drawStory = () => {
  if (!getCanDraw()) {
    return;
  }

  const athlete = drawAthlete(state.athletes, {
    age: state.ageFilter,
    sex: state.sexFilter,
    country: state.countryFilter
  });

  state.selectedAthlete = athlete;
  renderStorySections(elements.storyRoot, athlete);
  setupSectionEffects();
  syncButtons();
  renderHeroTexts();


  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const intro = document.getElementById("athlete-intro");
      if (intro) {
        intro.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 130);
  });
};


const wireEvents = () => {
  elements.ageFilter.addEventListener("change", (event) => {
    state.ageFilter = event.target.value;
  });

  elements.sexFilter.addEventListener("change", (event) => {
    state.sexFilter = event.target.value;
  });

  elements.countryFilter.addEventListener("change", (event) => {
    state.countryFilter = event.target.value;
  });

  if (elements.navDrawButton) {
    elements.navDrawButton.addEventListener("click", drawStory);
  }
  elements.heroDrawButton.addEventListener("click", drawStory);

  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
};


const init = async () => {
  wireEvents();
  updateControls();
  setupSectionEffects();

  try {
    state.isLoadingData = true;
    state.dataError = null;
    updateControls();

    const athletes = await loadAthletesFromCsv(CSV_URL);
    state.athletes = athletes;
  } catch (error) {
    state.dataError = error instanceof Error ? error.message : "Failed to load athlete dataset.";
  } finally {
    state.isLoadingData = false;
    updateControls();
  }
};

init();
