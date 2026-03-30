const DATA_URL = "./assets/data/final_data.csv";
const form = document.querySelector("#athlete-form");
const drawButton = document.querySelector("#draw-button");
const statusText = document.querySelector("#status");
const resultCard = document.querySelector("#result");
const emptyState = document.querySelector("#empty-state");
const sexSelect = document.querySelector("#sex");
const nationalitySelect = document.querySelector("#nat");
const ageSelect = document.querySelector("#age");
const jerseyFlag = document.querySelector("#jersey-flag");
const jerseyFlagImage = document.querySelector("#jersey-flag-image");

const resultFields = {
  name: document.querySelector('[data-field="name"]'),
  country: document.querySelector('[data-field="country"]'),
  gender: document.querySelector('[data-field="gender"]'),
  age: document.querySelector('[data-field="age"]'),
};

let athletes = [];
let isDrawing = false;
let flagCodeLookup = new Map();
let nationalityNameLookup = new Map();
let allAgeOptions = [];
let allNationalityOptions = [];

const FLAG_CODE_OVERRIDES = {
  ALG: "dz",
  ANE: "",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BAH: "bs",
  BAR: "bb",
  BEL: "be",
  BER: "bm",
  BOT: "bw",
  BRA: "br",
  BRN: "bh",
  CAN: "ca",
  CHI: "cl",
  CHN: "cn",
  CIV: "ci",
  CMR: "cm",
  COL: "co",
  CRO: "hr",
  CUB: "cu",
  CZE: "cz",
  DEN: "dk",
  DOM: "do",
  ECU: "ec",
  EGY: "eg",
  ESP: "es",
  EST: "ee",
  ETH: "et",
  FIN: "fi",
  FRA: "fr",
  GBR: "gb",
  GER: "de",
  GRE: "gr",
  GRN: "gd",
  GUA: "gt",
  HUN: "hu",
  INA: "id",
  IND: "in",
  IRI: "ir",
  IRL: "ie",
  ISR: "il",
  ISV: "vi",
  ITA: "it",
  JAM: "jm",
  JPN: "jp",
  KAZ: "kz",
  KEN: "ke",
  KGZ: "kg",
  KOR: "kr",
  KSA: "sa",
  KUW: "kw",
  LAT: "lv",
  LBA: "ly",
  LTU: "lt",
  LUX: "lu",
  MAR: "ma",
  MDA: "md",
  MEX: "mx",
  MKD: "mk",
  MRI: "mu",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PER: "pe",
  PHI: "ph",
  POL: "pl",
  POR: "pt",
  PUR: "pr",
  QAT: "qa",
  ROU: "ro",
  RSA: "za",
  RUS: "ru",
  SEN: "sn",
  SLO: "si",
  SRB: "rs",
  SUD: "sd",
  SUI: "ch",
  SVK: "sk",
  SWE: "se",
  SYR: "sy",
  TPE: "tw",
  TRI: "tt",
  TUN: "tn",
  TUR: "tr",
  UAE: "ae",
  UKR: "ua",
  URU: "uy",
  USA: "us",
  UZB: "uz",
  VEN: "ve",
  VIE: "vn",
  ZAM: "zm",
  ZIM: "zw",
};

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function normalizeSex(value) {
  return value === "female" ? "Female" : "Male";
}

function formatDate(value) {
  return value || "Unknown";
}

function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function titleCaseWords(value) {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeLookupKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function setJerseyFlag(flagCode, label) {
  if (!flagCode) {
    jerseyFlag.hidden = true;
    jerseyFlagImage.removeAttribute("src");
    jerseyFlagImage.alt = "";
    return;
  }

  jerseyFlagImage.src = `https://flagcdn.com/w80/${flagCode}.png`;
  jerseyFlagImage.alt = `${label} flag`;
  jerseyFlag.hidden = false;
}

function resolveFlagCode(country, natCode) {
  const overrideCode = FLAG_CODE_OVERRIDES[natCode];

  if (overrideCode) {
    return overrideCode;
  }

  if (natCode && natCode.length === 2) {
    return natCode.toLowerCase();
  }

  const normalizedCountry = normalizeLookupKey(country);

  return flagCodeLookup.get(normalizedCountry) || "";
}

function resolveNationalityLabel(natCode) {
  if (!natCode) {
    return "Unknown";
  }

  return nationalityNameLookup.get(String(natCode).toLowerCase()) || natCode;
}

async function loadFlagCodes() {
  try {
    const response = await fetch("https://flagcdn.com/en/codes.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    nationalityNameLookup = new Map(
      Object.entries(data).map(([code, label]) => [code.toLowerCase(), titleCaseWords(label)])
    );
    flagCodeLookup = new Map(
      Object.entries(data).map(([code, label]) => [normalizeLookupKey(label), code.toLowerCase()])
    );
  } catch (error) {
    console.warn("Unable to load flag codes.", error);
  }
}

function buildAthletes(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const athletesMap = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);

    if (values.length !== headers.length) {
      continue;
    }

    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    const athleteKey = [row.Competitor, row.Sex, row.DOB, row.Nat].join("|");
    const parsedAge = Number.parseInt(row.Age, 10);

    if (!athletesMap.has(athleteKey)) {
      athletesMap.set(athleteKey, {
        name: row.Competitor,
        sex: row.Sex,
        dob: row.DOB,
        nat: row.Nat,
        country: resolveNationalityLabel(row.Nat),
        ages: new Set(),
        performances: [],
      });
    }

    const athlete = athletesMap.get(athleteKey);

    if (Number.isInteger(parsedAge)) {
      athlete.ages.add(parsedAge);
    }

    athlete.performances.push({
      event: row.Event || "Unknown",
      mark: row.Mark || "Unknown",
      date: row.Date || "",
      place: row.Place || "Unknown",
      age: parsedAge,
    });
  }

  return Array.from(athletesMap.values()).map((athlete) => ({
    ...athlete,
    ages: Array.from(athlete.ages).sort((a, b) => a - b),
  }));
}

function getCurrentFilters() {
  const rawAge = String(ageSelect.value || "").trim();

  return {
    sex: String(sexSelect.value || "").trim(),
    age: rawAge ? Number.parseInt(rawAge, 10) : null,
    nat: String(nationalitySelect.value || "").trim(),
  };
}

function findCandidates(selectedSex, selectedAge, selectedNationality) {
  return athletes.filter((athlete) => {
    const matchesSex = !selectedSex || athlete.sex === selectedSex;
    const matchesAge = !Number.isInteger(selectedAge) || athlete.ages.includes(selectedAge);
    const matchesNationality = !selectedNationality || athlete.nat === selectedNationality;
    return matchesSex && matchesAge && matchesNationality;
  });
}

function refillSelect(select, placeholderLabel, options, selectedValue) {
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderLabel;
  select.append(placeholder);

  for (const optionData of options) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.append(option);
  }

  select.value = options.some((option) => option.value === selectedValue) ? selectedValue : "";
}

function updateAdaptiveFilters(changedField = "") {
  const currentFilters = getCurrentFilters();

  const sexCandidates = findCandidates("", currentFilters.age, currentFilters.nat);
  const ageCandidates = findCandidates(currentFilters.sex, null, currentFilters.nat);
  const nationalityCandidates = findCandidates(currentFilters.sex, currentFilters.age, "");

  const availableSexes = new Set(sexCandidates.map((athlete) => athlete.sex));
  const availableAges = new Set(
    ageCandidates.flatMap((athlete) => athlete.ages).filter(Number.isInteger)
  );
  const availableNationalities = new Set(
    nationalityCandidates.map((athlete) => athlete.nat).filter(Boolean)
  );

  const sexOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ].filter((option) => availableSexes.has(option.value));

  const ageOptions = allAgeOptions.filter((option) => availableAges.has(Number.parseInt(option.value, 10)));
  const nationalityOptions = allNationalityOptions.filter((option) =>
    availableNationalities.has(option.value)
  );

  refillSelect(sexSelect, "Any gender", sexOptions, currentFilters.sex);
  refillSelect(ageSelect, "Any age", ageOptions, currentFilters.age ? String(currentFilters.age) : "");
  refillSelect(nationalitySelect, "Any", nationalityOptions, currentFilters.nat);

  if (changedField === "sex" && !sexSelect.value && currentFilters.sex) {
    setStatus("That gender no longer matches the other filters.");
  }
  if (changedField === "age" && !ageSelect.value && Number.isInteger(currentFilters.age)) {
    setStatus("That age no longer matches the other filters.");
  }
  if (changedField === "nat" && !nationalitySelect.value && currentFilters.nat) {
    setStatus("That nationality no longer matches the other filters.");
  }
}

function setButtonState(label, disabled = false) {
  drawButton.textContent = label;
  drawButton.disabled = disabled;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setEmptyState(visible) {
  emptyState.hidden = !visible;
}

function getPerformanceForReveal(athlete, requestedAge) {
  const performancePool = Number.isInteger(requestedAge)
    ? athlete.performances.filter((performance) => performance.age === requestedAge)
    : athlete.performances;

  return pickRandomItem(performancePool.length > 0 ? performancePool : athlete.performances);
}

function formatMatchSummary(count, sex, age, nationalityLabel) {
  const filters = [sex];

  if (Number.isInteger(age)) {
    filters.push(`${age} years old`);
  }

  if (nationalityLabel) {
    filters.push(nationalityLabel);
  }

  return `${count} athlete${count > 1 ? "s" : ""} match ${filters.join(" / ")}.`;
}

function revealAthlete(athlete, performance, candidateCount, nationalityLabel) {
  const preferredAge = Number.isInteger(performance.age)
    ? performance.age
    : athlete.ages[0];

  resultFields.name.textContent = athlete.name;
  resultFields.country.textContent = athlete.country || athlete.nat || "Unknown";
  resultFields.gender.textContent = normalizeSex(athlete.sex);
  resultFields.age.textContent = Number.isInteger(preferredAge)
    ? `${preferredAge} years old`
    : "Age unknown";
  setJerseyFlag(
    resolveFlagCode(athlete.country, athlete.nat),
    athlete.country || athlete.nat || "Unknown"
  );

  resultCard.hidden = false;
  setEmptyState(false);

  const countryPart = nationalityLabel ? ` from ${nationalityLabel}` : "";
  setStatus(
    `${candidateCount} possible match${candidateCount > 1 ? "es" : ""}${countryPart}. Revealed athlete ready.`
  );

  console.log("Random athlete reveal", {
    name: athlete.name,
    gender: normalizeSex(athlete.sex),
    ages: athlete.ages,
    dateOfBirth: formatDate(athlete.dob),
    nationalityCode: athlete.nat || "Unknown",
    country: athlete.country || athlete.nat || "Unknown",
    event: performance.event,
    mark: performance.mark,
    performanceDate: formatDate(performance.date),
    place: performance.place,
    height: "Not available in final_data.csv",
  });
}

async function loadAthletes() {
  setStatus("Loading athlete database...");
  setButtonState("Loading...", true);

  try {
    const [response] = await Promise.all([fetch(DATA_URL), loadFlagCodes()]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const csvText = await response.text();
    athletes = buildAthletes(csvText);
    allNationalityOptions = Array.from(
      new Map(
        athletes
          .filter((athlete) => athlete.nat)
          .map((athlete) => [athlete.nat, resolveNationalityLabel(athlete.nat)])
      ).entries()
    )
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
    allAgeOptions = Array.from(
      new Set(athletes.flatMap((athlete) => athlete.ages).filter(Number.isInteger))
    )
      .sort((a, b) => a - b)
      .map((age) => ({ value: String(age), label: String(age) }));

    updateAdaptiveFilters();

    setStatus(`${athletes.length} athletes ready for the draw.`);
    setButtonState("Start the draw");
  } catch (error) {
    setStatus("Unable to load the dataset. Run the page through a local server.");
    setButtonState("Unavailable", true);
    console.error(error);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (athletes.length === 0 || isDrawing) {
    return;
  }

  const formData = new FormData(form);
  const selectedSex = String(formData.get("sex") || "").trim();
  const rawAge = String(formData.get("age") || "").trim();
  const selectedAge = rawAge ? Number.parseInt(rawAge, 10) : null;
  const selectedNationality = String(formData.get("nat") || "").trim();
  const nationalityLabel =
    selectedNationality && nationalitySelect.selectedOptions[0]
      ? nationalitySelect.selectedOptions[0].textContent
      : "";

  const candidates = findCandidates(selectedSex, selectedAge, selectedNationality);

  if (candidates.length === 0) {
    resultCard.hidden = true;
    setEmptyState(true);
    setStatus("No athlete matches this profile. Try widening the filters.");
    return;
  }

  const sexLabel = normalizeSex(selectedSex);
  setStatus(
    formatMatchSummary(candidates.length, selectedSex ? sexLabel : "Any gender", selectedAge, nationalityLabel)
  );
  isDrawing = true;
  setButtonState("Revealing...", true);

  const athlete = pickRandomItem(candidates);
  const performance = getPerformanceForReveal(athlete, selectedAge);
  revealAthlete(athlete, performance, candidates.length, nationalityLabel);

  isDrawing = false;
  setButtonState("Draw again");
});

loadAthletes();

sexSelect.addEventListener("change", () => updateAdaptiveFilters("sex"));
ageSelect.addEventListener("change", () => updateAdaptiveFilters("age"));
nationalitySelect.addEventListener("change", () => updateAdaptiveFilters("nat"));
