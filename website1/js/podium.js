// ─── Podium state ─────────────────────────────────────────────────────────────
let _podiumRows   = [];   // full deduplicated ranking for current event
let _youIdx       = -1;   // index of selected athlete in _podiumRows
let _expandedEnd  = 0;    // how far into the gap we have expanded
let _activeEvent  = '';   // currently displayed event
let _athleteEvents = [];  // all events this athlete has a record in

// ─── Entry point (called after run animation) ─────────────────────────────────
function renderPodium() {
  if (!athlete) return;

  // Find all distinct events this athlete appears in, sorted alphabetically
  _athleteEvents = [...new Set(
    ALL
      .filter(r => r.Competitor === athlete.Competitor)
      .map(r => r.Event)
  )].sort();

  // Default to the event from the randomly picked row
  _activeEvent = athlete.Event;

  // Header + "You" card
  const flag = flagEmoji(athlete.Nat);
  document.getElementById('you-flag').textContent = flag;
  document.getElementById('you-name').textContent = athlete.Competitor;
  document.getElementById('podium-you').style.display = 'flex';

  renderEventTabs();
  switchEvent(_activeEvent);
}

// ─── Render event tab pills ────────────────────────────────────────────────────
function renderEventTabs() {
  // Remove any previous tab strip
  const existing = document.getElementById('event-tabs');
  if (existing) existing.remove();

  // Only render tabs if the athlete has more than one event
  if (_athleteEvents.length <= 1) return;

  const strip = document.createElement('div');
  strip.id = 'event-tabs';
  strip.className = 'event-tabs';

  _athleteEvents.forEach(ev => {
    const btn = document.createElement('button');
    btn.className = 'event-tab' + (ev === _activeEvent ? ' active' : '');
    btn.textContent = ev;
    btn.onclick = () => switchEvent(ev);
    strip.appendChild(btn);
  });

  // Insert above the rank list
  const list = document.getElementById('rank-list');
  list.parentNode.insertBefore(strip, list);
}

// ─── Switch to a different event ───────────────────────────────────────────────
function switchEvent(event) {
  _activeEvent  = event;
  _expandedEnd  = 3;

  // Update active tab style
  document.querySelectorAll('.event-tab').forEach(b => {
    b.classList.toggle('active', b.textContent === event);
  });

  // Find athlete's best mark in this event
  const myRows = ALL.filter(r => r.Competitor === athlete.Competitor && r.Event === event);
  const myBest = myRows.sort((a, b) => +a.Rank - +b.Rank)[0];

  // Update "you" info line
  document.getElementById('you-info').textContent = myBest
    ? `PB ${myBest.Mark}  ·  Rank #${myBest.Rank}  ·  ${athlete.Nat}`
    : `${athlete.Nat}  ·  no record in this event`;

  // Update header
  document.getElementById('ev-title').innerHTML =
    `Rankings<br><span>${event}</span>`;

  // Build the full deduplicated ranking for this event
  const rows = ALL
    .filter(r => r.Event === event)
    .sort((a, b) => +a.Rank - +b.Rank);

  const seen = new Set();
  _podiumRows = rows.filter(r => {
    if (seen.has(r.Competitor)) return false;
    seen.add(r.Competitor);
    return true;
  });

  _youIdx = _podiumRows.findIndex(r => r.Competitor === athlete.Competitor);

  buildList();
}

// ─── Build the visible list ────────────────────────────────────────────────────
function buildList() {
  const list     = document.getElementById('rank-list');
  const maxScore = Math.max(..._podiumRows.map(r => +r['Results Score'] || 0));

  list.innerHTML = '';

  const top3End  = Math.min(3, _podiumRows.length);
  const ctxStart = _youIdx >= 0 ? Math.max(top3End, _youIdx - 2) : top3End;
  const ctxEnd   = _youIdx >= 0 ? Math.min(_podiumRows.length, _youIdx + 3) : top3End;

  // ── Top 3 ────────────────────────────────────────────────────────────────
  for (let i = 0; i < top3End; i++) {
    list.appendChild(makeRow(_podiumRows[i], i, maxScore));
  }

  // ── Collapsible gap ───────────────────────────────────────────────────────
  const gapStart   = top3End;
  const gapEnd     = ctxStart;

  if (gapEnd > gapStart) {
    const visibleEnd = Math.min(_expandedEnd, gapEnd);

    for (let i = gapStart; i < visibleEnd; i++) {
      list.appendChild(makeRow(_podiumRows[i], i, maxScore));
    }

    const remaining = gapEnd - visibleEnd;
    if (remaining > 0) {
      list.appendChild(makeExpander(visibleEnd, gapEnd, remaining));
    }
  }

  // ── Athlete context (±2) ──────────────────────────────────────────────────
  if (_youIdx >= 0) {
    for (let i = ctxStart; i < ctxEnd; i++) {
      list.appendChild(makeRow(_podiumRows[i], i, maxScore));
    }
  } else {
    // Athlete has no ranking in this event
    const note = document.createElement('div');
    note.className = 'no-rank-note';
    note.textContent = `${athlete.Competitor} has no ranked performance in ${_activeEvent}`;
    list.appendChild(note);
  }

  // Animate bars
  list.querySelectorAll('.rbar-fill[data-pct]').forEach((el, i) => {
    setTimeout(() => { el.style.width = el.dataset.pct + '%'; }, 40 + i * 25);
  });

  // Scroll athlete into view
  if (_youIdx >= 0) {
    setTimeout(() => {
      const you = list.querySelector('.you');
      if (you) you.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  }
}

// ─── Single ranking row ────────────────────────────────────────────────────────
function makeRow(r, idx, maxScore) {
  const isYou  = r.Competitor === athlete.Competitor;
  const pct    = maxScore > 0 ? Math.round((+r['Results Score'] / maxScore) * 100) : 50;
  const sexCls = r._sex || 'male';
  const medal  = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

  const div = document.createElement('div');
  div.className = `ritem ${sexCls}${isYou ? ' you' : ''}`;
  div.innerHTML = `
    <span class="rpos">${medal ? `<span class="medal">${medal}</span>` : `#${r.Rank}`}</span>
    <span class="rname">${r.Competitor}</span>
    <div class="rbar"><div class="rbar-fill" data-pct="${pct}" style="width:0%"></div></div>
    <span class="rmark">${r.Mark}</span>
    ${isYou ? '<span class="you-tag">YOU</span>' : '<span></span>'}
  `;
  return div;
}

// ─── Expander row ──────────────────────────────────────────────────────────────
function makeExpander(visibleEnd, gapEnd, remaining) {
  const showCount = Math.min(10, remaining);
  const div = document.createElement('div');
  div.className = 'gap-expander';
  div.innerHTML = `
    <span class="gap-dots">· · ·</span>
    <span class="gap-count">${remaining} athlete${remaining !== 1 ? 's' : ''} hidden</span>
    <button class="gap-btn" onclick="expandGap(${visibleEnd}, ${gapEnd})">
      Show ${showCount} more ↓
    </button>
  `;
  return div;
}

// ─── Expand 10 more rows ───────────────────────────────────────────────────────
function expandGap(visibleEnd, gapEnd) {
  _expandedEnd = Math.min(visibleEnd + 10, gapEnd);
  buildList();
}
