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
  const gamesSection=grid?.closest('.games-section');
  if(grid&&gamesSection){
    Object.entries(details).forEach(([name,[icon,badge,text]])=>{
      if(grid.querySelector(`[data-game="${name}"]`))return;
      const tile=document.createElement('button');
      tile.className='game-tile';
      tile.type='button';
      tile.dataset.game=name;
      tile.innerHTML=`<span class="tile-badge">${badge}</span><span class="game-tile-icon">${icon}</span><strong>${name}</strong><small>${text}</small>`;
      grid.appendChild(tile);
    });

    const style=document.createElement('style');
    style.textContent=`
      .games-section{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important}
      .games-section-heading{display:none!important}
      .other-games-toggle{width:100%;min-height:78px;padding:16px 18px;border-radius:22px;border:1px solid rgba(255,255,255,.15);background:linear-gradient(135deg,rgba(247,200,94,.18),rgba(255,74,162,.12));color:var(--text);display:flex;align-items:center;gap:13px;text-align:left;font:inherit;cursor:pointer;box-shadow:0 14px 36px rgba(0,0,0,.24)}
      .other-games-toggle .other-games-icon{font-size:2rem}.other-games-toggle strong{display:block;font-size:1rem}.other-games-toggle small{display:block;margin-top:3px;color:var(--muted)}.other-games-arrow{margin-left:auto;font-size:1.2rem;transition:transform .2s ease}.other-games-toggle.open .other-games-arrow{transform:rotate(180deg)}
      .other-games-panel{display:none;margin-top:12px;padding:16px;border-radius:22px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12)}.other-games-panel.open{display:block}
      .game-categories{display:grid;gap:16px}.game-category h3{margin:0 0 9px;font-size:.92rem;color:var(--gold2);display:flex;align-items:center;gap:7px}.game-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      @media(max-width:500px){.game-category-grid{grid-template-columns:1fr}.other-games-toggle{min-height:72px;padding:14px}.other-games-toggle .other-games-icon{font-size:1.7rem}}
    `;
    document.head.appendChild(style);

    const categories={
      '🎉 Party & Group Games':['Pub Quiz','Reaction Game','Race Night','Wheel of Fortune'],
      '🃏 Card & Casino Games':['Play Your Cards Right','Blackjack','Poker','Solitaire'],
      '🎰 TV & Arcade Games':['Deal or No Deal','Fruit Machine']
    };

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='other-games-toggle';
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span class="other-games-icon">🎮</span><span><strong>Other Skinners Bar Games</strong><small>Tap to browse all other games</small></span><span class="other-games-arrow">⌄</span>';

    const panel=document.createElement('div');
    panel.className='other-games-panel';
    const holder=document.createElement('div');
    holder.className='game-categories';

    Object.entries(categories).forEach(([title,names])=>{
      const section=document.createElement('section');
      section.className='game-category';
      section.innerHTML=`<h3>${title}</h3><div class="game-category-grid"></div>`;
      const target=section.querySelector('.game-category-grid');
      names.forEach(name=>{const tile=grid.querySelector(`[data-game="${name}"]`);if(tile)target.appendChild(tile)});
      holder.appendChild(section);
    });

    panel.appendChild(holder);
    gamesSection.innerHTML='';
    gamesSection.append(toggle,panel);
    toggle.addEventListener('click',()=>{
      const open=!panel.classList.contains('open');
      panel.classList.toggle('open',open);
      toggle.classList.toggle('open',open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.querySelector('small').textContent=open?'Tap to hide the other games':'Tap to browse all other games';
      if(open)setTimeout(()=>panel.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
    });
  }

  document.addEventListener('click',event=>{
    const tile=event.target.closest?.('.game-tile[data-game]');
    if(!tile)return;
    const url=routes[tile.dataset.game];
    if(!url)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    stopImmediately();
    location.href=url;
  },true);

  Object.keys(routes).forEach(name=>{
    const tile=document.querySelector(`.game-tile[data-game="${name}"]`);
    const badge=tile?.querySelector('.tile-badge');
    if(badge&&!['Multiplayer','Single player'].includes(badge.textContent))badge.textContent='Play now';
  });
  window.addEventListener('pagehide',stopImmediately);
})();