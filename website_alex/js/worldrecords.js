// ─── World Records Podium ─────────────────────────────────────────────────────
let _wrData  = null;
let _wrSex   = 'M';
let _wrReady = false;

const _WR_W  = 680, _WR_H = 420;
const _WR_M  = { top: 48, right: 24, bottom: 76, left: 24 };
const _WR_IW = _WR_W - _WR_M.left - _WR_M.right;
const _WR_IH = _WR_H - _WR_M.top  - _WR_M.bottom;

const _wrX = d3.scaleBand().domain([2, 1, 3]).range([0, _WR_IW]).padding(0.22);
const _wrY = d3.scaleLinear().range([_WR_IH, 0]);

const _wrTip = d3.select('body').append('div').attr('class', 'wr-tooltip');

function _wrInit() {
  if (_wrReady) return;
  _wrReady = true;
  d3.select('#svg-podium')
    .attr('viewBox', `0 0 ${_WR_W} ${_WR_H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .append('g').attr('class', 'wr-g')
    .attr('transform', `translate(${_WR_M.left},${_WR_M.top})`);
}

function _wrDraw() {
  if (!_wrData || !_wrReady) return;

  const top3 = _wrData[_wrSex].slice(0, 3).map((d, i) => ({...d, pos: i + 1}));
  const isF  = _wrSex === 'F';
  const fill = isF ? '#9b5de5' : '#f0c520';
  const dark = isF ? '#6B35A0' : '#806F00';
  const dur  = 700;
  const g    = d3.select('.wr-g');

  _wrY.domain([0, d3.max(_wrData[_wrSex], d => d.Count) + 0.6]);

  // ── Bars ──────────────────────────────────────────────────────────────────
  const bars = g.selectAll('.wr-bar').data(top3, d => d.Competitor);
  bars.exit().transition().duration(dur).attr('y', _WR_IH).attr('height', 0).remove();

  bars.enter().append('rect').attr('class', 'wr-bar')
    .attr('rx', 6)
    .attr('x', d => _wrX(d.pos)).attr('width', _wrX.bandwidth())
    .attr('y', _WR_IH).attr('height', 0)
    .merge(bars)
    .on('mouseover', function(ev, d) {
      d3.select(this).attr('opacity', 1);
      const tc = isF ? '#D4AAFF' : '#f0c520';
      const rows = (d.Details || []).map(r =>
        `<div style="margin-top:4px">${r.Year} — <strong>${r.Event}</strong></div>`
      ).join('');
      _wrTip.html(`<div class="wr-tt-name" style="color:${tc}">${d.Competitor}</div>${rows}`)
        .style('opacity', 1);
    })
    .on('mousemove', ev => {
      _wrTip.style('left', (ev.pageX + 14) + 'px').style('top', (ev.pageY - 16) + 'px');
    })
    .on('mouseout', function(ev, d) {
      d3.select(this).attr('opacity', d.pos === 1 ? 1 : 0.72);
      _wrTip.style('opacity', 0);
    })
    .transition().duration(dur)
    .attr('x', d => _wrX(d.pos)).attr('width', _wrX.bandwidth())
    .attr('y', d => _wrY(d.Count)).attr('height', d => _WR_IH - _wrY(d.Count))
    .attr('fill', fill).attr('opacity', d => d.pos === 1 ? 1 : 0.72);

  // ── Count labels ──────────────────────────────────────────────────────────
  const counts = g.selectAll('.wr-count').data(top3, d => d.Competitor);
  counts.exit().remove();
  counts.enter().append('text').attr('class', 'wr-count')
    .attr('text-anchor', 'middle').attr('font-size', 24).attr('font-weight', '700')
    .attr('y', _WR_IH).merge(counts)
    .transition().duration(dur)
    .attr('x', d => _wrX(d.pos) + _wrX.bandwidth() / 2)
    .attr('y', d => _wrY(d.Count) - 10)
    .attr('fill', dark).text(d => d.Count);

  // ── Medals ────────────────────────────────────────────────────────────────
  const MEDALS = {1: '🥇', 2: '🥈', 3: '🥉'};
  const meds = g.selectAll('.wr-medal').data(top3, d => d.Competitor);
  meds.exit().remove();
  meds.enter().append('text').attr('class', 'wr-medal')
    .attr('text-anchor', 'middle').attr('font-size', 22).attr('y', _WR_IH + 24)
    .merge(meds).transition().duration(dur)
    .attr('x', d => _wrX(d.pos) + _wrX.bandwidth() / 2)
    .attr('y', _WR_IH + 24).text(d => MEDALS[d.pos]);

  // ── Name labels ───────────────────────────────────────────────────────────
  const names = g.selectAll('.wr-name').data(top3, d => d.Competitor);
  names.exit().remove();
  names.enter().append('text').attr('class', 'wr-name')
    .attr('text-anchor', 'middle').attr('font-size', 12).attr('font-weight', '600')
    .attr('fill', '#f0ede8').attr('y', _WR_IH + 24)
    .merge(names).transition().duration(dur)
    .attr('x', d => _wrX(d.pos) + _wrX.bandwidth() / 2)
    .attr('y', _WR_IH + 54).text(d => d.Competitor);
}

function setWrGender(btn, gender) {
  _wrSex = gender;
  document.querySelectorAll('#wr-controls .pill').forEach(p => {
    p.style.background = '';
    p.style.borderColor = '';
    p.style.color = '';
  });
  btn.style.background  = gender === 'M' ? '#f0c520' : '#9b5de5';
  btn.style.borderColor = gender === 'M' ? '#f0c520' : '#9b5de5';
  btn.style.color       = gender === 'M' ? '#0b0c0e' : '#ffffff';
  _wrDraw();
}

function goWorldRecords() {
  clearInterval(idleTimer);
  idleTimer = null;
  document.getElementById('s4').scrollIntoView({ behavior: 'smooth' });

  if (_wrData) { _wrInit(); _wrDraw(); return; }

  d3.json('records.json')
    .then(data => { _wrData = data; _wrInit(); _wrDraw(); })
    .catch(err  => console.error('[WR] records.json failed to load:', err));
}