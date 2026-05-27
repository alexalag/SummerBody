// ─── World Records Map ────────────────────────────────────────────────────────
let _mapData      = null;
let _mapCountries = null;
let _mapYears     = [];
let _mapYearIdx   = 0;
let _mapDragging  = false;
let _mapTimer     = null;
let _mapPlaying   = false;
let _mapBuilt     = false;

const _mapColM = d3.scaleLinear().range(['#FFED7B','#f0c520']).interpolate(d3.interpolateHcl);
const _mapColF = d3.scaleLinear().range(['#D4AAFF','#9b5de5']).interpolate(d3.interpolateHcl);
const _mapGray = '#1e2832';

const _mapTip = d3.select('body').append('div').attr('class','map-tip');

let _mapProj, _mapPathGen;

function _mapDims() {
  const s5 = document.getElementById('s5');
  return { w: s5.offsetWidth || window.innerWidth,
           h: (s5.offsetHeight || window.innerHeight) - 80 };
}

function _mapBuild() {
  if (_mapBuilt) return;
  _mapBuilt = true;
  const { w, h } = _mapDims();
  _mapProj    = d3.geoMercator().scale(w / 6.2).translate([w / 2, h / 1.6]);
  _mapPathGen = d3.geoPath().projection(_mapProj);
  _mapBuildSVG('svg-male',   false);
  _mapBuildSVG('svg-female', true);
  _mapSetupSeparator();
  _mapSetupSlider();
  _mapSetupPlay();
  _mapDrawLegend();
  _mapUpdate();
}

function _mapBuildSVG(id, isFemale) {
  const { w, h } = _mapDims();
  d3.select('#' + id).attr('width', w).attr('height', h)
    .selectAll('.mc').data(_mapCountries).enter()
    .append('path').attr('class','mc')
    .attr('d', _mapPathGen)
    .attr('fill', _mapGray)
    .attr('stroke','#0b0c0e').attr('stroke-width', 0.4)
    .on('mouseover', (ev, d) => {
      d3.select(ev.currentTarget).attr('stroke','#f0ede8').attr('stroke-width', 1.5);
      const yr   = _mapYears[_mapYearIdx];
      const name = d.properties.name;
      const iso  = d.properties.iso_a3 || _mapNumToA3(d.id);
      const recs = _mapData[yr]?.[isFemale ? 'F' : 'M']?.[iso] || [];
      const rows = recs.map(r =>
        `<div style="margin-top:4px">🏅 <strong>${r.Event}</strong><br>
         <span style="opacity:.65;font-size:11px">${r.Competitor}</span></div>`
      ).join('');
      _mapTip.html(`<div class="map-tip-title">${name} (${yr})</div>
        ${rows || '<div style="opacity:.45;margin-top:4px">No record this year</div>'}`)
        .style('opacity', 1);
    })
    .on('mousemove', ev => {
      _mapTip.style('left',(ev.pageX+14)+'px').style('top',(ev.pageY-16)+'px');
    })
    .on('mouseout', ev => {
      d3.select(ev.currentTarget).attr('stroke','#0b0c0e').attr('stroke-width', 0.4);
      _mapTip.style('opacity', 0);
    });
}

function _mapUpdate() {
  const yr = _mapYears[_mapYearIdx];
  document.getElementById('map-year').textContent = yr;
  document.getElementById('map-slider').value = _mapYearIdx;
  _mapColorSVG('svg-male',   _mapData[yr].M, _mapColM);
  _mapColorSVG('svg-female', _mapData[yr].F, _mapColF);
}

function _mapColorSVG(id, yearRecs, scale) {
  d3.select('#' + id).selectAll('.mc')
    .transition().duration(120)
    .attr('fill', d => {
      const iso  = d.properties.iso_a3 || _mapNumToA3(d.id);
      const list = iso && yearRecs[iso];
      return list ? scale(list.length) : _mapGray;
    });
}

function _mapSetupSeparator() {
  const container = document.getElementById('map-container');
  const sep       = document.getElementById('map-sep');
  const femWrap   = document.getElementById('map-wrap-female');

  const apply = x => {
    const pct = (x / (container.offsetWidth || window.innerWidth)) * 100;
    femWrap.style.clipPath = `inset(0 0 0 ${pct}%)`;
    sep.style.left = x + 'px';
  };

  apply((container.offsetWidth || window.innerWidth) / 2);

  sep.addEventListener('mousedown', () => _mapDragging = true);
  window.addEventListener('mouseup',   () => _mapDragging = false);
  window.addEventListener('mousemove', ev => {
    if (!_mapDragging) return;
    const rect = container.getBoundingClientRect();
    let x = ev.clientX - rect.left;
    x = Math.max(50, Math.min(container.offsetWidth - 50, x));
    apply(x);
  });
}

function _mapSetupSlider() {
  const sl = document.getElementById('map-slider');
  sl.min   = 0;
  sl.max   = _mapYears.length - 1;
  sl.value = _mapYearIdx;
  sl.addEventListener('input', function() { _mapYearIdx = +this.value; _mapUpdate(); });
}

function _mapSetupPlay() {
  const btn  = document.getElementById('map-play');
  const icon = btn.querySelector('.mpi');
  btn.addEventListener('click', () => {
    if (_mapPlaying) {
      clearInterval(_mapTimer);
      _mapPlaying = false;
      icon.innerHTML = '&#9654;';
    } else {
      _mapPlaying = true;
      icon.innerHTML = '&#9208;';
      _mapTimer = setInterval(() => {
        _mapYearIdx = (_mapYearIdx + 1) % _mapYears.length;
        _mapUpdate();
      }, 500);
    }
  });
}

function _mapDrawLegend() {
  const svg = d3.select('#map-legend-svg');
  const W = 180, H = 16;
  const defs = svg.append('defs');
  [['male',_mapColM],['female',_mapColF]].forEach(([name, scale]) => {
    const g = defs.append('linearGradient').attr('id','mlg-'+name).attr('x1','0%').attr('x2','100%');
    g.append('stop').attr('offset','0%').attr('stop-color', scale.range()[0]);
    g.append('stop').attr('offset','100%').attr('stop-color', scale.range()[1]);
  });
  svg.append('rect').attr('x',0).attr('y',0).attr('width',W).attr('height',H/2).attr('fill','url(#mlg-female)');
  svg.append('rect').attr('x',0).attr('y',H/2).attr('width',W).attr('height',H/2).attr('fill','url(#mlg-male)');
  svg.append('text').attr('x',0).attr('y',H+12).attr('font-size',10).attr('fill','#6b7280').text('1');
  svg.append('text').attr('x',W).attr('y',H+12).attr('text-anchor','end').attr('font-size',10).attr('fill','#6b7280').text('max');
}

function _mapNumToA3(id) {
  const t = {840:'USA',826:'GBR',250:'FRA',276:'DEU',380:'ITA',392:'JPN',724:'ESP',
    156:'CHN',578:'NOR',752:'SWE',643:'RUS',46:'BEL',788:'TUN',642:'ROU',756:'CHE',
    620:'PRT',76:'BRA',616:'POL',203:'CZE',492:'MCO',528:'NLD',191:'HRV',36:'AUS',
    410:'KOR',404:'KEN',231:'ETH',388:'JAM',192:'CUB',504:'MAR',484:'MEX'};
  return t[Number(id)];
}

function goWorldMap() {
  clearInterval(idleTimer);
  clearInterval(runTimer);
  idleTimer = null; runTimer = null;
  document.getElementById('s5').scrollIntoView({ behavior: 'smooth' });

  if (_mapData && _mapBuilt) return;

  Promise.all([
    d3.json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json'),
    d3.json('map-records.json')
  ]).then(([topo, records]) => {
    _mapCountries = topojson.feature(topo, topo.objects.countries).features;
    _mapData  = records;
    _mapYears = Object.keys(records).sort();
    _mapYearIdx = _mapYears.length - 1;

    let maxCount = 1;
    Object.values(records).forEach(yr =>
      ['M','F'].forEach(s => Object.values(yr[s]).forEach(list =>
        maxCount = Math.max(maxCount, list.length)
      ))
    );
    _mapColM.domain([0, maxCount]);
    _mapColF.domain([0, maxCount]);
    _mapBuild();
  }).catch(err => console.error('[MAP] load failed:', err));
}