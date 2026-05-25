import { escapeHtml, formatPerformanceWithUnit } from "./utils.js";

// ── Module state ──────────────────────────────────────────────────────────

const state = {
  athletes: [],
  discipline: null,
  sexFilter: "Any",
  athleteA: null,
  athleteB: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────

const getDisciplines = (athletes) =>
  [...new Set(athletes.map((a) => a.discipline))].sort();

const currentPool = () =>
  state.athletes.filter(
    (a) =>
      a.discipline === state.discipline &&
      (state.sexFilter === "Any" || a.sex === state.sexFilter)
  );

const randomFrom = (list, exclude = null) => {
  const candidates = exclude ? list.filter((a) => a.id !== exclude.id) : list;
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

const qs = (sel, root = document) => root.querySelector(sel);

// ── DOM updates ───────────────────────────────────────────────────────────

const fillSlot = (root, slotId, athlete) => {
  const slotEl = qs(`#duel-slot-${slotId}`, root);
  if (!slotEl) return;

  slotEl.classList.toggle("duel-slot--filled", Boolean(athlete));

  qs(".duel-slot-name", slotEl).textContent = athlete ? athlete.name : "—";
  qs(".duel-slot-meta", slotEl).textContent = athlete
    ? `${athlete.flag} ${athlete.country} · Age ${athlete.age}`
    : "";

  const chip = qs(".athlete-discipline-chip", slotEl);
  if (chip) chip.textContent = athlete ? athlete.discipline : "";
};

const syncGoButton = (root) => {
  const btn = qs("#duel-go-btn", root);
  if (btn) btn.disabled = !state.athleteA || !state.athleteB;
};

const hideResults = (root) => {
  const r = qs("#duel-results", root);
  if (r) r.hidden = true;
};

const syncSexToggles = (root) => {
  root.querySelectorAll(".duel-sex-toggle").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.sex === state.sexFilter);
  });
};

// ── Results ───────────────────────────────────────────────────────────────

const initResultAnimations = (root) => {
  root.querySelectorAll(".duel-record-progress[data-duel-target]").forEach((bar) => {
    const target = parseFloat(bar.dataset.duelTarget || "0");
    const marker = bar.parentElement?.querySelector(".duel-marker-athlete");

    bar.style.transition = "none";
    bar.style.width = "0%";
    if (marker) { marker.style.transition = "none"; marker.style.left = "0%"; }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = "width 1.6s cubic-bezier(0.2, 1, 0.3, 1)";
        bar.style.width = `${target}%`;
        if (marker) {
          marker.style.transition = "left 1.6s cubic-bezier(0.2, 1, 0.3, 1)";
          marker.style.left = `${target}%`;
        }
      });
    });
  });

  // After bars finish, fire the finish-line flash
  setTimeout(() => {
    const resultsEl = root.querySelector("#duel-results");
    if (resultsEl) resultsEl.classList.add("duel-results--flash");
  }, 1750);
};

const renderResults = (root) => {
  const resultsEl = qs("#duel-results", root);
  if (!resultsEl || !state.athleteA || !state.athleteB) return;

  const a = state.athleteA;
  const b = state.athleteB;
  const lowerIsBetter = a.lowerIsBetter;

  const sharedWr = lowerIsBetter
    ? Math.min(a.worldRecordValue, b.worldRecordValue)
    : Math.max(a.worldRecordValue, b.worldRecordValue);

  const ratioA = lowerIsBetter
    ? sharedWr / a.bestPerformanceValue
    : a.bestPerformanceValue / sharedWr;
  const ratioB = lowerIsBetter
    ? sharedWr / b.bestPerformanceValue
    : b.bestPerformanceValue / sharedWr;

  const barA = Math.min(100, Math.max(20, ratioA * 100));
  const barB = Math.min(100, Math.max(20, ratioB * 100));

  const aWins = lowerIsBetter
    ? a.bestPerformanceValue <= b.bestPerformanceValue
    : a.bestPerformanceValue >= b.bestPerformanceValue;

  const perfA = formatPerformanceWithUnit(a.bestPerformanceValue, lowerIsBetter);
  const perfB = formatPerformanceWithUnit(b.bestPerformanceValue, lowerIsBetter);
  const wrText = formatPerformanceWithUnit(sharedWr, lowerIsBetter);
  const wrHolder = lowerIsBetter
    ? (a.worldRecordValue <= b.worldRecordValue ? a.worldRecordHolder : b.worldRecordHolder)
    : (a.worldRecordValue >= b.worldRecordValue ? a.worldRecordHolder : b.worldRecordHolder);

  const margin = Math.abs(a.bestPerformanceValue - b.bestPerformanceValue);
  const marginText = formatPerformanceWithUnit(margin, lowerIsBetter);
  const winnerName = aWins ? a.name : b.name;

  const rowMarkup = (athlete, bar, isWinner, perf) => `
    <div class="duel-compare-row ${isWinner ? "duel-compare-row--winner" : ""}">
      <div class="duel-compare-label">
        <span class="duel-compare-flag">${escapeHtml(athlete.flag)}</span>
        <span class="duel-compare-name">${escapeHtml(athlete.name)}</span>
      </div>
      <div class="duel-record-line-shell">
        <div class="record-line">
          <div class="duel-record-progress record-progress" data-duel-target="${bar.toFixed(2)}"></div>
          <div class="record-marker-athlete duel-marker-athlete"></div>
        </div>
      </div>
      <span class="duel-compare-value">${escapeHtml(perf)}</span>
      <span class="duel-winner-badge ${isWinner ? "" : "duel-winner-badge--hidden"}">Winner</span>
    </div>
  `;

  resultsEl.innerHTML = `
    <div class="duel-results-inner">
      <p class="label-xs">Head to Head · ${escapeHtml(state.discipline)}</p>

      ${rowMarkup(a, barA, aWins, perfA)}
      ${rowMarkup(b, barB, !aWins, perfB)}

      <div class="duel-wr-ref">
        <span>${escapeHtml(wrHolder)}</span>
        <span class="label-xs">World Record · ${escapeHtml(wrText)}</span>
      </div>

      <p class="duel-verdict title-display title-md accent-text">
        ${escapeHtml(winnerName.toUpperCase())} WINS — ${escapeHtml(marginText)}
      </p>
    </div>
  `;

  resultsEl.hidden = false;
  initResultAnimations(root);

  requestAnimationFrame(() => {
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};

// ── Slot markup ───────────────────────────────────────────────────────────

const slotMarkup = (id, label) => `
  <div class="duel-slot" id="duel-slot-${id}">
    <div class="duel-slot-card">
      <div class="duel-athlete-image-shell">
        <img src="./assets/img/profile.png" alt="" />
        <div class="duel-slot-empty-overlay">
          <span class="duel-slot-empty-mark">?</span>
        </div>
        <div class="athlete-overlay"></div>
        <p class="athlete-discipline-chip"></p>
      </div>
      <p class="micro-label duel-slot-label">${label}</p>
      <p class="duel-slot-name">—</p>
      <p class="duel-slot-meta"></p>
      <button class="duel-slot-randomize draw-button draw-button-nav" type="button" data-slot="${id}">
        Randomize
      </button>
    </div>
  </div>
`;

// ── Events ────────────────────────────────────────────────────────────────

const wireEvents = (root) => {
  // Sex filter toggles
  root.querySelectorAll(".duel-sex-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sexFilter = btn.dataset.sex;
      syncSexToggles(root);

      if (state.athleteA && state.sexFilter !== "Any" && state.athleteA.sex !== state.sexFilter) {
        state.athleteA = null;
        fillSlot(root, "a", null);
      }
      if (state.athleteB && state.sexFilter !== "Any" && state.athleteB.sex !== state.sexFilter) {
        state.athleteB = null;
        fillSlot(root, "b", null);
      }

      hideResults(root);
      syncGoButton(root);
    });
  });

  // Discipline select
  const applyDiscipline = (discipline) => {
    state.discipline = discipline;
    const select = qs("#duel-discipline-select", root);
    if (select) select.value = discipline;

    if (state.athleteA && state.athleteA.discipline !== state.discipline) {
      state.athleteA = null;
      fillSlot(root, "a", null);
    }
    if (state.athleteB && state.athleteB.discipline !== state.discipline) {
      state.athleteB = null;
      fillSlot(root, "b", null);
    }

    hideResults(root);
    syncGoButton(root);
  };

  qs("#duel-discipline-select", root).addEventListener("change", (e) => {
    applyDiscipline(e.target.value);
  });

  qs("#duel-discipline-random", root).addEventListener("click", () => {
    const disciplines = getDisciplines(state.athletes);
    const next = randomFrom(disciplines.filter((d) => d !== state.discipline));
    if (next) applyDiscipline(next);
  });

  // Slot randomize buttons
  root.querySelectorAll(".duel-slot-randomize").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slotId = btn.dataset.slot;
      const pool = currentPool();
      const exclude = slotId === "a" ? state.athleteB : state.athleteA;
      const picked = randomFrom(pool, exclude);

      if (slotId === "a") state.athleteA = picked;
      else state.athleteB = picked;

      fillSlot(root, slotId, picked);
      hideResults(root);
      syncGoButton(root);
    });
  });

  // Duel button
  qs("#duel-go-btn", root).addEventListener("click", () => {
    renderResults(root);
  });
};

// ── Public render ─────────────────────────────────────────────────────────

export const renderDuelSection = (root, athletes, selectedAthlete) => {
  const disciplines = getDisciplines(athletes);
  const initialDiscipline = selectedAthlete
    ? selectedAthlete.discipline
    : disciplines[Math.floor(Math.random() * disciplines.length)] ?? null;

  const initialSex = selectedAthlete ? selectedAthlete.sex : "Any";

  state.athletes = athletes;
  state.discipline = initialDiscipline;
  state.sexFilter = initialSex;
  state.athleteA = selectedAthlete ?? null;
  state.athleteB = null;

  const disciplineOptions = disciplines
    .map(
      (d) =>
        `<option value="${escapeHtml(d)}"${d === initialDiscipline ? " selected" : ""}>${escapeHtml(d)}</option>`
    )
    .join("");

  const sexButtons = [
    { value: "Any", label: "Mixed" },
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
  ]
    .map(
      ({ value, label }) =>
        `<button class="wr-podium-toggle duel-sex-toggle${value === initialSex ? " is-active" : ""}" type="button" data-sex="${value}">${label}</button>`
    )
    .join("");

  root.innerHTML = `
    <div class="duel-panel-content">

      <div class="duel-heading">
        <div>
          <p class="label-xs">Head to Head</p>
          <h2 class="display-xl">Duel</h2>
        </div>
        <div class="wr-podium-controls duel-sex-controls">${sexButtons}</div>
        <div class="duel-discipline-stack">
          <label class="input-stack" for="duel-discipline-select">
            <span>Discipline</span>
            <select id="duel-discipline-select">${disciplineOptions}</select>
          </label>
          <button id="duel-discipline-random" class="draw-button draw-button-nav" type="button">Random</button>
        </div>
      </div>

      <div class="duel-arena">
        ${slotMarkup("a", "Athlete A")}
        <div class="duel-vs"><span>VS</span></div>
        ${slotMarkup("b", "Athlete B")}
      </div>

      <div class="duel-cta-row">
        <button id="duel-go-btn" class="draw-button draw-button-hero" type="button" disabled>
          Duel!
        </button>
      </div>

      <div id="duel-results" class="duel-results" hidden></div>

    </div>
  `;

  if (state.athleteA) fillSlot(root, "a", state.athleteA);

  syncGoButton(root);
  wireEvents(root);
};
