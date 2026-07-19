(() => {
  const TRACK_URL = 'skinners-bar-bingo.mp3';
  const DEFAULT_VOLUME = 0.32;
  const audio = new Audio(TRACK_URL);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = DEFAULT_VOLUME;

  let started = false;
  let fading = false;
  let enabled = true;
  let gameplayStarted = false;

  const soundButton = document.getElementById('soundBtn');
  const startButton = document.getElementById('startGameBtn');
  const newRoundButton = document.getElementById('newRoundBtn');
  const gameView = document.getElementById('gameView');

  function gameIsActive() {
    return gameplayStarted || gameView?.classList.contains('active');
  }

  async function beginIntroMusic() {
    if (started || !enabled || fading || gameIsActive()) return;
    try {
      audio.muted = false;
      audio.volume = DEFAULT_VOLUME;
      await audio.play();
      started = true;
    } catch (error) {
      console.debug('Intro music is waiting for another user tap.', error);
    }
  }

  function stopImmediately() {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = DEFAULT_VOLUME;
    started = false;
    fading = false;
  }

  function fadeOutIntro(duration = 900) {
    gameplayStarted = true;
    if (audio.paused) {
      stopImmediately();
      return;
    }

    fading = true;
    const initialVolume = audio.volume;
    const startedAt = performance.now();

    function step(now) {
      if (!fading) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = initialVolume * (1 - progress);
      if (progress < 1) requestAnimationFrame(step);
      else stopImmediately();
    }

    requestAnimationFrame(step);
  }

  function handleInteraction() {
    if (gameIsActive()) {
      stopImmediately();
      return;
    }
    beginIntroMusic();
  }

  document.addEventListener('pointerdown', handleInteraction, { passive: true });
  document.addEventListener('keydown', handleInteraction, { passive: true });

  startButton?.addEventListener('click', () => fadeOutIntro(900), true);
  newRoundButton?.addEventListener('click', () => {
    gameplayStarted = true;
    stopImmediately();
  }, true);

  soundButton?.addEventListener('click', () => {
    enabled = !enabled;
    audio.muted = !enabled;
    if (!enabled || gameIsActive()) stopImmediately();
    else beginIntroMusic();
  });

  if (gameView) {
    new MutationObserver(() => {
      if (gameView.classList.contains('active')) {
        gameplayStarted = true;
        stopImmediately();
      }
    }).observe(gameView, { attributes: true, attributeFilter: ['class'] });
  }

  audio.addEventListener('play', () => {
    if (gameIsActive()) stopImmediately();
  });

  document.addEventListener('click', event => {
    const tile = event.target.closest?.('.game-tile[data-game]');
    if (!tile) return;
    const name = tile.dataset.game;
    const routes = {
      'Pub Quiz': 'pub-quiz.html',
      'Play Your Cards Right': 'play-your-cards-right.html',
      'Reaction Game': 'reaction-game.html',
      'Deal or No Deal': 'deal-or-no-deal.html',
      'Fruit Machine': 'fruit-machine.html',
      'Race Night': 'race-night.html',
      'Wheel of Fortune': 'wheel-of-fortune.html'
    };
    if (!routes[name]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    stopImmediately();
    window.location.href = routes[name];
  }, true);

  const liveGames = ['Pub Quiz', 'Play Your Cards Right', 'Reaction Game', 'Deal or No Deal', 'Fruit Machine', 'Race Night', 'Wheel of Fortune'];
  liveGames.forEach(name => {
    const tile = document.querySelector(`.game-tile[data-game="${name}"]`);
    if (!tile) return;
    const badge = tile.querySelector('.tile-badge');
    if (badge) badge.textContent = 'Play now';
  });

  window.addEventListener('pagehide', stopImmediately);
})();