let idleTimer = null;
let frameIdx  = 0;
let runTimer  = null;

// Idle: slow 2-frame cycle (frames 0 and 2 — both foot-plant poses)
function startIdle(sex) {
  clearInterval(idleTimer);
  frameIdx = 0;
  const canvas = document.getElementById('char-canvas');
  drawChar(canvas, 0, sex);
  idleTimer = setInterval(() => {
    frameIdx = frameIdx === 0 ? 2 : 0;
    drawChar(canvas, frameIdx, sex);
  }, 550);
}

// Run: full 4-frame cycle
function goRun() {
  if (!athlete) return;

  const sex  = athlete._sex;
  const flag = flagEmoji(athlete.Nat);
  const rc   = document.getElementById('run-canvas');
  const rf   = document.getElementById('flag-s2');
  const rl   = document.getElementById('run-label');

  rf.textContent = flag;
  rc.style.left  = '-220px';
  rf.style.left  = `${-220 + FLAG_CX}px`;
  rl.classList.remove('show');

  document.getElementById('s2').scrollIntoView({ behavior: 'smooth' });

  setTimeout(() => {
    rl.classList.add('show');
    let x    = -220;
    let tick = 0;
    const vw = window.innerWidth;

    clearInterval(runTimer);
    runTimer = setInterval(() => {
      x    += 7;
      tick++;
      // Advance one frame every 6 ticks (~96ms) → full 4-frame cycle ≈ 384ms
      drawChar(rc, Math.floor(tick / 6) % 4, sex);
      rc.style.left = `${x}px`;
      rf.style.left = `${x + FLAG_CX}px`;

      if (x > vw + 220) {
        clearInterval(runTimer);
        setTimeout(() => {
          renderPodium();
          document.getElementById('s3').scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }, 16);
  }, 700);
}
