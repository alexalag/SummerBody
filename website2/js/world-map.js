const WORLD_ATLAS_URL = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
const MAP_RECORDS_URL = "./assets/data/map-records.json";
const MAP_WIDTH = 1180;
const MAP_HEIGHT = 560;

let mapLoadPromise = null;

const fallbackIsoByNumericId = {
  36: "AUS",
  46: "BEL",
  76: "BRA",
  156: "CHN",
  191: "HRV",
  192: "CUB",
  203: "CZE",
  231: "ETH",
  250: "FRA",
  276: "DEU",
  380: "ITA",
  388: "JAM",
  392: "JPN",
  404: "KEN",
  410: "KOR",
  484: "MEX",
  492: "MCO",
  504: "MAR",
  528: "NLD",
  578: "NOR",
  616: "POL",
  620: "PRT",
  642: "ROU",
  643: "RUS",
  724: "ESP",
  752: "SWE",
  756: "CHE",
  788: "TUN",
  826: "GBR",
  840: "USA"
};

const getCountryIso = (feature) => feature.properties.iso_a3 || fallbackIsoByNumericId[Number(feature.id)];

const loadMapAssets = () => {
  if (!mapLoadPromise) {
    mapLoadPromise = Promise.all([d3.json(WORLD_ATLAS_URL), d3.json(MAP_RECORDS_URL)]).then(([topology, records]) => ({
      countries: topojson.feature(topology, topology.objects.countries).features,
      records
    }));
  }

  return mapLoadPromise;
};

const getMaxRecordCount = (records) => {
  let maxCount = 1;
  Object.values(records).forEach((yearRecords) => {
    ["M", "F"].forEach((sex) => {
      Object.values(yearRecords[sex] || {}).forEach((list) => {
        maxCount = Math.max(maxCount, list.length);
      });
    });
  });
  return maxCount;
};

const getRecordsForCountry = (records, year, sex, countryIso) => records[year]?.[sex]?.[countryIso] || [];

const renderTooltipRows = (rows, sexLabel) => {
  if (rows.length === 0) {
    return `<div class="world-map-empty">No ${sexLabel.toLowerCase()} records held this year</div>`;
  }

  return rows
    .map(
      (row) => `
        <div class="world-map-tip-record">
          <span>${row.Event}</span>
          <span>${row.Competitor}</span>
        </div>
      `
    )
    .join("");
};

const drawLegend = (root) => {
  const svg = d3.select(root.querySelector(".world-map-legend-svg"));
  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  [
    ["female", "#f1a08d", "#e44f2c"],
    ["male", "#8d8a84", "#1d1d1b"]
  ].forEach(([name, start, end]) => {
    const gradient = defs.append("linearGradient").attr("id", `world-map-gradient-${name}`).attr("x1", "0%").attr("x2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", start);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", end);
  });

  svg.append("rect").attr("x", 0).attr("y", 1).attr("width", 160).attr("height", 7).attr("fill", "url(#world-map-gradient-female)");
  svg.append("rect").attr("x", 0).attr("y", 12).attr("width", 160).attr("height", 7).attr("fill", "url(#world-map-gradient-male)");
};

const setClipPosition = (root, x) => {
  const container = root.querySelector(".world-map-shell");
  const femaleLayer = root.querySelector(".world-map-layer-female");
  const separator = root.querySelector(".world-map-separator");
  const width = container.getBoundingClientRect().width || 1;
  const clampedX = Math.max(36, Math.min(width - 36, x));
  const percent = (clampedX / width) * 100;

  femaleLayer.style.clipPath = `inset(0 0 0 ${percent}%)`;
  separator.style.left = `${percent}%`;
};

const initSplitControl = (root) => {
  const container = root.querySelector(".world-map-shell");
  const separator = root.querySelector(".world-map-separator");
  let isDragging = false;

  setClipPosition(root, (container.getBoundingClientRect().width || 1) / 2);

  separator.addEventListener("pointerdown", (event) => {
    isDragging = true;
    separator.setPointerCapture(event.pointerId);
  });

  separator.addEventListener("pointerup", () => {
    isDragging = false;
  });

  separator.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const rect = container.getBoundingClientRect();
    setClipPosition(root, event.clientX - rect.left);
  });

  window.addEventListener("resize", () => {
    setClipPosition(root, (container.getBoundingClientRect().width || 1) / 2);
  });
};

const drawMapLayer = ({ root, countries, records, years, getYearIndex, colorScale, sex, layerSelector }) => {
  const svgNode = root.querySelector(layerSelector);
  const svg = d3.select(svgNode);
  const projection = d3.geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: "Sphere" });
  const path = d3.geoPath(projection);
  const tooltip = d3.select(root.querySelector(".world-map-tooltip"));
  const emptyColor = "#ebe8e2";

  svg.attr("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`).selectAll("*").remove();

  svg
    .append("path")
    .datum({ type: "Sphere" })
    .attr("class", "world-map-ocean")
    .attr("d", path);

  svg
    .selectAll(".world-map-country")
    .data(countries)
    .enter()
    .append("path")
    .attr("class", "world-map-country")
    .attr("d", path)
    .attr("fill", emptyColor)
    .on("mouseenter", (event, feature) => {
      const year = years[getYearIndex()];
      const iso = getCountryIso(feature);
      const rows = iso ? getRecordsForCountry(records, year, sex, iso) : [];
      const countryName = feature.properties.name;
      const sexLabel = sex === "F" ? "Women" : "Men";
      const countLabel = rows.length === 1 ? "1 record held" : `${rows.length} records held`;

      d3.select(event.currentTarget).attr("stroke", "#1d1d1b").attr("stroke-width", 1.2);
      tooltip
        .html(
          `
            <div class="world-map-tip-title">${countryName} · ${year}</div>
            <div class="world-map-tip-summary">${sexLabel} · ${countLabel}</div>
            ${renderTooltipRows(rows, sexLabel)}
          `
        )
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      const shell = root.querySelector(".world-map-shell");
      const rect = shell.getBoundingClientRect();
      const tooltipNode = tooltip.node();
      const tooltipWidth = tooltipNode?.offsetWidth || 260;
      const tooltipHeight = tooltipNode?.offsetHeight || 140;
      const x = event.clientX - rect.left + 14;
      const y = event.clientY - rect.top - 18;
      const clampedX = Math.min(Math.max(12, x), rect.width - tooltipWidth - 12);
      const clampedY = Math.min(Math.max(12, y), rect.height - tooltipHeight - 12);

      tooltip.style("left", `${clampedX}px`).style("top", `${clampedY}px`);
    })
    .on("mouseleave", (event) => {
      d3.select(event.currentTarget).attr("stroke", "rgba(29, 29, 27, 0.16)").attr("stroke-width", 0.6);
      tooltip.style("opacity", 0);
    });

  return () => {
    const year = years[getYearIndex()];
    svg
      .selectAll(".world-map-country")
      .transition()
      .duration(180)
      .attr("fill", (feature) => {
        const iso = getCountryIso(feature);
        const rows = iso ? getRecordsForCountry(records, year, sex, iso) : [];
        return rows.length ? colorScale(rows.length) : emptyColor;
      });
  };
};

export const initWorldMap = (root) => {
  const section = root.querySelector("#global-record-map");
  if (!section || section.dataset.mapInitialized === "true") {
    return;
  }

  section.dataset.mapInitialized = "true";

  loadMapAssets()
    .then(({ countries, records }) => {
      const years = Object.keys(records).sort();
      let yearIndex = years.length - 1;
      let timer = null;

      const maxCount = getMaxRecordCount(records);
      const maleColor = d3.scaleLinear().domain([1, maxCount]).range(["#6f6c66", "#1d1d1b"]).interpolate(d3.interpolateHcl);
      const femaleColor = d3.scaleLinear().domain([1, maxCount]).range(["#f1a08d", "#e44f2c"]).interpolate(d3.interpolateHcl);

      const yearLabel = section.querySelector(".world-map-year");
      const slider = section.querySelector(".world-map-slider");
      const playButton = section.querySelector(".world-map-play");

      slider.min = 0;
      slider.max = years.length - 1;

      const updateMale = drawMapLayer({
        root: section,
        countries,
        records,
        years,
        getYearIndex: () => yearIndex,
        colorScale: maleColor,
        sex: "M",
        layerSelector: ".world-map-svg-male"
      });
      const updateFemale = drawMapLayer({
        root: section,
        countries,
        records,
        years,
        getYearIndex: () => yearIndex,
        colorScale: femaleColor,
        sex: "F",
        layerSelector: ".world-map-svg-female"
      });

      const update = () => {
        yearLabel.textContent = years[yearIndex];
        slider.value = yearIndex;
        updateMale();
        updateFemale();
      };

      slider.addEventListener("input", () => {
        yearIndex = Number.parseInt(slider.value, 10);
        update();
      });

      playButton.addEventListener("click", () => {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
          playButton.textContent = "Play";
          return;
        }

        playButton.textContent = "Pause";
        timer = window.setInterval(() => {
          yearIndex = (yearIndex + 1) % years.length;
          update();
        }, 650);
      });

      drawLegend(section);
      initSplitControl(section);
      update();
    })
    .catch((error) => {
      const status = section.querySelector(".world-map-status");
      if (status) {
        status.textContent = "World map could not be loaded.";
      }
      console.error("[world map] load failed", error);
    });
};
