const RECORDS_URL = "./assets/data/records.json";
const SVG_WIDTH = 980;
const SVG_HEIGHT = 520;
const MARGIN = { top: 52, right: 42, bottom: 110, left: 42 };

let recordsPromise = null;

const loadRecords = () => {
  if (!recordsPromise) {
    recordsPromise = d3.json(RECORDS_URL);
  }
  return recordsPromise;
};

const renderTooltipDetails = (entry) => {
  const details = entry.Details || [];
  if (details.length === 0) {
    return `<div class="wr-podium-empty">No event details available</div>`;
  }

  return details
    .map(
      (detail) => `
        <div class="wr-podium-tip-row">
          <span>${detail.Year}</span>
          <span>${detail.Event}</span>
        </div>
      `
    )
    .join("");
};

const getSexKey = (section) => section.getAttribute("data-sex") || "M";

const drawPodium = (section, records) => {
  const sex = getSexKey(section);
  const entries = (records?.[sex] || []).slice(0, 3).map((entry, index) => ({
    ...entry,
    position: index + 1
  }));

  const svg = d3.select(section).select(".wr-podium-svg").attr("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
  const tooltip = section.querySelector(".wr-podium-tooltip");
  const innerWidth = SVG_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
  const orderedPositions = [2, 1, 3];
  const x = d3.scaleBand().domain(orderedPositions).range([0, innerWidth]).padding(0.22);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(1, d3.max(entries, (entry) => entry.Count) || 1) + 0.55])
    .range([innerHeight, 0]);
  const isWomen = sex === "F";
  const barColor = isWomen ? "rgba(228, 79, 44, 0.82)" : "rgba(29, 29, 27, 0.78)";
  const mutedBarColor = isWomen ? "rgba(228, 79, 44, 0.46)" : "rgba(29, 29, 27, 0.36)";
  const labelColor = isWomen ? "#e44f2c" : "#1d1d1b";

  svg.selectAll("*").remove();
  const group = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  group
    .append("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", innerHeight)
    .attr("y2", innerHeight)
    .attr("stroke", "rgba(29, 29, 27, 0.22)");

  const podiumEntries = group
    .selectAll(".wr-podium-entry")
    .data(entries, (entry) => entry.Competitor)
    .join("g")
    .attr("class", "wr-podium-entry")
    .attr("transform", (entry) => `translate(${x(entry.position)},0)`);

  podiumEntries
    .append("rect")
    .attr("class", "wr-podium-bar")
    .attr("x", 0)
    .attr("width", x.bandwidth())
    .attr("rx", 6)
    .attr("y", innerHeight)
    .attr("height", 0)
    .attr("fill", (entry) => (entry.position === 1 ? barColor : mutedBarColor))
    .transition()
    .duration(720)
    .delay((entry) => orderedPositions.indexOf(entry.position) * 110)
    .ease(d3.easeCubicOut)
    .attr("y", (entry) => y(entry.Count))
    .attr("height", (entry) => innerHeight - y(entry.Count));

  podiumEntries
    .append("text")
    .attr("class", "wr-podium-count")
    .attr("x", x.bandwidth() / 2)
    .attr("y", (entry) => y(entry.Count) - 14)
    .attr("text-anchor", "middle")
    .attr("fill", labelColor)
    .text((entry) => entry.Count);

  podiumEntries
    .append("text")
    .attr("class", "wr-podium-place")
    .attr("x", x.bandwidth() / 2)
    .attr("y", innerHeight + 38)
    .attr("text-anchor", "middle")
    .text((entry) => `#${entry.position}`);

  podiumEntries
    .append("text")
    .attr("class", "wr-podium-name")
    .attr("x", x.bandwidth() / 2)
    .attr("y", innerHeight + 68)
    .attr("text-anchor", "middle")
    .text((entry) => entry.Competitor);

  podiumEntries
    .append("rect")
    .attr("class", "wr-podium-hit")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", x.bandwidth())
    .attr("height", innerHeight + 82)
    .attr("fill", "transparent")
    .on("mouseenter", (event, entry) => {
      if (!tooltip) {
        return;
      }
      tooltip.innerHTML = `
        <div class="wr-podium-tip-title">${entry.Competitor} - ${entry.Count} records</div>
        ${renderTooltipDetails(entry)}
      `;
      tooltip.style.opacity = "1";
    })
    .on("mousemove", (event) => {
      if (!tooltip) {
        return;
      }
      const bounds = section.querySelector(".wr-podium-chart").getBoundingClientRect();
      const left = event.clientX - bounds.left + 16;
      const top = event.clientY - bounds.top - 12;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    })
    .on("mouseleave", () => {
      if (tooltip) {
        tooltip.style.opacity = "0";
      }
    });
};

export const initWorldRecordPodium = (root) => {
  const section = root.querySelector("#world-record-podium");
  if (!section) {
    return;
  }

  const status = section.querySelector(".wr-podium-status");
  const buttons = section.querySelectorAll(".wr-podium-toggle");
  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  loadRecords()
    .then((records) => {
      setStatus("");
      drawPodium(section, records);

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const sex = button.getAttribute("data-sex") || "M";
          section.setAttribute("data-sex", sex);
          buttons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
          drawPodium(section, records);
        });
      });
    })
    .catch(() => {
      setStatus("World record podium could not be loaded.");
    });
};
