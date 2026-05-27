// ─── Shared application state ────────────────────────────────────────────────
let ALL        = [];    // all parsed CSV rows
let sexFilter  = '';    // '' | 'male' | 'female'
let athlete    = null;  // currently selected athlete row
let _charStyle = 0;     // 0 = sprinter  1 = marathon  2 = jumper

// ─── CSV parser ──────────────────────────────────────────────────────────────
function parseCSV(text, delim = ';') {
  const clean = text.trim().replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = clean.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const hdrs = lines[0].split(delim).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(delim);
    const row  = {};
    hdrs.forEach((h, i) => row[h] = (vals[i] || '').trim());
    row._sex  = (row.Sex || '').toLowerCase().trim();
    row._year = row.DOB ? +row.DOB.slice(0, 4) : null;
    return row;
  }).filter(row => row.Competitor);
}
