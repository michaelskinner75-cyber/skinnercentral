(() => {
  const TRACK_URL = 'skinners-bar-bingo.mp3';
  const audio = new Audio(TRACK_URL);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.32;

  let started = false;
  let fading = false;
  let enabled = true;

  const soundButton = document.getElementById('soundBtn');
  const startButton = document.getElementById('startGameBtn');
  const newRoundButton = document.getElementById('newRoundBtn');

  async function beginIntroMusic() {
    if (started || !enabled || fading) return;
    try {
      await audio.play();
      started = true;
    } catch (error) {
      console.debug('Intro music is waiting for another user tap.', error);
    }
  }

  function fadeOutIntro(duration = 5000) {
    if (fading || audio.paused) return;
    fading = true;
    const initialVolume = audio.volume;
    const startedAt = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = initialVolume * (1 - progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.32;
        started = false;
        fading = false;
      }
    }

    requestAnimationFrame(step);
  }

  function stopImmediately() {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.32;
    started = false;
    fading = false;
  }

  document.addEventListener('pointerdown', beginIntroMusic, { passive: true });
  document.addEventListener('keydown', beginIntroMusic, { passive: true });

  startButton?.addEventListener('click', () => fadeOutIntro(5000), true);
  newRoundButton?.addEventListener('click', stopImmediately, true);

  soundButton?.addEventListener('click', () => {
    enabled = !enabled;
    audio.muted = !enabled;
    if (!enabled) {
      audio.pause();
    } else if (!fading && !document.getElementById('gameView')?.classList.contains('active')) {
      beginIntroMusic();
    }
  });

  const gameView = document.getElementById('gameView');
  if (gameView) {
    new MutationObserver(() => {
      if (gameView.classList.contains('active')) fadeOutIntro(800);
    }).observe(gameView, { attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('pagehide', stopImmediately);
})();
