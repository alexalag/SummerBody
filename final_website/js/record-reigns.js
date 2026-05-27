const CSV_URL = "./assets/data/final_data.csv";
const TODAY = new Date("2026-05-08T00:00:00Z");

let reignsPromise = null;

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTimeMark = (markText) => {
  const cleanText = String(markText || "").trim();
  if (!cleanText) {
    return null;
  }

  const parts = cleanText.split(":");
  if (parts.length === 1) {
    return toNumber(cleanText);
  }

  const values = parts.map((part) => Number.parseFloat(part));
  if (values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  if (values.length === 2) {
    return values[0] * 60 + values[1];
  }

  if (values.length === 3) {
    return values[0] * 3600 + values[1] * 60 + values[2];
  }

  return null;
};

const parseMarkValue = (row) => {
  const distEvent = String(row.Dist_Event || "").trim();
  if (distEvent === "1") {
    return toNumber(row.Mark);
  }

  return toNumber(row["Mark [meters or seconds]"]) ?? parseTimeMark(row.Mark);
};

const parseDate = (dateText) => {
  const date = new Date(`${String(dateText || "").trim()}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeSex = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male") {
    return "Men";
  }
  if (normalized === "female") {
    return "Women";
  }
  return null;
};

const isBetter = (candidate, current, lowerIsBetter) => (lowerIsBetter ? candidate < current : candidate > current);

const formatYears = (days) => `${(days / 365.25).toFixed(1)} years`;

const buildReigns = (rows) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const event = String(row.Event || "").trim();
    const sex = normalizeSex(row.Sex);
    const distEvent = String(row.Dist_Event || "").trim();
    const markValue = parseMarkValue(row);
    const date = parseDate(row.Date);
    const name = String(row.Competitor || "").trim();
    const nat = String(row.Nat || "").trim().toUpperCase();

    if (!event || !sex || !name || !nat || !date || markValue === null || (distEvent !== "0" && distEvent !== "1")) {
      return;
    }

    const key = `${event}|${sex}`;
    const list = grouped.get(key) || [];
    list.push({
      name,
      nat,
      event,
      sex,
      mark: String(row.Mark || "").trim(),
      date,
      dateText: String(row.Date || "").trim(),
      markValue,
      lowerIsBetter: distEvent === "0"
    });
    grouped.set(key, list);
  });

  const reigns = [];

  grouped.forEach((eventRows) => {
    eventRows.sort((a, b) => a.date - b.date || a.name.localeCompare(b.name));
    const records = [];
    let currentBest = null;

    eventRows.forEach((row) => {
      if (currentBest === null || isBetter(row.markValue, currentBest, row.lowerIsBetter)) {
        currentBest = row.markValue;
        records.push(row);
      }
    });

    records.forEach((record, index) => {
      const nextRecord = records[index + 1];
      const endDate = nextRecord?.date || TODAY;
      const daysHeld = Math.max(0, (endDate - record.date) / 86400000);

      if (daysHeld < 1) {
        return;
      }

      reigns.push({
        name: record.name,
        nat: record.nat,
        event: record.event,
        sex: record.sex,
        mark: record.mark,
        startDate: record.dateText,
        endDate: nextRecord?.dateText || "Still standing",
        daysHeld,
        yearsHeld: formatYears(daysHeld)
      });
    });
  });

  return reigns.sort((a, b) => b.daysHeld - a.daysHeld).slice(0, 8);
};

const loadReigns = () => {
  if (reignsPromise) {
    return reignsPromise;
  }

  reignsPromise = new Promise((resolve, reject) => {
    const parser = window.Papa;
    if (!parser) {
      reject(new Error("PapaParse is not available."));
      return;
    }

    const rows = [];
    parser.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      chunk: (result) => rows.push(...result.data.filter(Boolean)),
      complete: () => resolve(buildReigns(rows)),
      error: reject
    });
  });

  return reignsPromise;
};

const renderBars = (section, reigns) => {
  const list = section.querySelector(".record-reigns-list");
  if (!list) {
    return;
  }

  const maxDays = Math.max(...reigns.map((entry) => entry.daysHeld), 1);
  list.innerHTML = reigns
    .map((entry, index) => {
      const width = Math.max(8, (entry.daysHeld / maxDays) * 100);
      return `
        <div class="record-reign-row">
          <span class="record-reign-rank">#${index + 1}</span>
          <div class="record-reign-main">
            <div class="record-reign-meta">
              <span>${entry.name}</span>
              <span>${entry.sex} - ${entry.event} - ${entry.nat}</span>
            </div>
            <div class="record-reign-bar-shell">
              <div class="record-reign-bar" style="width:${width}%"></div>
            </div>
            <div class="record-reign-dates">
              <span>${entry.startDate}</span>
              <span>${entry.endDate}</span>
            </div>
          </div>
          <span class="record-reign-years">${entry.yearsHeld}</span>
        </div>
      `;
    })
    .join("");
};

export const initRecordReigns = (root) => {
  const section = root.querySelector("#record-reigns");
  if (!section) {
    return;
  }

  const status = section.querySelector(".record-reigns-status");
  const setStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  loadReigns()
    .then((reigns) => {
      renderBars(section, reigns);
      setStatus("");
    })
    .catch(() => {
      setStatus("Longest record reigns could not be loaded.");
    });
};
