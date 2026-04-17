import { formatSecondsDisplay } from "./utils.js";
import { getCountryNameFromNat, getFlagFromNat } from "./nation-meta.js";

// eviter la sur representation de certains groupes
const MAX_ATHLETES_PER_COUNTRY_AND_SEX = 16;
const MIN_EVENT_ATHLETE_COUNT = 12;

// pour reutiliser les donnees entre tirages
let cachedAthletesPromise = null;

const toNumber = (value) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSex = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "male") {
    return "Male";
  }
  if (normalized === "female") {
    return "Female";
  }
  return null;
};

const extractYear = (dateValue) => {
  if (!dateValue || String(dateValue).length < 4) {
    return null;
  }

  const year = Number.parseInt(String(dateValue).slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
};

// Priorite a l'age explicite
const deriveAge = (rawAge, dob, dateValue) => {
  const explicit = toNumber(rawAge);
  if (explicit !== null && explicit > 10 && explicit < 60) {
    return explicit;
  }

  const birthYear = extractYear(dob);
  const eventYear = extractYear(dateValue);
  if (birthYear !== null && eventYear !== null) {
    const age = eventYear - birthYear;
    if (age > 10 && age < 60) {
      return age;
    }
  }

  return null;
};

// temps vs distance
const isBetterMark = (candidate, current, lowerIsBetter) => (lowerIsBetter ? candidate < current : candidate > current);

const round2 = (value) => Math.round(value * 100) / 100;

const formatPerformanceValue = (value, lowerIsBetter) => (lowerIsBetter ? formatSecondsDisplay(value) : `${value.toFixed(2)}m`);

// id URL-friendly
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getRecordProximity = (row, stats) => (row.lowerIsBetter ? stats.worldRecordValue / row.markValue : row.markValue / stats.worldRecordValue);

// Score composite: poids fort sur Results Score + bonus de proximite au WR
const getSelectionScore = (row, stats) => {
  const performanceScore = Number.isFinite(row.resultsScore) ? row.resultsScore : 0;
  const proximity = getRecordProximity(row, stats);
  return performanceScore * 1000 + proximity * 100;
};

const getNarrativeConclusion = (row, stats) => {
  const proximity = getRecordProximity(row, stats);

  if (proximity >= 0.995) {
    return "ON THE EDGE OF IMMORTALITY";
  }
  if (proximity >= 0.985) {
    return "BETWEEN PROMISE AND HISTORY";
  }
  if (proximity >= 0.97) {
    return "BUT CLOSER THAN MOST";
  }
  if (proximity >= 0.94) {
    return "NOT A LEGEND YET";
  }

  return "STILL CHASING HISTORY";
};

// Parse
const parseRow = (row) => {
  const name = String(row.Competitor || "").trim();
  const nat = String(row.Nat || "").trim().toUpperCase();
  const event = String(row.Event || "").trim();
  const sex = normalizeSex(row.Sex);
  const markValue = toNumber(row["Mark [meters or seconds]"]);
  const markText = String(row.Mark || "").trim();
  const distEvent = String(row.Dist_Event || "").trim();
  const year = extractYear(row.Date);

  if (!name || !nat || !event || !sex || markValue === null || markValue <= 0 || (distEvent !== "0" && distEvent !== "1")) {
    return null;
  }

  const lowerIsBetter = distEvent === "0";
  const age = deriveAge(row.Age, row.DOB, row.Date);
  const score = toNumber(row["Results Score"]) || 0;
  const dob = String(row.DOB || "").trim();
  const athleteId = `${name}|${dob}|${sex}|${nat}`;
  const eventKey = `${event}|${sex}`;

  return {
    athleteId,
    name,
    nat,
    sex,
    event,
    eventKey,
    markText,
    markValue,
    lowerIsBetter,
    age,
    year,
    resultsScore: score
  };
};


const getOrCreateEventAggregate = (eventAggregates, row) => {
  const existing = eventAggregates.get(row.eventKey);
  if (existing) {
    return existing;
  }

  const aggregate = {
    event: row.event,
    sex: row.sex,
    lowerIsBetter: row.lowerIsBetter,
    worldBest: null,
    yearBest: new Map(),
    athleteBest: new Map()
  };
  eventAggregates.set(row.eventKey, aggregate);
  return aggregate;
};

const ingestRow = (row, eventAggregates, athleteBestByEvent) => {
  const eventAggregate = getOrCreateEventAggregate(eventAggregates, row);

  if (!eventAggregate.worldBest || isBetterMark(row.markValue, eventAggregate.worldBest.markValue, row.lowerIsBetter)) {
    eventAggregate.worldBest = row;
  }

  if (row.year !== null) {
    const currentYearBest = eventAggregate.yearBest.get(row.year);
    if (currentYearBest === undefined || isBetterMark(row.markValue, currentYearBest, row.lowerIsBetter)) {
      eventAggregate.yearBest.set(row.year, row.markValue);
    }
  }

  const athleteEventBest = eventAggregate.athleteBest.get(row.athleteId);
  if (!athleteEventBest || isBetterMark(row.markValue, athleteEventBest.markValue, row.lowerIsBetter)) {
    eventAggregate.athleteBest.set(row.athleteId, { markValue: row.markValue, age: row.age });
  }

  const athleteEventKey = `${row.athleteId}|${row.event}`;
  const currentBest = athleteBestByEvent.get(athleteEventKey);
  if (!currentBest || isBetterMark(row.markValue, currentBest.markValue, row.lowerIsBetter)) {
    athleteBestByEvent.set(athleteEventKey, row);
  }
};

const buildRecordHistory = (eventAggregate) => {
  const ordered = Array.from(eventAggregate.yearBest.entries()).sort((a, b) => a[0] - b[0]);
  const history = [];
  let runningRecord = null;

  for (const [year, bestYearValue] of ordered) {
    if (runningRecord === null || isBetterMark(bestYearValue, runningRecord, eventAggregate.lowerIsBetter)) {
      runningRecord = bestYearValue;
      history.push({ year, value: round2(runningRecord) });
    }
  }

  if (history.length === 0 && eventAggregate.worldBest) {
    const anchorYear = eventAggregate.worldBest.year || 2025;
    const value = round2(eventAggregate.worldBest.markValue);
    history.push({ year: anchorYear - 1, value });
    history.push({ year: anchorYear, value });
    return history;
  }

  if (history.length === 1) {
    history.push({
      year: history[0].year + 1,
      value: history[0].value
    });
  }

  return history;
};

const buildPeakAge = (eventAggregate) => {
  const athleteAgeEntries = Array.from(eventAggregate.athleteBest.values()).filter((entry) => entry.age !== null);

  if (athleteAgeEntries.length === 0) {
    return 27;
  }

  athleteAgeEntries.sort((a, b) => (isBetterMark(a.markValue, b.markValue, eventAggregate.lowerIsBetter) ? -1 : 1));
  const topCount = Math.min(120, Math.max(20, Math.round(athleteAgeEntries.length * 0.16)));
  const sample = athleteAgeEntries.slice(0, topCount);
  const meanAge = sample.reduce((sum, entry) => sum + entry.age, 0) / sample.length;
  return Math.round(meanAge);
};

const buildAveragePerformanceValue = (eventAggregate) => {
  const marks = Array.from(eventAggregate.athleteBest.values()).map((entry) => entry.markValue);
  marks.sort((a, b) => (isBetterMark(a, b, eventAggregate.lowerIsBetter) ? -1 : 1));

  const targetIndex = Math.max(0, Math.floor((marks.length - 1) * 0.65));
  return marks[targetIndex];
};

const buildEventStatsMap = (eventAggregates) => {
  const statsMap = new Map();

  for (const [eventKey, eventAggregate] of eventAggregates.entries()) {
    if (!eventAggregate.worldBest || eventAggregate.athleteBest.size < MIN_EVENT_ATHLETE_COUNT) {
      continue;
    }

    const averagePerformanceValue = buildAveragePerformanceValue(eventAggregate);
    const worldRecordValue = eventAggregate.worldBest.markValue;
    const recordHistory = buildRecordHistory(eventAggregate);

    const stats = {
      event: eventAggregate.event,
      sex: eventAggregate.sex,
      lowerIsBetter: eventAggregate.lowerIsBetter,
      worldRecordText: eventAggregate.worldBest.markText || formatPerformanceValue(worldRecordValue, eventAggregate.lowerIsBetter),
      worldRecordValue,
      averagePerformanceText: formatPerformanceValue(averagePerformanceValue, eventAggregate.lowerIsBetter),
      averagePerformanceValue,
      recordHistory,
      peakAge: buildPeakAge(eventAggregate)
    };

    statsMap.set(eventKey, stats);
  }

  return statsMap;
};

const buildAthleteStories = (eventStatsMap, athleteBestByEvent) => {
  const bestEventByAthlete = new Map();

  for (const candidate of athleteBestByEvent.values()) {
    const eventStats = eventStatsMap.get(candidate.eventKey);
    if (!eventStats) {
      continue;
    }

    const existing = bestEventByAthlete.get(candidate.athleteId);
    if (!existing) {
      bestEventByAthlete.set(candidate.athleteId, candidate);
      continue;
    }

    const existingStats = eventStatsMap.get(existing.eventKey);
    if (!existingStats) {
      bestEventByAthlete.set(candidate.athleteId, candidate);
      continue;
    }

    const candidateScore = getSelectionScore(candidate, eventStats);
    const existingScore = getSelectionScore(existing, existingStats);

    if (candidateScore > existingScore) {
      bestEventByAthlete.set(candidate.athleteId, candidate);
    }
  }

  const groupedByCountryAndSex = new Map();
  for (const row of bestEventByAthlete.values()) {
    const key = `${row.nat}|${row.sex}`;
    const list = groupedByCountryAndSex.get(key) || [];
    list.push(row);
    groupedByCountryAndSex.set(key, list);
  }

  const selectedRows = [];
  for (const rows of groupedByCountryAndSex.values()) {
    // Tri multi-critere: score, qualite intra-event, puis ordre lexical stable.
    rows.sort((a, b) => {
      const statsA = eventStatsMap.get(a.eventKey);
      const statsB = eventStatsMap.get(b.eventKey);
      if (!statsA || !statsB) {
        return 0;
      }

      const scoreDelta = getSelectionScore(b, statsB) - getSelectionScore(a, statsA);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      if (a.eventKey === b.eventKey) {
        if (isBetterMark(a.markValue, b.markValue, a.lowerIsBetter)) {
          return -1;
        }
        if (isBetterMark(b.markValue, a.markValue, b.lowerIsBetter)) {
          return 1;
        }
      }

      return a.name.localeCompare(b.name);
    });

    selectedRows.push(...rows.slice(0, MAX_ATHLETES_PER_COUNTRY_AND_SEX));
  }

  const athletes = selectedRows
    .map((row) => {
      const eventStats = eventStatsMap.get(row.eventKey);
      if (!eventStats) {
        return null;
      }

      const pronoun = row.sex === "Female" ? "Her" : "His";
      const bestPerformanceLabel = row.lowerIsBetter ? `${pronoun} Fastest Race` : `${pronoun} Best Mark`;
      const age = Math.max(16, Math.min(45, Math.round((row.age || eventStats.peakAge))));

      return {
        // Payload final consomme directement par render-sections.js.
        id: slugify(`${row.name}-${row.nat}-${row.event}`),
        name: row.name,
        age,
        sex: row.sex,
        natCode: row.nat,
        country: getCountryNameFromNat(row.nat),
        flag: getFlagFromNat(row.nat),
        discipline: row.event,
        bestPerformance: row.markText || formatPerformanceValue(row.markValue, row.lowerIsBetter),
        bestPerformanceValue: round2(row.markValue),
        bestPerformanceLabel,
        worldRecord: eventStats.worldRecordText,
        worldRecordValue: round2(eventStats.worldRecordValue),
        averagePerformance: eventStats.averagePerformanceText,
        averagePerformanceValue: round2(eventStats.averagePerformanceValue),
        lowerIsBetter: eventStats.lowerIsBetter,
        performanceUnit: eventStats.lowerIsBetter ? "seconds" : "meters",
        recordHistory: eventStats.recordHistory,
        peakAge: eventStats.peakAge,
        athleteEraYear: row.year || 2025,
        athleteImage: "./assets/img/profile.png",
        narrativeConclusion: getNarrativeConclusion(row, eventStats)
      };
    })
    .filter(Boolean);

  athletes.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
  return athletes;
};

// Parsing CSV
const parseCsvToAthletes = (csvUrl) =>
  new Promise((resolve, reject) => {
    const parser = window.Papa;
    if (!parser) {
      reject(new Error("PapaParse is not available."));
      return;
    }

    const eventAggregates = new Map();
    const athleteBestByEvent = new Map();

    parser.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      worker: false,
      chunkSize: 1024 * 1024,
      // chunk par chunk
      chunk: (result) => {
        for (const row of result.data) {
          if (!row) {
            continue;
          }

          const parsedRow = parseRow(row);
          if (!parsedRow) {
            continue;
          }

          ingestRow(parsedRow, eventAggregates, athleteBestByEvent);
        }
      },

      complete: () => {
        try {
          const eventStatsMap = buildEventStatsMap(eventAggregates);
          const athletes = buildAthleteStories(eventStatsMap, athleteBestByEvent);

          if (athletes.length === 0) {
            reject(new Error("No athletes could be built from final_data.csv"));
            return;
          }

          resolve(athletes);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error)
    });
  });


export const loadAthletesFromCsv = (csvUrl) => {
  if (cachedAthletesPromise) {
    return cachedAthletesPromise;
  }

  cachedAthletesPromise = parseCsvToAthletes(csvUrl).catch((error) => {
    cachedAthletesPromise = null;
    throw error;
  });

  return cachedAthletesPromise;
};
