(()=>{
  function connectedInHand(source=state.players||{}){
    return Object.entries(source).filter(([,p])=>p.connected!==false&&!p.folded&&((p.chips||0)+(p.roundBet||0)>0));
  }

  function actionablePlayers(source=state.players||{}){
    return connectedInHand(source).filter(([,p])=>!p.allIn&&(p.chips||0)>0);
  }

  function nextActionSeat(after,list){
    if(!list.length)return null;
    const seats=list.map(([,p])=>p.seat).sort((a,b)=>a-b);
    return seats.find(seat=>seat>after)??seats[0];
  }

  async function finishAllInRunout(updated,pot,previousAction=''){
    const deck=[...(state.deck||[])];
    const community=[...(state.community||[])];
    while(community.length<5&&deck.length)community.push(deck.pop());
    const active=connectedInHand(updated);
    const scores=active.map(([pid,p])=>({pid,name:p.name,score:handScore([...(p.hand||[]),...community])}))
      .sort((a,b)=>b.score[0]-a.score[0]||b.score[1]-a.score[1]);
    const winner=scores[0];
    if(!winner)return;
    const prefix=previousAction?`${previousAction}. All remaining players are all in. `:'All remaining players are all in. ';
    return award(winner.pid,updated,`${prefix}${winner.name} wins with ${winner.score[2]}`,pot,community);
  }

  continueAfter=async function(actorId,me,pay,currentBet){
    const updated={...state.players,[actorId]:me};
    const live=connectedInHand(updated);
    const actionMessage=`${me.name} ${String(me.lastAction||'acted').toLowerCase()}`;

    if(live.length===1)return award(live[0][0],updated,'Everyone else folded',(state.pot||0)+pay);

    const actionable=actionablePlayers(updated);
    if(actionable.length<=1){
      const lone=actionable[0]?.[1];
      const loneNeedsAction=lone&&!lone.acted&&(lone.roundBet||0)<currentBet;
      if(!loneNeedsAction)return finishAllInRunout(updated,(state.pot||0)+pay,actionMessage);
    }

    const settled=actionable.length===0||actionable.every(([,p])=>p.acted&&(p.roundBet||0)===currentBet);
    if(settled)return advance(updated,(state.pot||0)+pay,actionMessage);

    const candidates=actionable.filter(([,p])=>!p.acted||(p.roundBet||0)<currentBet);
    if(!candidates.length)return advance(updated,(state.pot||0)+pay,actionMessage);

    const turn=nextActionSeat(state.turnSeat,candidates);
    timeoutKey='';
    await patchRoom({players:updated,pot:(state.pot||0)+pay,currentBet,turnSeat:turn,turnStartedAt:Date.now(),message:actionMessage});
  };

  const originalAdvance=advance;
  advance=async function(updated,pot,previousAction=''){
    const live=connectedInHand(updated);
    const actionable=actionablePlayers(updated);
    if(live.length>1&&actionable.length<=1)return finishAllInRunout(updated,pot,previousAction);
    return originalAdvance(updated,pot,previousAction);
  };

  const originalUpdateTimer=updateTimer;
  updateTimer=function(){
    if(state.phase==='playing'){
      const current=players().find(([,p])=>p.seat===state.turnSeat);
      const p=current?.[1];
      if(host&&p&&(p.folded||p.allIn||(p.chips||0)<=0)){
        const updated={...state.players};
        const live=connectedInHand(updated);
        const actionable=actionablePlayers(updated);
        const key=`skip-${state.handNo}-${state.stage}-${state.turnSeat}-${state.turnStartedAt}`;
        if(timeoutKey!==key){
          timeoutKey=key;
          if(live.length>1&&actionable.length<=1)finishAllInRunout(updated,state.pot||0,'Betting is complete');
          else if(actionable.length){
            const turn=nextActionSeat(state.turnSeat,actionable);
            patchRoom({turnSeat:turn,turnStartedAt:Date.now(),message:`${p.name} is all in — play moves on`});
          }
        }
        return;
      }
    }
    originalUpdateTimer();
  };

  function ensureOwnChipDisplay(){
    const top=document.querySelector('.same-room-top');
    if(!top||document.getElementById('roomMyChips'))return;
    const box=document.createElement('div');
    box.className='same-room-my-chips';
    box.innerHTML='<small>Your chips</small><strong id="roomMyChips">0 chips</strong><span id="roomMyStatus">Ready</span>';
    top.appendChild(box);
  }

  function renderOwnChips(){
    ensureOwnChipDisplay();
    const me=state.players?.[playerId];
    const chips=document.getElementById('roomMyChips');
    const status=document.getElementById('roomMyStatus');
    if(!chips||!me)return;
    chips.textContent=`${me.chips||0} chips`;
    status.textContent=me.folded?'Folded':me.allIn?'All in':me.seat===state.turnSeat&&state.phase==='playing'?'Your turn':'Still in';
    status.classList.toggle('all-in',!!me.allIn);
  }

  const previousRender=window.render;
  window.render=function(){
    previousRender();
    renderOwnChips();
  };

  const style=document.createElement('style');
  style.textContent=`
    .same-room-top{grid-template-columns:repeat(3,1fr)!important}
    .same-room-my-chips{border-radius:16px;background:linear-gradient(180deg,#17140f,#080706);border:1px solid rgba(77,239,130,.55);padding:10px 13px;box-shadow:0 0 18px rgba(53,232,117,.18)}
    .same-room-my-chips small{display:block;color:#a99e89;font-size:.58rem;text-transform:uppercase;letter-spacing:.12em}
    .same-room-my-chips strong{display:block;color:#78ff9f;font-size:1.05rem;margin-top:2px}
    .same-room-my-chips span{display:block;color:#d8cdb8;font-size:.58rem;font-weight:900;text-transform:uppercase;margin-top:3px}
    .same-room-my-chips span.all-in{color:#ffd675}
    @media(max-width:700px){.same-room-top{grid-template-columns:repeat(3,1fr)!important}.same-room-pot,.same-room-stage,.same-room-my-chips{padding:8px}.same-room-pot strong{font-size:1.05rem}.same-room-my-chips strong{font-size:.85rem}.same-room-stage{text-align:center!important}}
  `;
  document.head.appendChild(style);

  ensureOwnChipDisplay();
  renderOwnChips();
})();
