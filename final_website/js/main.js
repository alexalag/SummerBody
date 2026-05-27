import { loadAthletesFromCsv } from "./data-loader.js";
import { renderStorySections, observer } from "./render-sections.js";
import { drawAthlete, getCountries } from "./utils.js";
import { renderDuelSection } from "./duel.js";

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
  navDuelButton: document.getElementById("nav-duel-button"),
  heroDrawButton: document.getElementById("hero-draw-button"),
  heroStatusText: document.getElementById("hero-status-text"),
  heroMicroText: document.getElementById("hero-micro-text"),
  storyRoot: document.getElementById("story-root"),
  duelRoot: document.getElementById("duel-root"),
  duelDrawer: document.getElementById("duel-drawer"),
  duelDrawerBackdrop: document.getElementById("duel-drawer-backdrop"),
  duelDrawerClose: document.getElementById("duel-drawer-close")
};

let revealObserver = null;
let parallaxTicking = false;


const getCanDraw = () => !state.isLoadingData && state.athletes.length > 0;

const getNbFilteredAthletes = () => {
  return state.athletes.filter((athlete) => {
    const genderMatch = state.sexFilter === "Any" || athlete.sex === state.sexFilter;
    const countryMatch = state.countryFilter === "Any" || athlete.country === state.countryFilter;
    const ageMatch = state.ageFilter === "Any" || (() => { const age = athlete.age;
        switch (state.ageFilter) {
          case "Under 23":
            return age < 23;
          case "23-27":
            return age >= 23 && age <= 27;
          case "28+":
            return age >= 28;

          default:
            return true;
        }
      })();

    return genderMatch && countryMatch && ageMatch;
  });
};

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

  const filteredCount = getNbFilteredAthletes().length;
  return `${filteredCount.toLocaleString()} real athlete stories are ready.`;
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
}
;


const syncButtons = () => {
  const canDraw = getCanDraw();

  if (elements.navDrawButton) {
    elements.navDrawButton.disabled = !canDraw;
    elements.navDrawButton.textContent = state.selectedAthlete ? "Redraw Story" : "Draw";
  }

  elements.heroDrawButton.disabled = !canDraw;
  if (elements.navDuelButton) elements.navDuelButton.disabled = !canDraw;
};


const renderHeroTexts = () => {
  const canDraw = getCanDraw();
  elements.heroStatusText.textContent = getHeroStatus();
  elements.heroMicroText.textContent = canDraw
    ? "Set the filters, then draw an athlete from the dataset."
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
  document.querySelectorAll(".fade-up").forEach((el) => {
    observer.observe(el);
  });
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


const openDuel = () => {
  if (!getCanDraw()) return;

  renderDuelSection(elements.duelRoot, state.athletes, state.selectedAthlete);

  elements.duelDrawer.classList.add("is-open");
  elements.duelDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("duel-open");
};

const closeDuel = () => {
  elements.duelDrawer.classList.remove("is-open");
  elements.duelDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("duel-open");
};


const wireEvents = () => {
  elements.ageFilter.addEventListener("change", (event) => {
    state.ageFilter = event.target.value;
    updateControls();
  });

  elements.sexFilter.addEventListener("change", (event) => {
    state.sexFilter = event.target.value;
    updateControls();
  });

  elements.countryFilter.addEventListener("change", (event) => {
    state.countryFilter = event.target.value;
    updateControls();
  });

  if (elements.navDrawButton) {
    elements.navDrawButton.addEventListener("click", drawStory);
  }
  elements.heroDrawButton.addEventListener("click", drawStory);

  if (elements.navDuelButton) {
    elements.navDuelButton.addEventListener("click", openDuel);
  }

  if (elements.duelDrawerBackdrop) {
    elements.duelDrawerBackdrop.addEventListener("click", closeDuel);
  }

  if (elements.duelDrawerClose) {
    elements.duelDrawerClose.addEventListener("click", closeDuel);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDuel();
  });

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
    console.log(
    [...new Set(state.athletes.map(a => a.country))].sort()
  );
  } catch (error) {
    state.dataError = error instanceof Error ? error.message : "Failed to load athlete dataset.";
  } finally {
    state.isLoadingData = false;
    updateControls();
  }
};

init();
