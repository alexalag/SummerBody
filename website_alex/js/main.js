// ─── Boot: load CSV and initialise UI ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  fetch('data.csv')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} — cannot load data.csv`);
      return r.text();
    })
    .then(text => {

      // ── Diagnostics: log the raw file to the console ──────────────────────
      const rawLines = text.split('\n');
      console.log('[CSV] Total raw lines:', rawLines.length);
      console.log('[CSV] First 300 chars:', JSON.stringify(text.slice(0, 300)));
      console.log('[CSV] First line:', JSON.stringify(rawLines[0]));
      console.log('[CSV] Second line:', JSON.stringify(rawLines[1]));

      // ── Auto-detect delimiter (semicolon or comma) ────────────────────────
      const firstLine = rawLines[0].replace(/\r/g, '');
      const delim = firstLine.includes(';') ? ';' : ',';
      console.log('[CSV] Detected delimiter:', JSON.stringify(delim));

      ALL = parseCSV(text, delim);
      console.log('[CSV] Parsed rows:', ALL.length);
      if (ALL.length) console.log('[CSV] First row sample:', ALL[0]);

      if (!ALL.length) {
        showError(`data.csv loaded (${rawLines.length} lines) but 0 rows parsed.
          Detected delimiter: "${delim}".
          First line: ${firstLine.slice(0, 120)}
          → Open the browser console (F12) for full details.`);
        return;
      }

      // ── Populate nationality dropdown ──────────────────────────────────────
      const nats = [...new Set(ALL.map(r => r.Nat))].filter(Boolean).sort();
      const sel  = document.getElementById('nat-sel');
      nats.forEach(n => {
        const o       = document.createElement('option');
        o.value       = n;
        o.textContent = `${flagEmoji(n)} ${n}`;
        sel.appendChild(o);
      });

      poolChange();
      startIdle('male');
    })
    .catch(err => {
      showError(err.message);
      console.error('[CSV] Fetch error:', err);
    });

});

// ─── Visible error ────────────────────────────────────────────────────────────
function showError(msg) {
  document.getElementById('info-card').innerHTML = `
    <p class="info-hint" style="color:#f87171;white-space:pre-wrap">⚠ ${msg}</p>
    <p class="info-hint" style="margin-top:8px">
      Open browser console (F12 → Console) for full details.
    </p>
  `;
  document.getElementById('pool-count').textContent = '';
}

function goBack() {
  document.getElementById('s1').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('run-label').classList.remove('show');
  const sex = athlete ? athlete._sex : _idleSex;
  startIdle(sex);   // ← replaces the single clearInterval(runTimer) line
}
