import {
  escapeHtml,
  formatDelta,
  formatSecondsDisplay,
  getAverageGap,
  getAverageHeadline,
  getGapToRecord,
  getPrimeNarrative,
  getRecordProgressRatio
} from "./utils.js";


const TARGET_YEAR = 2026;


const sectionShell = (id, innerHtml, extraClass = "") => `
  <section id="${id}" class="section ${extraClass}">
    <div class="section-content">
      ${innerHtml}
    </div>
  </section>
`;

// Section 1
const renderAthleteIntroSection = (athlete) =>
  sectionShell(
    "athlete-intro",
    `
      <div class="athlete-intro-layout">
        <div class="story-grid">
          <p class="label-xs">Athlete</p>
          <h2 class="title-display title-lg">${escapeHtml(athlete.name)}</h2>
          <div class="athlete-meta">
            <span>Age ${escapeHtml(athlete.age)}</span>
            <span>${escapeHtml(athlete.sex)}</span>
            <span>${escapeHtml(athlete.country)}</span>
            <span>${escapeHtml(athlete.discipline)}</span>
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
          <p class="serif-italic headline-serif accent-text">${escapeHtml(athlete.bestPerformanceLabel.toUpperCase())}</p>
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
    athlete.performanceUnit === "meters" ? `${gap.toFixed(2)}M FROM THE WORLD RECORD` : formatDelta(gap, "seconds");

  return sectionShell(
    "world-record-comparison",
    `
      <div class="story-grid">
        <h3 class="title-display title-lg">
          Against
          <br />
          World Record
        </h3>

        <div class="record-line-shell">
          <div class="record-line">
            <div class="record-progress" data-target-width="${athletePosition.toFixed(4)}"></div>
            <div class="record-marker-athlete" style="left:${athletePosition}%"></div>
            <div class="record-marker-wr"></div>
          </div>

          <div class="record-line-meta">
            <span>${escapeHtml(athlete.name)}</span>
            <span>World Record</span>
          </div>

          <div class="record-line-values">
            <span>${escapeHtml(athlete.bestPerformance)}</span>
            <span>${escapeHtml(athlete.worldRecord)}</span>
          </div>
        </div>

        <p class="title-display title-md accent-text">${escapeHtml(statement)}</p>
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
      ? `${absGap.toFixed(2)}M ${betterThanAverage ? "BETTER THAN" : "BEHIND"} CATEGORY AVERAGE`
      : `${absGap.toFixed(2)} SECONDS ${betterThanAverage ? "BETTER THAN" : "BEHIND"} CATEGORY AVERAGE`;
  const athleteDominance = Math.min(92, Math.max(54, 58 + (Math.abs(gap) * 26) / Math.max(1, athlete.averagePerformanceValue)));

  return sectionShell(
    "average-comparison",
    `
      <div class="average-layout">
        <div class="story-grid">
          <p class="label-xs">Comparison to average athlete</p>
          <h3 class="title-display title-lg">${escapeHtml(headline)}</h3>
          <p class="serif-italic headline-serif accent-text">${escapeHtml(delta)}</p>
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
  const projectedHistory = hasPointAtTarget
    ? [...effectiveHistory]
    : [
        ...effectiveHistory,
        {
          year: TARGET_YEAR,
          value: effectiveHistory[effectiveHistory.length - 1]?.value ?? athlete.worldRecordValue
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

  const formatValue = (value) => (athlete.lowerIsBetter ? formatSecondsDisplay(value) : `${value.toFixed(2)}m`);
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
      label: `${point.year} - ${formatValue(point.value)}`
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
        <g class="historical-point" data-point-id="${escapeHtml(point.id)}" data-point-label="${escapeHtml(point.label)}" data-x="${point.x}" data-y="${point.y}">
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

            <circle cx="${peakX}" cy="${peakY}" r="6" fill="#f3f1ed" stroke="rgba(29,29,27,0.8)" stroke-width="2" />
            <circle cx="${athleteX}" cy="${athleteY}" r="7" fill="#f3f1ed" stroke="#e44f2c" stroke-width="2.2" />

            <text x="${peakX + 12}" y="${peakY - 8}" fill="rgba(29,29,27,0.7)" font-size="11" letter-spacing="3">
              PEAK ${escapeHtml(athlete.peakAge)}
            </text>
            <text x="${athleteX + 12}" y="${athleteY + 20}" fill="#e44f2c" font-size="11" letter-spacing="3">
              AGE ${escapeHtml(athlete.age)}
            </text>
          </svg>

          <div class="peak-axis-labels">
            <span>${minAge} Years</span>
            <span>${maxAge} Years</span>
          </div>
        </div>

        <p class="title-display title-sm accent-text">${escapeHtml(getPrimeNarrative(athlete))}</p>
      </div>
    `
  );
};


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
    const x = Number.parseFloat(pointElement.getAttribute("data-x") || "0");
    const y = Number.parseFloat(pointElement.getAttribute("data-y") || "0");
    const svg = pointElement.closest("svg");
    if (!svg || !label) {
      return;
    }

    const viewBox = svg.viewBox.baseVal;
    const leftPercent = (x / viewBox.width) * 100;
    const topPercent = (y / viewBox.height) * 100;

    tooltip.textContent = label;
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


const initWorldRecordAnimations = (root) => {
  const progressLine = root.querySelector("#world-record-comparison .record-progress");
  if (!progressLine) {
    return;
  }

  const targetWidth = Number.parseFloat(progressLine.getAttribute("data-target-width") || "0");
  progressLine.style.width = "0%";
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      progressLine.style.width = `${targetWidth}%`;
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
    </div>
  `;

  initWorldRecordAnimations(root);
  initHistoricalInteractions(root);
};
