let idleTimer = null;
let frameIdx  = 0;
let runTimer  = null;
let _idleSex  = 'male';            // ← new: persists across goBack

function startIdle(sex) {
  _idleSex = sex || 'male';
  clearInterval(idleTimer);
  clearInterval(runTimer);          // ← new: kills any in-flight run
  runTimer = null;

  frameIdx = 0;
  const canvas = document.getElementById('char-canvas');
  drawChar(canvas, 0, _idleSex);

  idleTimer = setInterval(() => {
    frameIdx = (frameIdx === 0) ? 2 : 0;
    drawChar(canvas, frameIdx, _idleSex);
  }, 550);
}

function goRun() {
  if (!athlete) return;

  clearInterval(idleTimer);         // ← key fix: stops idle before run
  clearInterval(runTimer);
  idleTimer = null;
  runTimer  = null;

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

    let x         = -220;
    let runFrame  = 0;
    const FRAME_MS  = 112;
    const SPEED_PX  = 7;
    const vw        = window.innerWidth;
    let   lastFrameT = performance.now();

    drawChar(rc, runFrame, sex);   // frame 0 immediately
    runFrame = 1;

    clearInterval(runTimer);
    runTimer = setInterval(() => {
      const now = performance.now();
      x += SPEED_PX;

      if (now - lastFrameT >= FRAME_MS) {
        drawChar(rc, runFrame, sex);
        runFrame   = (runFrame + 1) % 4;
        lastFrameT = now;
      }

      rc.style.left = `${x}px`;
      rf.style.left = `${x + FLAG_CX}px`;

      if (x > vw + 220) {
        clearInterval(runTimer);
        runTimer = null;
        setTimeout(() => {
          renderPodium();
          document.getElementById('s3').scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    }, 16);
  }, 700);
}