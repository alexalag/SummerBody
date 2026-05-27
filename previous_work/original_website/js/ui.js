// ─── Sex filter ───────────────────────────────────────────────────────────────
function setSex(btn, val) {
  sexFilter = val;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  poolChange();
}

// ─── Character style picker ───────────────────────────────────────────────────
function setCharStyle(btn, styleIdx) {
  _charStyle = styleIdx;
  document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const sex = athlete ? athlete._sex : (sexFilter || 'male');
  drawChar(document.getElementById('char-canvas'), frameIdx, sex);
}

// ─── Build filtered pool ──────────────────────────────────────────────────────
function getPool() {
  const nat   = document.getElementById('nat-sel').value;
  const yFrom = +document.getElementById('yr-from').value || 0;
  const yTo   = +document.getElementById('yr-to').value   || 9999;
  return ALL.filter(r =>
    (!sexFilter || r._sex === sexFilter) &&
    (!nat       || r.Nat  === nat) &&
    (!r._year   || (r._year >= yFrom && r._year <= yTo))
  );
}

// ─── Update pool count ────────────────────────────────────────────────────────
function poolChange() {
  const pool   = getPool();
  const unique = new Set(pool.map(r => r.Competitor)).size;
  const el     = document.getElementById('pool-count');
  el.innerHTML = pool.length
    ? `<strong>${unique}</strong> athlete${unique !== 1 ? 's' : ''} available`
    : '<span style="color:var(--muted)">No match — widen filters</span>';
}

// ─── Randomize ────────────────────────────────────────────────────────────────
function randomize() {
  const pool = getPool();
  if (!pool.length) {
    document.getElementById('info-card').innerHTML =
      '<p class="info-hint">No athletes match these filters</p>';
    athlete = null;
    document.getElementById('btn-go').style.display = 'none';
    return;
  }

  const unique = [...new Map(pool.map(r => [r.Competitor, r])).values()];
  athlete      = unique[Math.floor(Math.random() * unique.length)];

  const sex  = athlete._sex;
  const flag = flagEmoji(athlete.Nat);
  const dob  = athlete.DOB
    ? new Date(athlete.DOB).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  startIdle(sex);

  document.getElementById('flag-s1').textContent   = flag;
  document.getElementById('char-name').textContent = athlete.Competitor.split(' ')[0];

  document.getElementById('info-card').innerHTML = `
    <div class="info-name">${athlete.Competitor}</div>
    <div class="info-sub">${flag} ${athlete.Nat} &nbsp;·&nbsp; Born ${dob}</div>
    <div class="info-sub">${athlete.Event} &nbsp;·&nbsp; PB ${athlete.Mark}</div>
  `;

  document.getElementById('btn-go').style.display = 'block';
}
