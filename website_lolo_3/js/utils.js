
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);


export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


export const getCountries = (athletes) => {
  const uniqueCountries = Array.from(new Set(athletes.map((athlete) => athlete.country)));
  return ["Any", ...uniqueCountries.sort((a, b) => a.localeCompare(b))];
};


const matchesAge = (athleteAge, filter) => {
  switch (filter) {
    case "Under 23":
      return athleteAge < 23;
    case "23-27":
      return athleteAge >= 23 && athleteAge <= 27;
    case "28+":
      return athleteAge >= 28;
    default:
      return true;
  }
};


export const filterAthletes = (athletes, filters) =>
  athletes.filter((athlete) => {
    const sexMatch = filters.sex === "Any" || athlete.sex === filters.sex;
    const countryMatch = filters.country === "Any" || athlete.country === filters.country;
    return sexMatch && countryMatch && matchesAge(athlete.age, filters.age);
  });


export const drawAthlete = (athletes, filters) => {
  const matches = filterAthletes(athletes, filters);
  const pool = matches.length > 0 ? matches : athletes;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const formatSecondsDisplay = (seconds) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const remainingAfterHours = seconds - hours * 3600;
    const minutes = Math.floor(remainingAfterHours / 60);
    const finalSeconds = Math.round(remainingAfterHours - minutes * 60);
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(finalSeconds).padStart(2, "0")}`;
  }

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;
    return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
  }

  return seconds.toFixed(2);
};


export const formatDelta = (value, unit) => {
  if (unit === "meters") {
    return `${value.toFixed(2)}M`;
  }

  if (value >= 60) {
    return `${formatSecondsDisplay(value)} FROM HISTORY`;
  }

  return `${value.toFixed(2)} SECONDS FROM HISTORY`;
};


export const getGapToRecord = (athlete) =>
  athlete.lowerIsBetter
    ? athlete.bestPerformanceValue - athlete.worldRecordValue
    : athlete.worldRecordValue - athlete.bestPerformanceValue;


export const getAverageGap = (athlete) =>
  athlete.lowerIsBetter
    ? athlete.averagePerformanceValue - athlete.bestPerformanceValue
    : athlete.bestPerformanceValue - athlete.averagePerformanceValue;


export const getAverageHeadline = (athlete) => {
  const gap = getAverageGap(athlete);
  const ratio = gap / Math.max(Math.abs(athlete.averagePerformanceValue), 1);

  if (ratio < -0.02) {
    return "STILL CHASING THE FRONT EDGE";
  }

  if (ratio > 0.06) {
    return "AHEAD OF THE PACK";
  }

  if (ratio > 0.025) {
    return "CLOSER TO ELITE THAN TO AVERAGE";
  }

  return "RIGHT ON THE EDGE OF SEPARATION";
};


export const getPrimeNarrative = (athlete) => {
  const diff = athlete.age - athlete.peakAge;
  const prefix = athlete.sex === "Female" ? "SHE'S" : "HE'S";

  if (diff <= -2) {
    return `${prefix} BEFORE ${athlete.sex === "Female" ? "HER" : "HIS"} PRIME`;
  }

  if (Math.abs(diff) <= 1) {
    return `${prefix} RIGHT AT PEAK AGE`;
  }

  return `${prefix} PAST THE HISTORICAL SWEET SPOT`;
};


export const getRecordProgressRatio = (athlete) => {
  const raw = athlete.lowerIsBetter
    ? athlete.worldRecordValue / athlete.bestPerformanceValue
    : athlete.bestPerformanceValue / athlete.worldRecordValue;
  return clamp(raw, 0.7, 1);
};
