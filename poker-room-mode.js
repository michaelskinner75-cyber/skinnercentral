(()=>{
  let lastTurnVoice='',lastTenSecondKey='';

  function addStreamlinedView(){
    const game=$('game'),action=$('actionPanel');
    if(!game||!action||$('sameRoomView'))return;
    const view=document.createElement('div');
    view.id='sameRoomView';
    view.className='same-room-board';
    view.innerHTML=`
      <div class="same-room-top">
        <div class="same-room-pot"><small>Pot</small><strong id="roomPot">0 chips</strong></div>
        <div class="same-room-stage"><small>Round</small><strong id="roomStage">Pre-flop</strong><div class="room-mode-badge">♠ Skinners Bar Poker</div></div>
      </div>
      <div class="same-room-message" id="roomMessage">Waiting for the hand to begin…</div>
      <div class="same-room-table">
        <div id="roomCommunity" class="same-community"></div>
        <div class="same-player-label">Your private cards</div>
        <div id="roomHoleCards" class="same-hole-cards"></div>
        <div id="roomHand" class="same-hand">Your cards will appear here</div>
      </div>
      <div id="otherPlayerStrip" class="other-player-strip"></div>`;
    game.insertBefore(view,action);
  }

  function playerState(p,isTurn){
    if(p.folded)return 'Folded';
    if(p.allIn)return 'All in';
    if(isTurn)return 'Playing now';
    if(p.lastAction)return p.lastAction;
    return 'Still in';
  }

  function renderStreamlined(){
    const game=$('game');
    if(!game||!state||state.phase==='lobby')return;
    game.classList.add('same-room-mode');

    const ps=players(),me=state.players?.[playerId];
    const active=ps.find(([,p])=>p.seat===state.turnSeat);
    const activeName=active?.[1]?.name||'Player';
    const stageName=['Pre-flop','Flop','Turn','River'][state.stage]||'Showdown';
    const left=typeof remainingSeconds==='function'?remainingSeconds():30;
    const myTurn=state.phase==='playing'&&me?.seat===state.turnSeat&&!me.folded&&!me.allIn;

    $('roomPot').textContent=`${state.pot||0} chips`;
    $('roomStage').textContent=stageName;
    $('roomMessage').textContent=state.phase==='finished'?(state.message||'Hand complete'):myTurn?`YOUR TURN — ${left} seconds to act`:`${activeName} is playing — ${left} seconds`;
    $('roomMessage').classList.toggle('live',state.phase==='playing');

    const community=[...(state.community||[])];
    while(community.length<5)community.push(null);
    $('roomCommunity').innerHTML=community.map(c=>c?card(c):'<span class="card empty-card"></span>').join('');
    $('roomHoleCards').innerHTML=(me?.hand||[]).map(c=>card(c)).join('')||'<span class="card back"></span><span class="card back"></span>';
    if(me?.hand?.length){
      const visible=[...me.hand,...(state.community||[])];
      $('roomHand').textContent=visible.length>=5?`You currently have: ${handScore(visible)[2]}`:`Your cards: ${me.hand.join(' ')}`;
    }else $('roomHand').textContent='Your cards will appear here';

    $('otherPlayerStrip').innerHTML=ps.filter(([pid])=>pid!==playerId).map(([pid,p])=>{
      const isTurn=p.seat===state.turnSeat&&state.phase==='playing';
      const classes=[p.folded?'folded':'',p.allIn?'all-in':'',isTurn?'active':''].filter(Boolean).join(' ');
      return `<div class="mini-player ${classes}"><strong>${p.bot?'🤖 ':''}${p.name}</strong><span class="mini-chips">${p.chips} chips</span><span class="mini-state">${playerState(p,isTurn)}</span>${isTurn?`<span class="mini-timer">${left}</span>`:''}</div>`;
    }).join('');
  }

  function announceTurn(){
    if(!state||state.phase!=='playing')return;
    const active=players().find(([,p])=>p.seat===state.turnSeat),name=active?.[1]?.name;
    if(!name||active?.[1]?.allIn||active?.[1]?.folded)return;
    const key=`${state.handNo}-${state.stage}-${state.turnSeat}-${state.turnStartedAt}`;
    if(lastTurnVoice!==key){
      lastTurnVoice=key;
      setTimeout(()=>speak(active[0]===playerId?`${name}, it is your turn`:`It is ${name}'s turn`),220);
    }
    const left=typeof remainingSeconds==='function'?remainingSeconds():30;
    if(left===10&&lastTenSecondKey!==key){lastTenSecondKey=key;speak(`${name} has ten seconds remaining`)}
  }

  const originalRender=window.render;
  window.render=function(){
    originalRender();
    renderStreamlined();
    announceTurn();
  };

  addStreamlinedView();
  setInterval(()=>{if(state?.phase&&state.phase!=='lobby'){renderStreamlined();announceTurn()}},500);
})();
