(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const views = ['homeView','lobbyView','gameView'];
  const state = {
    peer: null, hostConn: null, conns: new Map(), isHost: false,
    roomCode: '', myId: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    myName: '', players: [], tickets: {}, called: [], deck: [],
    phase: 'home', autoTimer: null, sound: true, marks: new Set(), claimLocked: false
  };

  function showView(id){ views.forEach(v => $(v).classList.toggle('active', v === id)); }
  function toast(text){ $('toast').textContent = text; $('toast').classList.remove('hidden'); setTimeout(()=> $('toast').classList.add('hidden'), 2200); }
  function cleanName(v){ return (v || 'Player').trim().replace(/[<>]/g,'').slice(0,18) || 'Player'; }
  function roomPeerId(code){ return `skinners-bar-bingo-${code}`; }
  function generateCode(){ return String(Math.floor(1000 + Math.random()*9000)); }
  function shuffled(arr){ return [...arr].sort(()=>Math.random()-.5); }
  function broadcast(msg){ state.conns.forEach(c => { if(c.open) c.send(msg); }); }
  function sendHost(msg){ if(state.hostConn?.open) state.hostConn.send(msg); }

  function makeTicket(){
    const ranges = [[1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]];
    for(let attempt=0; attempt<200; attempt++){
      const grid = Array.from({length:3},()=>Array(9).fill(null));
      const colCounts = Array(9).fill(1);
      let remaining = 6;
      while(remaining){ const c=Math.floor(Math.random()*9); if(colCounts[c]<3){colCounts[c]++;remaining--;} }
      const rowSlots=[0,0,0];
      for(let c=0;c<9;c++){
        const rows=shuffled([0,1,2]).slice(0,colCounts[c]);
        rows.forEach(r=>rowSlots[r]++);
        const nums=shuffled(Array.from({length:ranges[c][1]-ranges[c][0]+1},(_,i)=>ranges[c][0]+i)).slice(0,colCounts[c]).sort((a,b)=>a-b);
        rows.sort((a,b)=>a-b).forEach((r,i)=>grid[r][c]=nums[i]);
      }
      if(rowSlots.every(n=>n===5)) return grid;
    }
    return [[1,null,23,null,41,56,null,72,88],[null,12,28,34,null,59,63,null,90],[7,19,null,38,49,null,68,77,null]];
  }

  function createPlayer(id,name,creator=false){ return {id,name,creator,connected:true}; }
  function publicState(){ return {type:'state',roomCode:state.roomCode,players:state.players,tickets:state.tickets,called:state.called,phase:state.phase}; }
  function syncAll(){ broadcast(publicState()); render(); }

  function initPeerAsHost(code){
    return new Promise((resolve,reject)=>{
      if(!window.Peer) return reject(new Error('Online service unavailable'));
      const peer = new Peer(roomPeerId(code)); state.peer=peer;
      peer.on('open',()=>resolve());
      peer.on('connection',conn=>{
        conn.on('data',msg=>handleHostMessage(conn,msg));
        conn.on('close',()=>{ const p=state.players.find(x=>x.id===conn.metadata?.playerId); if(p){p.connected=false;syncAll();} });
      });
      peer.on('error',reject);
    });
  }

  function initPeerAsGuest(code,name){
    return new Promise((resolve,reject)=>{
      if(!window.Peer) return reject(new Error('Online service unavailable'));
      const peer = new Peer(); state.peer=peer;
      peer.on('open',()=>{
        const conn=peer.connect(roomPeerId(code),{reliable:true,metadata:{playerId:state.myId}}); state.hostConn=conn;
        conn.on('open',()=>{ conn.send({type:'join',id:state.myId,name}); resolve(); });
        conn.on('data',handleGuestMessage);
        conn.on('close',()=>showModal('Connection lost','The room creator has disconnected.','📡'));
        conn.on('error',reject);
      });
      peer.on('error',reject);
    });
  }

  function handleHostMessage(conn,msg){
    if(!msg || !msg.type) return;
    if(msg.type==='join'){
      if(state.players.length>=6){ conn.send({type:'reject',reason:'This room already has 6 players.'}); return; }
      if(!state.players.some(p=>p.id===msg.id)) state.players.push(createPlayer(msg.id,cleanName(msg.name)));
      conn.metadata={playerId:msg.id}; state.conns.set(msg.id,conn); conn.send(publicState()); syncAll();
    }
    if(msg.type==='claim') validateClaim(msg.playerId,msg.claim);
  }

  function handleGuestMessage(msg){
    if(msg.type==='reject'){ $('joinStatus').textContent=msg.reason; state.peer?.destroy(); showView('homeView'); }
    if(msg.type==='state'){
      Object.assign(state,{roomCode:msg.roomCode,players:msg.players,tickets:msg.tickets,called:msg.called,phase:msg.phase});
      if(state.phase==='lobby') showView('lobbyView'); else if(state.phase==='playing') showView('gameView');
      render();
    }
    if(msg.type==='winner') showModal(msg.title,msg.message,'🎉');
    if(msg.type==='announce'){ $('announcement').textContent=msg.text; }
  }

  async function createGame(){
    state.myName=cleanName(prompt('What name should appear in the game?','Michael'));
    state.roomCode=generateCode(); state.isHost=true; state.phase='lobby';
    state.players=[createPlayer(state.myId,state.myName,true)];
    $('createGameBtn').disabled=true;
    try{ await initPeerAsHost(state.roomCode); showView('lobbyView'); render(); }
    catch(e){ $('createGameBtn').disabled=false; toast('Could not create an online room. Try again.'); console.error(e); }
  }

  async function joinGame(){
    const name=cleanName($('joinName').value), code=$('roomCodeInput').value.trim();
    if(!/^\d{4}$/.test(code)){ $('joinStatus').textContent='Enter the four-digit room code.'; return; }
    state.myName=name; state.roomCode=code; state.isHost=false; $('joinGameBtn').disabled=true; $('joinStatus').textContent='Connecting…';
    try{ await initPeerAsGuest(code,name); showView('lobbyView'); }
    catch(e){ $('joinStatus').textContent='Room not found or connection failed.'; $('joinGameBtn').disabled=false; console.error(e); }
  }

  function startGame(){
    if(!state.isHost) return;
    state.tickets={}; state.players.filter(p=>p.connected).forEach(p=>state.tickets[p.id]=makeTicket());
    state.called=[]; state.deck=shuffled(Array.from({length:90},(_,i)=>i+1)); state.phase='playing'; state.marks.clear(); state.claimLocked=false;
    syncAll(); showView('gameView'); announce('Eyes down! The game is starting.');
  }

  function callNext(){
    if(!state.isHost || state.phase!=='playing' || !state.deck.length) return;
    const n=state.deck.pop(); state.called.push(n); announce(callPhrase(n)); syncAll(); speakNumber(n); tone();
    if(state.called.length===90) stopAuto();
  }
  function callPhrase(n){
    const nick={1:'Kelly’s eye',2:'One little duck',3:'Cup of tea',7:'Lucky seven',11:'Legs eleven',22:'Two little ducks',33:'All the threes',44:'Droopy drawers',55:'Snakes alive',66:'Clickety click',77:'Sunset strip',88:'Two fat ladies',90:'Top of the shop'};
    return nick[n] ? `${nick[n]} — ${n}` : `Number ${n}`;
  }
  function announce(text){ $('announcement').textContent=text; if(state.isHost) broadcast({type:'announce',text}); }
  function speakNumber(n){ if(!state.sound || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(callPhrase(n)); u.rate=.88; u.pitch=1.02; speechSynthesis.speak(u); }
  function tone(){ if(!state.sound) return; try{ const a=new AudioContext(); const o=a.createOscillator(),g=a.createGain(); o.frequency.value=660; g.gain.setValueAtTime(.05,a.currentTime); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.16); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+.16); }catch{} }
  function toggleAuto(){ if(state.autoTimer) stopAuto(); else { callNext(); state.autoTimer=setInterval(callNext,Number($('speedSelect').value)); $('autoCallBtn').textContent='Pause Auto'; } }
  function stopAuto(){ clearInterval(state.autoTimer); state.autoTimer=null; $('autoCallBtn').textContent='Start Auto'; }

  function render(){
    $('roomCodeDisplay').textContent=state.roomCode||'----'; $('gameRoomCode').textContent=state.roomCode||'----';
    $('playerCount').textContent=`${state.players.filter(p=>p.connected).length} / 6`;
    $('playerList').innerHTML=state.players.map(p=>`<div class="player-item"><div class="player-avatar">${p.name[0]?.toUpperCase()||'P'}</div><b>${escapeHtml(p.name)}</b>${p.creator?'<span class="creator-badge">CREATOR</span>':''}${!p.connected?'<span class="creator-badge">OFFLINE</span>':''}</div>`).join('');
    $('startGameBtn').classList.toggle('hidden',!state.isHost); $('waitingMessage').classList.toggle('hidden',state.isHost);
    $('hostControls').classList.toggle('hidden',!state.isHost);
    $('playerNameDisplay').textContent=state.myName;
    const current=state.called.at(-1); $('currentBall').textContent=current ?? '—'; $('calledCount').textContent=`${state.called.length} / 90`;
    renderTicket(); renderBalls(); renderBoard();
  }
  function renderTicket(){
    const ticket=state.tickets[state.myId]; if(!ticket){ $('ticketGrid').innerHTML=''; return; }
    $('ticketGrid').innerHTML=''; let marked=0;
    ticket.flat().forEach(n=>{
      const cell=document.createElement('button'); cell.className='ticket-cell'; cell.type='button';
      if(n===null){cell.classList.add('blank');cell.disabled=true;} else { cell.dataset.number=n; cell.innerHTML=`<span>${n}</span>`; const called=state.called.includes(n); if(state.marks.has(n)){cell.classList.add('called');marked++;} else if(called) cell.classList.add('available'); cell.addEventListener('click',()=>toggleMark(n)); }
      $('ticketGrid').appendChild(cell);
    });
    $('ticketProgress').textContent=`${marked} marked`;
  }
  function toggleMark(n){ if(!state.called.includes(n)){toast('That number has not been called yet.');return;} state.marks.has(n)?state.marks.delete(n):state.marks.add(n); renderTicket(); }
  function renderBalls(){ $('recentBalls').innerHTML=[...state.called].reverse().slice(0,12).map(n=>`<div class="mini-ball">${n}</div>`).join('') || '<span class="status-text">No numbers called yet</span>'; }
  function renderBoard(){ $('numberBoard').innerHTML=Array.from({length:90},(_,i)=>`<div class="board-number ${state.called.includes(i+1)?'called':''}">${i+1}</div>`).join(''); }

  function claim(type){
    if(state.claimLocked) return;
    if(state.isHost) validateClaim(state.myId,type); else sendHost({type:'claim',playerId:state.myId,claim:type});
  }
  function validateClaim(playerId,type){
    const ticket=state.tickets[playerId], player=state.players.find(p=>p.id===playerId); if(!ticket||!player)return;
    const completeRows=ticket.filter(row=>row.filter(Boolean).every(n=>state.called.includes(n))).length;
    const total=ticket.flat().filter(Boolean).every(n=>state.called.includes(n));
    const valid=(type==='line'&&completeRows>=1)||(type==='two-lines'&&completeRows>=2)||(type==='full-house'&&total);
    if(valid){ stopAuto(); state.claimLocked=true; const label=type==='line'?'a line':type==='two-lines'?'two lines':'FULL HOUSE'; const msg=`${player.name} has won ${label}!`; showModal('We have a winner!',msg,'🏆'); broadcast({type:'winner',title:'We have a winner!',message:msg}); }
    else { const conn=state.conns.get(playerId); if(playerId===state.myId) showModal('Not quite yet','Some required numbers have not been called. Keep playing!','🙈'); else conn?.send({type:'winner',title:'Not quite yet',message:'Some required numbers have not been called. Keep playing!'}); }
  }

  function showModal(title,msg,emoji){ $('modalTitle').textContent=title;$('modalMessage').textContent=msg;$('modalEmoji').textContent=emoji;$('modal').classList.remove('hidden'); }
  function leave(){ stopAuto(); state.peer?.destroy(); location.reload(); }
  function newRound(){ stopAuto(); startGame(); }
  function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  $('createGameBtn').onclick=createGame;
  $('showJoinBtn').onclick=()=> $('joinPanel').classList.toggle('hidden');
  $('joinGameBtn').onclick=joinGame;
  $('startGameBtn').onclick=startGame;
  $('copyCodeBtn').onclick=async()=>{ await navigator.clipboard?.writeText(state.roomCode); toast('Room code copied'); };
  $('leaveLobbyBtn').onclick=leave;
  $('nextBallBtn').onclick=callNext;
  $('autoCallBtn').onclick=toggleAuto;
  $('speedSelect').onchange=()=>{ if(state.autoTimer){stopAuto();toggleAuto();} };
  $('newRoundBtn').onclick=newRound;
  $('toggleBoardBtn').onclick=()=>{ const hidden=$('numberBoard').classList.toggle('hidden'); $('toggleBoardBtn').textContent=hidden?'Show board':'Hide board'; };
  document.querySelectorAll('.claim-btn').forEach(b=>b.onclick=()=>claim(b.dataset.claim));
  $('modalCloseBtn').onclick=()=> $('modal').classList.add('hidden');
  $('soundBtn').onclick=()=>{state.sound=!state.sound;$('soundBtn').textContent=state.sound?'🔊':'🔇';toast(state.sound?'Sound on':'Sound off');};
  $('roomCodeInput').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,4));
  renderBoard();
})();
