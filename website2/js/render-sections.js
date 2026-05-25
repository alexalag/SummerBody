import {
  escapeHtml,
  formatDelta,
  formatPerformanceWithUnit,
  getAverageGap,
  getAverageHeadline,
  getGapToRecord,
  getPrimeNarrative,
  getRecordProgressRatio
} from "./utils.js";
import { initWorldMap } from "./world-map.js";
import { initWorldRecordPodium } from "./world-record-podium.js";
import { initRecordReigns } from "./record-reigns.js";
import { getFlagFromNat } from "./nation-meta.js";


const TARGET_YEAR = 2026;


const sectionShell = (id, innerHtml, extraClass = "") => `
  <section id="${id}" class="section ${extraClass}">
    <div class="section-content">
      ${innerHtml}
    </div>
  </section>
`;

const renderLeaderboardRow = (entry) => `
  <div class="leaderboard-row${entry.isSelected ? " is-selected" : ""}">
    <span class="leaderboard-rank">#${escapeHtml(entry.position)}</span>
    <span class="leaderboard-athlete">
      <span>${escapeHtml(entry.name)}</span>
      <span>${escapeHtml(entry.flag)} ${escapeHtml(entry.country)} - ${escapeHtml(entry.date)}</span>
    </span>
    <span class="leaderboard-mark">${escapeHtml(entry.mark)}</span>
  </div>
`;

const renderLeaderboardRows = (athlete) => {
  const rows = athlete.leaderboardTop || [];
  const selectedInTop = rows.some((entry) => entry.isSelected);
  const selectedEntry = athlete.leaderboardAthleteEntry;
  const visibleRows = rows.map(renderLeaderboardRow).join("");
  const selectedRow =
    !selectedInTop && selectedEntry
      ? `
        <div class="leaderboard-gap">Where this athlete stands</div>
        ${renderLeaderboardRow(selectedEntry)}
      `
      : "";

  return visibleRows + selectedRow;
};

// Section 1
const renderAthleteIntroSection = (athlete) =>
  sectionShell(
    "athlete-intro",
    `
      <div class="athlete-intro-layout">
        <div class="athlete-intro-track">
          <div class="athlete-intro-page">
            <div class="story-grid">
              <p class="label-xs">Athlete</p>
              <h2 class="title-display title-lg">${escapeHtml(athlete.name)}</h2>
              <div class="athlete-meta">
                <span>Age ${escapeHtml(athlete.age)}</span>
                <span>${escapeHtml(athlete.sex)}</span>
                <span>${escapeHtml(athlete.country)}</span>
                <span>${escapeHtml(athlete.discipline)}</span>
              </div>
              <div class="athlete-intro-actions">
                <button class="leaderboard-toggle" type="button" aria-expanded="false" aria-controls="athlete-leaderboard-panel">
                  See Leaderboard
                </button>
              </div>
            </div>

            <div class="athlete-visual">
              <div class="athlete-image-shell">
                <img src="${escapeHtml(athlete.athleteImage)}" alt="${escapeHtml(athlete.name)} silhouette" />
                <div class="athlete-flag">${escapeHtml(athlete.flag)}</div>
                <div class="athlete-overlay"></div>
                <div class="athlete-discipline-chip">${escapeHtml(athlete.discipline)}</div>
              </div>
            </div>
          </div>

          <aside id="athlete-leaderboard-panel" class="leaderboard-panel" aria-hidden="true">
            <div class="leaderboard-panel-head">
              <div>
                <p class="label-xs">Leaderboard</p>
                <h3>${escapeHtml(athlete.discipline)}</h3>
                <p>${escapeHtml(athlete.sex)} - best marks in the dataset</p>
              </div>
              <button class="leaderboard-close" type="button" aria-label="Return to athlete profile">Athlete Profile</button>
            </div>
            <div class="leaderboard-list">
              ${renderLeaderboardRows(athlete)}
            </div>
          </aside>
        </div>
      </div>
    `
  );

// Section 2
const renderBestPerformanceSection = (athlete) =>
  sectionShell(
    "best-performance",
    `
      <div class="story-grid center-text">
        <p class="label-xs">Best Performance</p>
        <div class="story-grid">
          <p class="best-performance-value">${escapeHtml(athlete.bestPerformance)}</p>
          <p class="best-performance-discipline fade-up delay_str1">In ${escapeHtml(athlete.discipline)}</p>
          <p class="serif-italic fade-up delay_str2">${escapeHtml(athlete.bestPerformancePlace)} (${escapeHtml(athlete.bestPerformanceDate)})</p>
        </div>
      </div>
    `
  );



// Section 3
const renderWorldRecordSection = (athlete) => {
  const gap = Math.max(getGapToRecord(athlete), 0);
  const ratio = getRecordProgressRatio(athlete);
  const athletePosition = 18 + ((ratio - 0.7) / 0.3) * 58;
  const statement =
    athlete.performanceUnit === "meters" ? `${gap.toFixed(2)} m FROM THE WORLD RECORD` : formatDelta(gap, "seconds");

  return sectionShell(
    "world-record-comparison",
    `
      <div class="story-grid">
        <h3 class="title-display title-lg">
          Against
          <br />
          World Record
        </h3>
        <p class="record-discipline">In ${escapeHtml(athlete.discipline)}</p>

        <div class="record-line-shell">
          <div class="record-line">
            <div class="record-progress" data-target-width="${athletePosition.toFixed(4)}"></div>
            <div class="record-marker-athlete" data-target-left="${athletePosition.toFixed(4)}"></div>
            <div class="record-marker-wr"></div>
          </div>

          <div class="record-line-meta">
            <span class="record-line-person">
              <span>${escapeHtml(athlete.name)}</span>
              <span>${escapeHtml(athlete.bestPerformanceDate)}</span>
            </span>
            <span class="record-line-person">
              <span>${escapeHtml(athlete.worldRecordHolder)}</span>
              <span>${escapeHtml(athlete.worldRecordDate)}</span>
            </span>
          </div>

          <div class="record-line-values">
            <span>${escapeHtml(athlete.bestPerformance)}</span>
            <span>${escapeHtml(athlete.worldRecord)}</span>
          </div>
        </div>

        <p class="title-display title-md accent-text fade-up delay_str1">${escapeHtml(statement)}</p>
      </div>
    `
  );
};

// Section 4
const renderAverageComparisonSection = (athlete) => {
  const headline = getAverageHeadline(athlete);
  const gap = getAverageGap(athlete);
  const betterThanAverage = gap >= 0;
  const absGap = Math.abs(gap);
  const delta =
    athlete.performanceUnit === "meters"
      ? `${absGap.toFixed(2)} m ${betterThanAverage ? "BETTER THAN" : "BEHIND"} CATEGORY AVERAGE`
      : `${absGap.toFixed(2)} sec ${betterThanAverage ? "BETTER THAN" : "BEHIND"} CATEGORY AVERAGE`;
  const athleteDominance = Math.min(92, Math.max(54, 58 + (Math.abs(gap) * 26) / Math.max(1, athlete.averagePerformanceValue)));

  return sectionShell(
    "average-comparison",
    `
      <div class="average-layout">
        <div class="story-grid">
          <p class="label-xs">Comparison to average athlete</p>
          <h3 class="title-display title-lg">${escapeHtml(headline)}</h3>
          <p class="serif-italic headline-serif accent-text fade-up delay_str1">${escapeHtml(delta)}</p>
        </div>

        <div class="story-grid">
          <div class="average-silhouette-shell">
            <div class="silhouette silhouette-average" style="left:20%">
              <div class="silhouette-shape"></div>
              <span class="silhouette-label">Average</span>
            </div>

            <div class="silhouette silhouette-athlete" style="left:${athleteDominance}%">
              <div class="silhouette-shape"></div>
              <span class="silhouette-label">${escapeHtml(athlete.name)}</span>
            </div>
          </div>

          <div class="record-line-values">
            <span>${escapeHtml(athlete.averagePerformance)}</span>
            <span>${escapeHtml(athlete.bestPerformance)}</span>
          </div>
        </div>
      </div>
    `
  );
};

// Section 5
const initPeakAgeAnimation = (root) => {
  const section = root.querySelector("#peak-age-analysis");
  if (!section) return;

  const motion = section.querySelector(".peak-dot-motion");
  const ageLabel = section.querySelector(".peak-age-label");
  if (!motion || !ageLabel) return;

  const triggerAnimation = () => {
    motion.beginElement();

    setTimeout(() => {
      const svg = section.querySelector("svg");
      const traveler = section.querySelector(".peak-dot-traveler");
      const bbox = traveler.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const scaleX = parseFloat(svg.getAttribute("viewBox").split(" ")[2]) / svgRect.width;
      const scaleY = parseFloat(svg.getAttribute("viewBox").split(" ")[3]) / svgRect.height;
      const vx = (bbox.left - svgRect.left + bbox.width / 2) * scaleX;
      const vy = (bbox.top - svgRect.top + bbox.height / 2) * scaleY;

      ageLabel.setAttribute("x", vx + 12);
      ageLabel.setAttribute("y", vy + 20);
      ageLabel.setAttribute("opacity", "1");
    }, 3000);
  };

  if (section.classList.contains("in-view")) {
    requestAnimationFrame(triggerAnimation);
    return;
  }

  const mo = new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class" &&
        section.classList.contains("in-view")
      ) {
        observer.disconnect();
        requestAnimationFrame(triggerAnimation);
      }
    }
  });

  mo.observe(section, { attributes: true, attributeFilter: ["class"] });
};

const renderHistoricalSection = (athlete) => {
  const width = 1080;
  const height = 360;
  const padding = 38;

  const sortedHistory = [...athlete.recordHistory].sort((a, b) => a.year - b.year);
  const historyUntilTarget = sortedHistory.filter((point) => point.year <= TARGET_YEAR);
  const effectiveHistory =
    historyUntilTarget.length > 0
      ? historyUntilTarget
      : sortedHistory.length > 0
        ? [sortedHistory[0]]
        : [{ year: TARGET_YEAR - 1, value: athlete.worldRecordValue }];

  const hasPointAtTarget = effectiveHistory.some((point) => point.year === TARGET_YEAR);
  const lastReal = effectiveHistory[effectiveHistory.length - 1];
  const projectedHistory = hasPointAtTarget
    ? [...effectiveHistory]
    : [
        ...effectiveHistory,
        {
          year: TARGET_YEAR,
          value: lastReal?.value ?? athlete.worldRecordValue,
          name: lastReal?.name ?? null,
          nat: lastReal?.nat ?? null
        }
      ];

  const minYear = Math.min(projectedHistory[0]?.year ?? TARGET_YEAR - 1, TARGET_YEAR - 1);
  const maxYear = TARGET_YEAR;
  const yearRange = Math.max(1, maxYear - minYear);

  const values = [...projectedHistory.map((point) => point.value), athlete.bestPerformanceValue];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(0.0001, maxValue - minValue);

  const xForYear = (year) => {

    const clampedYear = Math.min(Math.max(year, minYear), maxYear);
    return padding + ((clampedYear - minYear) / yearRange) * (width - padding * 2);
  };

  const yForValue = (value) => {

    const normalized = athlete.lowerIsBetter ? (value - minValue) / valueRange : (maxValue - value) / valueRange;
    return padding + normalized * (height - padding * 2);
  };

  const formatValue = (value) => formatPerformanceWithUnit(value, athlete.lowerIsBetter);
  const pathD = projectedHistory
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xForYear(point.year)} ${yForValue(point.value)}`)
    .join(" ");

  const recordPoints = projectedHistory.map((point, index) => {
    const x = xForYear(point.year);
    const y = yForValue(point.value);
    return {
      id: `record-${point.year}-${index}`,
      year: point.year,
      x,
      y,
      label: `${point.year} — ${formatValue(point.value)}`,
      name: point.name || null,
      flag: point.nat ? getFlagFromNat(point.nat) : ""
    };
  });

  const currentRecordPoint = recordPoints[recordPoints.length - 1] ?? {
    year: TARGET_YEAR,
    x: xForYear(TARGET_YEAR),
    y: yForValue(athlete.worldRecordValue)
  };
  const athleteYear = Math.min(Math.max(athlete.athleteEraYear, minYear), maxYear);
  const athleteX = xForYear(athleteYear);
  const athleteY = yForValue(athlete.bestPerformanceValue);

  const pointsMarkup = recordPoints
    .map((point) => {
      const isTargetPoint = point.year === TARGET_YEAR;
      const radius = isTargetPoint ? 5.2 : 4;
      const fill = isTargetPoint ? "#f3f1ed" : "#e44f2c";
      const stroke = isTargetPoint ? "#e44f2c" : "#f3f1ed";
      const strokeWidth = isTargetPoint ? 2 : 1.4;
      return `
        <!-- Point interactif: le tooltip lit les data-* associes. -->
        <g class="historical-point" data-point-id="${escapeHtml(point.id)}" data-point-label="${escapeHtml(point.label)}" data-x="${point.x}" data-y="${point.y}" data-point-name="${escapeHtml(point.name || "")}" data-point-flag="${escapeHtml(point.flag || "")}">
          <circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
          <title>${escapeHtml(point.label)}</title>
        </g>
      `;
    })
    .join("");

  const athleteLabel = `${athlete.name} (${athleteYear}) - ${formatValue(athlete.bestPerformanceValue)}`;

  return sectionShell(
    "historical-perspective",
    `
      <div class="story-grid">
        <h3 class="title-display title-lg">
          How the
          <br />
          Limit Moved
        </h3>

        <div class="historical-shell">
          <svg viewBox="0 0 ${width} ${height}">
            <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(29,29,27,0.2)" stroke-width="1" />
            <path d="${pathD}" fill="none" stroke="rgba(228,79,44,0.85)" stroke-width="2.4" stroke-linecap="round" />

            ${pointsMarkup}

            <g class="historical-point" data-point-id="athlete-point" data-point-label="${escapeHtml(athleteLabel)}" data-x="${athleteX}" data-y="${athleteY}">
              <circle cx="${athleteX}" cy="${athleteY}" r="7" fill="#f3f1ed" stroke="#e44f2c" stroke-width="2.4" />
              <title>${escapeHtml(athleteLabel)}</title>
            </g>

            <text x="${athleteX + 12}" y="${athleteY - 14}" fill="rgba(29,29,27,0.75)" font-size="12" letter-spacing="3">
              ${escapeHtml(athlete.name.toUpperCase())}
            </text>

            <text x="${currentRecordPoint.x + 12}" y="${currentRecordPoint.y + 18}" fill="rgba(228,79,44,0.85)" font-size="11" letter-spacing="2.2">
              RECORD IN 2026
            </text>
          </svg>

          <div class="historical-tooltip" hidden></div>

          <div class="historical-axis-labels">
            <span>${escapeHtml(minYear)}</span>
            <span>${TARGET_YEAR}</span>
          </div>
        </div>
      </div>
    `
  );
};

// Section 6
const renderPeakAgeSection = (athlete) => {
  const width = 980;
  const height = 320;
  const pad = 46;
  const minAge = 16;
  const maxAge = 38;
  const ageRange = maxAge - minAge;

  const xForAge = (age) => pad + ((age - minAge) / ageRange) * (width - pad * 2);
  const curveValue = (age) => Math.exp(-Math.pow(age - athlete.peakAge, 2) / (2 * Math.pow(4.2, 2)));
  const yForCurve = (age) => height - pad - curveValue(age) * (height - pad * 2);

  const ages = Array.from({ length: 120 }, (_, index) => minAge + (index / 119) * ageRange);
  const curvePath = ages.map((age, index) => `${index === 0 ? "M" : "L"} ${xForAge(age)} ${yForCurve(age)}`).join(" ");

  const athleteX = xForAge(Math.min(maxAge, Math.max(minAge, athlete.age)));
  const athleteY = yForCurve(Math.min(maxAge, Math.max(minAge, athlete.age)));
  const peakX = xForAge(athlete.peakAge);
  const peakY = yForCurve(athlete.peakAge);

  const athleteRatio = (Math.min(maxAge, Math.max(minAge, athlete.age)) - minAge) / ageRange;

  const peakAthletes = athlete.peakAthletes || [];

  // Group athletes by age so we can spread overlapping dots horizontally
  const ageBuckets = new Map();
  peakAthletes.forEach((p) => {
    const key = Math.min(maxAge, Math.max(minAge, p.age));
    if (!ageBuckets.has(key)) ageBuckets.set(key, []);
    ageBuckets.get(key).push(p);
  });
  const DOT_SPACING = 13;

  const peakAthleteDotsMarkup = peakAthletes
    .map((p) => {
      const clampedAge = Math.min(maxAge, Math.max(minAge, p.age));
      const bucket = ageBuckets.get(clampedAge);
      const indexInBucket = bucket.indexOf(p);
      const offset = (indexInBucket - (bucket.length - 1) / 2) * DOT_SPACING;
      const cx = xForAge(clampedAge) + offset;
      const cy = yForCurve(clampedAge);
      const flag = getFlagFromNat(p.nat);
      const formattedMark = formatPerformanceWithUnit(p.markValue, athlete.lowerIsBetter);
      return `<g class="peak-athlete-dot" data-name="${escapeHtml(p.name)}" data-flag="${escapeHtml(flag)}" data-mark="${escapeHtml(formattedMark)}" data-age="${p.age}" data-rank="${p.rank}" data-cx="${cx}" data-cy="${cy}" style="opacity:0;transition:opacity 0.35s ease;">
        <circle cx="${cx}" cy="${cy}" r="5" fill="rgba(29,29,27,0.78)" stroke="#f3f1ed" stroke-width="1.4" />
      </g>`;
    })
    .join("");

  return sectionShell(
    "peak-age-analysis",
    `
      <div class="story-grid">
        <h3 class="title-display title-lg">
          Peak
          <br />
          Age Analysis
        </h3>

        <div class="peak-shell">
          <svg viewBox="0 0 ${width} ${height}">
            <path d="${curvePath}" fill="none" stroke="rgba(29,29,27,0.65)" stroke-width="2" />
            <path id="peak-motion-path" d="${curvePath}" fill="none" stroke="none" />

            <g class="peak-athletes-layer">${peakAthleteDotsMarkup}</g>

            <circle class="peak-dot-traveler" r="7" fill="#f3f1ed" stroke="#e44f2c" stroke-width="2.2">
              <animateMotion class="peak-dot-motion" dur="3.0s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 1 0.3 1" keyPoints="0;${athleteRatio.toFixed(4)}" begin="indefinite">
                <mpath href="#peak-motion-path" />
              </animateMotion>
            </circle>

            <circle cx="${peakX}" cy="${peakY}" r="6" fill="#f3f1ed" stroke="rgba(29,29,27,0.8)" stroke-width="2" />

            <text x="${peakX + 12}" y="${peakY - 8}" fill="rgba(29,29,27,0.7)" font-size="11" letter-spacing="3">
              PEAK ${escapeHtml(athlete.peakAge)}
            </text>
            <text class="peak-age-label" x="0" y="0" fill="#e44f2c" font-size="11" letter-spacing="3" opacity="0">
              AGE ${escapeHtml(athlete.age)}
            </text>
          </svg>

          <div class="peak-axis-labels">
            <span>${minAge} Years</span>
            <span>${maxAge} Years</span>
          </div>

          <div class="peak-tooltip" style="display:none"></div>
        </div>

        <div class="peak-controls">
          <button class="peak-top-athletes-toggle draw-button draw-button-nav" type="button">
            Show top athletes
          </button>
        </div>

        <p class="title-display title-sm accent-text fade-up delay_str1">${escapeHtml(getPrimeNarrative(athlete))}</p>
      </div>
    `
  );
};

// Section 7
const renderGlobalRecordMapSection = () =>
  sectionShell(
    "global-record-map",
    `
      <div class="story-grid">
        <div class="world-map-heading">
          <h3 class="title-display title-lg">
            Where Records
            <br />
            Live
          </h3>
          <p class="record-discipline">Men on the left, women on the right</p>
        </div>

        <div class="world-map-shell">
          <div class="world-map-layer world-map-layer-male">
            <span class="world-map-sex-label world-map-sex-label-male">Men</span>
            <svg class="world-map-svg world-map-svg-male"></svg>
          </div>
          <div class="world-map-layer world-map-layer-female">
            <span class="world-map-sex-label world-map-sex-label-female">Women</span>
            <svg class="world-map-svg world-map-svg-female"></svg>
          </div>
          <div class="world-map-separator" aria-hidden="true"></div>
          <div class="world-map-tooltip"></div>
          <p class="world-map-status"></p>
        </div>

        <div class="world-map-controls">
          <button class="world-map-play" type="button">Play</button>
          <span class="world-map-year"></span>
          <input class="world-map-slider" type="range" />
          <div class="world-map-legend">
            <span>Records held</span>
            <div class="world-map-legend-labels">
              <span>Women</span>
              <span>Men</span>
            </div>
            <span class="world-map-neutral-note">Pale countries have none for that side/year</span>
            <svg class="world-map-legend-svg" viewBox="0 0 160 24" aria-hidden="true"></svg>
          </div>
        </div>
      </div>
    `
  );

// Section 8
const renderWorldRecordPodiumSection = () =>
  sectionShell(
    "world-record-podium",
    `
      <div class="story-grid">
        <div class="wr-podium-heading">
          <div>
            <p class="label-xs">World Athletics</p>
            <h3 class="title-display title-lg">
              World Record
              <br />
              Podium
            </h3>
            <p class="wr-podium-subtitle">Athletes holding the most current world records</p>
          </div>
          <div class="wr-podium-controls" aria-label="Select podium category">
            <button class="wr-podium-toggle is-active" type="button" data-sex="M">Men</button>
            <button class="wr-podium-toggle" type="button" data-sex="F">Women</button>
          </div>
        </div>

        <div class="wr-podium-chart">
          <svg class="wr-podium-svg" aria-label="World record holders podium"></svg>
          <div class="wr-podium-tooltip"></div>
          <p class="wr-podium-status">Loading podium...</p>
        </div>
      </div>
    `
  );

// Section 9
const renderRecordReignsSection = () =>
  sectionShell(
    "record-reigns",
    `
      <div class="record-reigns-layout">
        <div class="story-grid">
          <p class="label-xs">Record Longevity</p>
          <h3 class="title-display title-lg">
            Longest
            <br />
            Reigns
          </h3>
          <p class="wr-podium-subtitle">Who held history for the longest time</p>
        </div>

        <div class="record-reigns-panel">
          <div class="record-reigns-list"></div>
          <p class="record-reigns-status">Loading record reigns...</p>
        </div>
      </div>
    `
  );


const initHistoricalInteractions = (root) => {
  const section = root.querySelector("#historical-perspective");
  if (!section) {
    return;
  }

  const tooltip = section.querySelector(".historical-tooltip");
  const points = section.querySelectorAll(".historical-point");
  if (!tooltip || points.length === 0) {
    return;
  }

  const showTooltip = (pointElement) => {
    const label = pointElement.getAttribute("data-point-label");
    const name = pointElement.getAttribute("data-point-name");
    const flag = pointElement.getAttribute("data-point-flag");
    const x = Number.parseFloat(pointElement.getAttribute("data-x") || "0");
    const y = Number.parseFloat(pointElement.getAttribute("data-y") || "0");
    const svg = pointElement.closest("svg");
    if (!svg || !label) {
      return;
    }

    const viewBox = svg.viewBox.baseVal;
    const leftPercent = (x / viewBox.width) * 100;
    const topPercent = (y / viewBox.height) * 100;

    const athleteLine = name
      ? `<span class="historical-tooltip-athlete">${flag ? flag + " " : ""}${name}</span>`
      : "";
    tooltip.innerHTML = `<span class="historical-tooltip-perf">${label}</span>${athleteLine}`;
    tooltip.style.left = `${leftPercent}%`;
    tooltip.style.top = `${topPercent}%`;
    tooltip.hidden = false;
  };

  points.forEach((pointElement) => {
    const circle = pointElement.querySelector("circle");
    if (!circle) {
      return;
    }

    const baseRadius = Number.parseFloat(circle.getAttribute("r") || "4");
    pointElement.addEventListener("mouseenter", () => {
      circle.setAttribute("r", String(baseRadius + 1.2));
      showTooltip(pointElement);
    });

    pointElement.addEventListener("mouseleave", () => {
      circle.setAttribute("r", String(baseRadius));
      tooltip.hidden = true;
    });
  });
};


const initLeaderboardInteractions = (root) => {
  const section = root.querySelector("#athlete-intro");
  if (!section) {
    return;
  }

  const toggle = section.querySelector(".leaderboard-toggle");
  const track = section.querySelector(".athlete-intro-track");
  const athletePage = section.querySelector(".athlete-intro-page");
  const panel = section.querySelector("#athlete-leaderboard-panel");
  const close = section.querySelector(".leaderboard-close");
  if (!toggle || !track || !athletePage || !panel || !close) {
    return;
  }

  const updateShift = () => {
    const shift = panel.offsetLeft - athletePage.offsetLeft;
    track.style.setProperty("--leaderboard-shift", `${-shift}px`);
  };

  const setOpen = (isOpen) => {
    if (isOpen) {
      updateShift();
    } else {
      track.style.setProperty("--leaderboard-shift", "0px");
    }

    section.classList.toggle("leaderboard-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
  };

  toggle.addEventListener("click", () => setOpen(!section.classList.contains("leaderboard-open")));
  close.addEventListener("click", () => setOpen(false));
  window.addEventListener("resize", () => {
    if (section.classList.contains("leaderboard-open")) {
      updateShift();
    }
  });
};


const initWorldRecordAnimations = (root) => {
  const progressLine = root.querySelector("#world-record-comparison .record-progress");
  const athleteMarker = root.querySelector("#world-record-comparison .record-marker-athlete");

  if (!progressLine || !athleteMarker) return;

  const targetWidth = Number.parseFloat(progressLine.getAttribute("data-target-width") || "0");
  const targetLeft = Number.parseFloat(athleteMarker.getAttribute("data-target-left") || "0");

  const section = progressLine.closest(".section");
  if (!section) return;

  const triggerAnimation = () => {
    progressLine.style.transition = "none";
    athleteMarker.style.transition = "none";
    progressLine.style.width = "0%";
    athleteMarker.style.left = "0%";

    requestAnimationFrame(() => {
      progressLine.offsetWidth;
      progressLine.style.transition = "width 2.5s ease-out";
      athleteMarker.style.transition = "left 2.5s ease-out";
      progressLine.style.width = `${targetWidth}%`;
      athleteMarker.style.left = `${targetLeft}%`;
    });
  };

  if (section.classList.contains("in-view")) {
    requestAnimationFrame(triggerAnimation);
    return;
  }

  const mo = new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class" &&
        section.classList.contains("in-view")
      ) {
        observer.disconnect();
        requestAnimationFrame(triggerAnimation);
        return;
      }
    }
  });

  mo.observe(section, { attributes: true, attributeFilter: ["class"] });
};

/* Comparison to avg athlete animation */
const initImageReveal = (root) => {
  const section = root.querySelector("#average-comparison");
  if (!section) return;

  const shell = section.querySelector(".silhouette-athlete .silhouette-shape");
  if (!shell) return;

  shell.classList.remove("revealed");

  const triggerReveal = () => {
    setTimeout(() => shell.classList.add("revealed"), 500);
  };

  if (section.classList.contains("in-view")) {
    triggerReveal();
    return;
  }

  const mo = new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class" &&
        section.classList.contains("in-view")
      ) {
        observer.disconnect();
        triggerReveal();
      }
    }
  });

  mo.observe(section, { attributes: true, attributeFilter: ["class"] });
};

const initPeakAthleteToggle = (root) => {
  const section = root.querySelector("#peak-age-analysis");
  if (!section) return;

  const button = section.querySelector(".peak-top-athletes-toggle");
  const dots = section.querySelectorAll(".peak-athlete-dot");
  const tooltip = section.querySelector(".peak-tooltip");
  if (!button || dots.length === 0) return;

  let visible = false;

  button.addEventListener("click", () => {
    visible = !visible;
    button.textContent = visible ? "Hide top athletes" : "Show top athletes";

    if (!visible && tooltip) {
      tooltip.style.display = "none";
    }

    dots.forEach((dot, i) => {
      if (visible) {
        dot.style.animation = "none";
        dot.style.opacity = "0";
        requestAnimationFrame(() => {
          dot.style.animation = `peak-dot-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 70}ms both`;
          dot.style.opacity = "1";
        });
      } else {
        dot.style.animation = `peak-dot-hide 0.2s ease ${i * 30}ms both`;
        dot.style.opacity = "0";
      }
    });
  });

  if (!tooltip) return;

  dots.forEach((dot) => {
    const circle = dot.querySelector("circle");
    const baseRadius = circle ? Number.parseFloat(circle.getAttribute("r") || "5") : 5;

    dot.addEventListener("mouseenter", () => {
      if (!visible) return;
      if (circle) circle.setAttribute("r", String(baseRadius + 1.5));

      const name = dot.getAttribute("data-name") || "";
      const flag = dot.getAttribute("data-flag") || "";
      const mark = dot.getAttribute("data-mark") || "";
      const age = dot.getAttribute("data-age") || "";
      const rank = dot.getAttribute("data-rank") || "";
      const cx = Number.parseFloat(dot.getAttribute("data-cx") || "0");
      const cy = Number.parseFloat(dot.getAttribute("data-cy") || "0");

      const svg = dot.closest("svg");
      if (!svg) return;
      const viewBox = svg.viewBox.baseVal;
      tooltip.innerHTML = `
        <span class="historical-tooltip-athlete">${flag ? flag + " " : ""}${name}</span>
        <span class="historical-tooltip-perf">${mark} · Age ${age}</span>
        <span class="peak-tooltip-rank">World rank #${rank}</span>
      `;
      tooltip.style.left = `${(cx / viewBox.width) * 100}%`;
      tooltip.style.top = `${(cy / viewBox.height) * 100}%`;
      tooltip.style.display = "flex";
    });

    dot.addEventListener("mouseleave", () => {
      if (circle) circle.setAttribute("r", String(baseRadius));
      tooltip.style.display = "none";
    });
  });
};

export const renderStorySections = (root, athlete) => {
  root.innerHTML = `
    <div class="story-fade-enter">
      ${renderAthleteIntroSection(athlete)}
      ${renderBestPerformanceSection(athlete)}
      ${renderWorldRecordSection(athlete)}
      ${renderAverageComparisonSection(athlete)}
      ${renderHistoricalSection(athlete)}
      ${renderPeakAgeSection(athlete)}
      ${renderGlobalRecordMapSection()}
      ${renderWorldRecordPodiumSection()}
      ${renderRecordReignsSection()}
    </div>
  `;

  initWorldRecordAnimations(root);
  initLeaderboardInteractions(root);
  initHistoricalInteractions(root);
  initPeakAthleteToggle(root);
  initWorldMap(root);
  initWorldRecordPodium(root);
  initRecordReigns(root);
  initImageReveal(root);
  initPeakAgeAnimation(root);
};


// Scrolling & Text Effects
export const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {

      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      } else {
        entry.target.classList.remove("visible");
      }

    });
  },
  {
    threshold: 0.25,
  }
);