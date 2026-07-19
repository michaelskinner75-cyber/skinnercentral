(() => {
  const TRACK_URL = 'skinners-bar-bingo.mp3';
  const DEFAULT_VOLUME = 0.32;
  const audio = new Audio(TRACK_URL);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = DEFAULT_VOLUME;
  let started = false, fading = false, enabled = true, gameplayStarted = false;
  const soundButton = document.getElementById('soundBtn');
  const startButton = document.getElementById('startGameBtn');
  const newRoundButton = document.getElementById('newRoundBtn');
  const gameView = document.getElementById('gameView');
  const gameIsActive = () => gameplayStarted || gameView?.classList.contains('active');
  async function beginIntroMusic(){if(started||!enabled||fading||gameIsActive())return;try{audio.muted=false;audio.volume=DEFAULT_VOLUME;await audio.play();started=true}catch(e){console.debug('Intro music is waiting for another tap.',e)}}
  function stopImmediately(){audio.pause();audio.currentTime=0;audio.volume=DEFAULT_VOLUME;started=false;fading=false}
  function fadeOutIntro(duration=900){gameplayStarted=true;if(audio.paused){stopImmediately();return}fading=true;const initial=audio.volume,start=performance.now();function step(now){if(!fading)return;const p=Math.min(1,(now-start)/duration);audio.volume=initial*(1-p);if(p<1)requestAnimationFrame(step);else stopImmediately()}requestAnimationFrame(step)}
  function handleInteraction(){if(gameIsActive())stopImmediately();else beginIntroMusic()}
  document.addEventListener('pointerdown',handleInteraction,{passive:true});
  document.addEventListener('keydown',handleInteraction,{passive:true});
  startButton?.addEventListener('click',()=>fadeOutIntro(900),true);
  newRoundButton?.addEventListener('click',()=>{gameplayStarted=true;stopImmediately()},true);
  soundButton?.addEventListener('click',()=>{enabled=!enabled;audio.muted=!enabled;if(!enabled||gameIsActive())stopImmediately();else beginIntroMusic()});
  if(gameView)new MutationObserver(()=>{if(gameView.classList.contains('active')){gameplayStarted=true;stopImmediately()}}).observe(gameView,{attributes:true,attributeFilter:['class']});
  audio.addEventListener('play',()=>{if(gameIsActive())stopImmediately()});
  const routes={
    'Pub Quiz':'pub-quiz-v2.html','Play Your Cards Right':'play-your-cards-right.html','Reaction Game':'reaction-game.html',
    'Deal or No Deal':'deal-or-no-deal.html','Fruit Machine':'fruit-machine.html','Race Night':'horse-race.html',
    'Wheel of Fortune':'wheel-of-fortune.html','Blackjack':'blackjack.html','Solitaire':'solitaire.html','Poker':'poker.html'
  };
  const details={
    'Blackjack':['🂡','Multiplayer','Up to six players against the dealer.'],
    'Solitaire':['♠️','Single player','Classic Klondike card game.'],
    'Poker':['♣️','Multiplayer','Texas Hold’em for up to six players.']
  };
  const grid=document.querySelector('.games-grid');
  if(grid){
    Object.entries(details).forEach(([name,[icon,badge,text]])=>{if(grid.querySelector(`[data-game="${name}"]`))return;const tile=document.createElement('button');tile.className='game-tile';tile.type='button';tile.dataset.game=name;tile.innerHTML=`<span class="tile-badge">${badge}</span><span class="game-tile-icon">${icon}</span><strong>${name}</strong><small>${text}</small>`;grid.appendChild(tile)});
    const style=document.createElement('style');
    style.textContent='.game-categories{display:grid;gap:16px}.game-category{padding-top:4px}.game-category h3{margin:0 0 9px;font-size:.92rem;color:var(--gold2);display:flex;align-items:center;gap:7px}.game-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}@media(max-width:500px){.game-category-grid{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    const categories={
      '🎉 Party & Group Games':['Pub Quiz','Reaction Game','Race Night','Wheel of Fortune'],
      '🃏 Card & Casino Games':['Play Your Cards Right','Blackjack','Poker','Solitaire'],
      '🎰 TV & Arcade Games':['Deal or No Deal','Fruit Machine']
    };
    const holder=document.createElement('div');holder.className='game-categories';
    Object.entries(categories).forEach(([title,names])=>{const section=document.createElement('section');section.className='game-category';section.innerHTML=`<h3>${title}</h3><div class="game-category-grid"></div>`;const target=section.querySelector('.game-category-grid');names.forEach(name=>{const tile=grid.querySelector(`[data-game="${name}"]`);if(tile)target.appendChild(tile)});holder.appendChild(section)});
    grid.replaceWith(holder);
  }
  document.addEventListener('click',event=>{const tile=event.target.closest?.('.game-tile[data-game]');if(!tile)return;const url=routes[tile.dataset.game];if(!url)return;event.preventDefault();event.stopImmediatePropagation();stopImmediately();location.href=url},true);
  Object.keys(routes).forEach(name=>{const tile=document.querySelector(`.game-tile[data-game="${name}"]`);const badge=tile?.querySelector('.tile-badge');if(badge&&!['Multiplayer','Single player'].includes(badge.textContent))badge.textContent='Play now'});
  window.addEventListener('pagehide',stopImmediately);
})();