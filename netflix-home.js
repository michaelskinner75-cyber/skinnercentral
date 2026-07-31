(()=>{
  const home=document.getElementById('homeView');
  if(!home||document.getElementById('streamingGamesHome'))return;

  const oldHero=home.querySelector('.hero-card');
  const oldGames=home.querySelector('.games-section');
  const quickHelp=home.querySelector('.quick-help');
  if(oldHero)oldHero.style.display='none';
  if(oldGames)oldGames.style.display='none';
  if(quickHelp)quickHelp.style.display='none';

  const hub=document.createElement('div');
  hub.id='streamingGamesHome';
  hub.className='streaming-home';
  hub.innerHTML=`
    <section class="stream-hero" aria-label="Featured game Skinners Bar Bingo">
      <div class="stream-hero-shade"></div>
      <div class="stream-hero-content">
        <div class="stream-kicker">SKINNERS BAR ORIGINAL</div>
        <div class="stream-title"><span class="stream-ball">90</span><span>SKINNERS BAR<br><b>BINGO</b></span></div>
        <p>The main event. Create a room, invite up to six players and enjoy a complete live bingo night from your phones.</p>
        <div class="stream-actions"><button id="netflixPlayBingo" class="stream-play">▶ Play Bingo</button><button id="netflixBingoInfo" class="stream-info">ⓘ How it works</button></div>
      </div>
    </section>

    <section class="stream-row feature-row">
      <div class="stream-row-head"><h2>Featured Games</h2><span>Skinners Bar favourites</span></div>
      <div class="stream-cards feature-cards">
        <button class="stream-card bingo-card" data-action="bingo"><span class="card-badge live">MAIN EVENT</span><span class="poster-icon">90</span><span class="poster-copy"><strong>Skinners Bar Bingo</strong><small>Live multiplayer bingo</small></span></button>
        <a class="stream-card poker-card" href="poker.html"><span class="card-badge live">PLAY NOW</span><span class="poster-icon">♠</span><span class="poster-copy"><strong>Texas Hold’em Poker</strong><small>Single player or multiplayer</small></span></a>
        <a class="stream-card quiz-card" href="pub-quiz-v2.html"><span class="card-badge live">PLAY NOW</span><span class="poster-icon">?</span><span class="poster-copy"><strong>Skinners Pub Quiz</strong><small>Questions, teams and scores</small></span></a>
        <a class="stream-card deal-card" href="deal-or-no-deal.html"><span class="card-badge live">PLAY NOW</span><span class="poster-icon">£</span><span class="poster-copy"><strong>Deal or No Deal</strong><small>Beat the banker</small></span></a>
      </div>
    </section>

    <section class="stream-row">
      <div class="stream-row-head"><h2>More Games</h2><span>Swipe to browse</span></div>
      <div class="stream-cards compact-cards">
        <a class="stream-card battleships-card" href="battleships.html"><span class="poster-icon">🚢</span><span class="poster-copy"><strong>Battleships</strong><small>Solo or room-code battle</small></span></a>
        <a class="stream-card blackjack-card" href="blackjack.html"><span class="poster-icon">21</span><span class="poster-copy"><strong>Blackjack</strong><small>Take on the dealer</small></span></a>
        <a class="stream-card cards-card" href="play-your-cards-right.html"><span class="poster-icon">🃏</span><span class="poster-copy"><strong>Play Your Cards Right</strong><small>Higher or lower</small></span></a>
        <a class="stream-card wheel-card" href="wheel-of-fortune.html"><span class="poster-icon">🎡</span><span class="poster-copy"><strong>Wheel of Fortune</strong><small>Custom names and prizes</small></span></a>
        <a class="stream-card race-card" href="horse-race.html"><span class="poster-icon">🏇</span><span class="poster-copy"><strong>Race Night</strong><small>Pick a horse and cheer</small></span></a>
        <a class="stream-card fruit-card" href="fruit-machine.html"><span class="poster-icon">🎰</span><span class="poster-copy"><strong>Fruit Machine</strong><small>Reels, holds and nudges</small></span></a>
        <a class="stream-card reaction-card" href="reaction-game.html"><span class="poster-icon">⚡</span><span class="poster-copy"><strong>Reaction Game</strong><small>Fastest finger wins</small></span></a>
        <a class="stream-card solitaire-card" href="solitaire.html"><span class="poster-icon">♣</span><span class="poster-copy"><strong>Solitaire</strong><small>Classic Klondike</small></span></a>
      </div>
    </section>`;

  const firstPanel=home.querySelector('#simpleChoice');
  home.insertBefore(hub,firstPanel||home.firstChild);

  const playBingo=()=>document.getElementById('startPlayingBtn')?.click();
  document.getElementById('netflixPlayBingo')?.addEventListener('click',playBingo);
  hub.querySelector('[data-action="bingo"]')?.addEventListener('click',playBingo);
  document.getElementById('netflixBingoInfo')?.addEventListener('click',()=>{
    const modal=document.getElementById('gamePreviewModal');
    const title=document.getElementById('gamePreviewTitle');
    const message=document.getElementById('gamePreviewMessage');
    const emoji=document.getElementById('gamePreviewEmoji');
    if(modal&&title&&message){title.textContent='Skinners Bar Bingo';emoji.textContent='90';message.textContent='One person creates the room and shares the four-digit code. Everyone else joins from their own phone, receives their cards and plays together live.';modal.classList.remove('hidden')}
    else playBingo();
  });

  const style=document.createElement('style');
  style.textContent=`
    body{background:#070707!important}.ambient{opacity:.22!important}.app-shell{max-width:1180px!important;padding-left:0!important;padding-right:0!important}.brand-bar{position:sticky;top:0;z-index:80;margin:0!important;padding:12px 18px!important;border-radius:0!important;background:linear-gradient(180deg,#050505 15%,rgba(5,5,5,.92));backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08)}
    .streaming-home{padding-bottom:34px;color:#fff}.stream-hero{position:relative;min-height:440px;display:flex;align-items:flex-end;overflow:hidden;background:radial-gradient(circle at 78% 25%,rgba(255,70,160,.48),transparent 27%),radial-gradient(circle at 78% 50%,rgba(247,200,94,.24),transparent 38%),linear-gradient(125deg,#22071b 0%,#5e103c 44%,#10070f 100%)}.stream-hero:before{content:'90';position:absolute;right:4%;top:5%;width:290px;height:290px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 28%,#fff,#f7c85e 12%,#e94d9d 38%,#6a123e 72%);border:18px solid rgba(255,255,255,.12);box-shadow:0 30px 90px #000b,0 0 90px rgba(255,70,160,.5);font-size:7rem;font-weight:1000;color:#180a12;text-shadow:0 3px 0 #fff8;transform:rotate(8deg)}.stream-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,#070707 0%,rgba(7,7,7,.92) 24%,rgba(7,7,7,.24) 68%,#07070711),linear-gradient(0deg,#070707 0%,transparent 55%)}.stream-hero-content{position:relative;z-index:2;width:min(600px,74%);padding:48px 28px}.stream-kicker{font-size:.68rem;font-weight:1000;letter-spacing:.24em;color:#ef4d91;margin-bottom:10px}.stream-title{display:flex;align-items:center;gap:13px;font-size:2.35rem;font-weight:900;line-height:.9;letter-spacing:-.04em}.stream-title b{color:#f7c85e}.stream-ball{width:70px;height:70px;flex:0 0 70px;border-radius:50%;display:grid;place-items:center;background:#f7c85e;color:#140a10;font-size:1.8rem;box-shadow:0 0 30px rgba(247,200,94,.45)}.stream-hero p{max-width:540px;margin:18px 0;color:#eee;line-height:1.5;font-size:.96rem}.stream-actions{display:flex;gap:10px}.stream-actions button{min-height:48px;padding:0 20px;border:0;border-radius:7px;font:inherit;font-weight:900;cursor:pointer}.stream-play{background:#fff;color:#111}.stream-info{background:rgba(109,109,110,.75);color:#fff}.stream-row{padding:7px 18px 18px}.feature-row{margin-top:-8px;position:relative;z-index:4}.stream-row-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}.stream-row-head h2{margin:0;font-size:1.25rem}.stream-row-head span{color:#999;font-size:.72rem}.stream-cards{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(210px,1fr);gap:11px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:inline mandatory;padding:4px 2px 13px;scrollbar-width:none}.stream-cards::-webkit-scrollbar{display:none}.feature-cards{grid-auto-columns:minmax(235px,1fr)}.stream-card{position:relative;min-height:150px;border-radius:10px;overflow:hidden;scroll-snap-align:start;text-decoration:none;color:#fff;border:1px solid rgba(255,255,255,.12);background:#222;display:flex;align-items:flex-end;padding:14px;text-align:left;cursor:pointer;box-shadow:0 10px 28px #0007;transition:transform .2s,border-color .2s}.stream-card:hover,.stream-card:focus{transform:scale(1.025);border-color:#fff7;z-index:3}.stream-card:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.95),transparent 68%)}.poster-icon{position:absolute;right:16px;top:15px;font-size:4.4rem;font-weight:1000;opacity:.94;text-shadow:0 12px 26px #0008}.poster-copy{position:relative;z-index:2}.poster-copy strong{display:block;font-size:1rem}.poster-copy small{display:block;margin-top:4px;color:#ddd}.card-badge{position:absolute;z-index:3;left:10px;top:10px;padding:4px 7px;border-radius:4px;background:#111b;color:#fff;font-size:.55rem;font-weight:1000;letter-spacing:.08em}.card-badge.live{background:#e50914}.bingo-card{background:linear-gradient(135deg,#8b1454,#e14392)}.poker-card{background:radial-gradient(circle at 75% 22%,#1ca565,#075335 48%,#041b12)}.quiz-card{background:linear-gradient(135deg,#392067,#8e43d4)}.deal-card{background:linear-gradient(135deg,#063d63,#168cd0)}.battleships-card{background:linear-gradient(135deg,#073e61,#107c9b)}.blackjack-card{background:linear-gradient(135deg,#181818,#7a1515)}.cards-card{background:linear-gradient(135deg,#6d1520,#d05b35)}.wheel-card{background:linear-gradient(135deg,#56306d,#e05492)}.race-card{background:linear-gradient(135deg,#315326,#7e9b39)}.fruit-card{background:linear-gradient(135deg,#4d1228,#ca2f59)}.reaction-card{background:linear-gradient(135deg,#3a2700,#d79a00)}.solitaire-card{background:linear-gradient(135deg,#073a2d,#168566)}
    #simpleChoice,#joinPanel,#createPanel{margin-left:18px!important;margin-right:18px!important}
    @media(min-width:800px){.stream-cards{grid-auto-columns:calc((100% - 33px)/4)}.compact-cards{grid-auto-columns:calc((100% - 44px)/5)}}
    @media(max-width:600px){.brand-bar{padding:10px 12px!important}.brand-bar h1{font-size:1rem}.stream-hero{min-height:385px}.stream-hero:before{width:205px;height:205px;right:-48px;top:24px;border-width:12px;font-size:4.8rem}.stream-hero-content{width:100%;padding:34px 16px}.stream-title{font-size:1.85rem}.stream-ball{width:56px;height:56px;flex-basis:56px;font-size:1.4rem}.stream-hero p{max-width:88%;font-size:.83rem}.stream-actions button{min-height:45px;padding:0 15px}.stream-row{padding-left:12px;padding-right:12px}.feature-cards{grid-auto-columns:76vw}.compact-cards{grid-auto-columns:62vw}.stream-card{min-height:140px}.poster-icon{font-size:3.8rem}#simpleChoice,#joinPanel,#createPanel{margin-left:12px!important;margin-right:12px!important}}
  `;
  document.head.appendChild(style);
})();