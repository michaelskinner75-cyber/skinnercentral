import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, update, onValue } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const firebaseConfig={apiKey:'AIzaSyAhQcvXPsAkc22WQmnLII17JUNnYj_oeKQ',authDomain:'skinners-bar-bingo.firebaseapp.com',databaseURL:'https://skinners-bar-bingo-default-rtdb.europe-west1.firebasedatabase.app',projectId:'skinners-bar-bingo',storageBucket:'skinners-bar-bingo.firebasestorage.app',messagingSenderId:'1033478065497',appId:'1:1033478065497:web:e7b4904fd9ef7afd171048'};
const app=getApps().find(a=>a.options.projectId===firebaseConfig.projectId)||initializeApp(firebaseConfig,'shared-game-flow');
const db=getDatabase(app);
const playerId=localStorage.getItem('skinnersPlayerId');
const $=id=>document.getElementById(id);
let roomCode='';
let roomUnsub=null;
let latestRoom=null;
let countdownTimer=null;
let bypassStart=false;
let autoStartedForRound=false;
let countdownWritePending=false;

const style=document.createElement('style');
style.textContent=`
#sharedCountdown{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,5,14,.88);backdrop-filter:blur(10px)}
#sharedCountdown.hidden{display:none}.countdown-card{min-width:min(86vw,360px);padding:30px;text-align:center;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:linear-gradient(145deg,rgba(54,26,66,.96),rgba(20,10,27,.98));box-shadow:0 20px 70px rgba(0,0,0,.55)}
.countdown-label{font-size:1rem;letter-spacing:.12em;text-transform:uppercase;opacity:.8}.countdown-number{font-size:7rem;line-height:1;font-weight:900;margin:12px 0;text-shadow:0 0 30px rgba(255,77,220,.8)}.ready-badge{margin-left:auto;font-size:.75rem;font-weight:900;padding:6px 9px;border-radius:999px;background:rgba(74,222,128,.18);color:#86efac}
`;
document.head.appendChild(style);
const overlay=document.createElement('div');
overlay.id='sharedCountdown';overlay.className='hidden';overlay.innerHTML='<div class="countdown-card"><div class="countdown-label">Eyes down in</div><div id="sharedCountdownNumber" class="countdown-number">5</div><strong>Automatic calling will begin</strong></div>';
document.body.appendChild(overlay);

function detectRoom(){
  const code=($('roomCodeDisplay')?.textContent||$('gameRoomCode')?.textContent||'').trim();
  if(/^\d{4}$/.test(code)&&code!==roomCode){roomCode=code;subscribeRoom();}
}
setInterval(detectRoom,400);

function humanPlayers(room){return Object.entries(room.players||{}).filter(([,p])=>p.connected&&!p.computer);}
function allHumansReady(room){const humans=humanPlayers(room);return humans.length>0&&humans.every(([,p])=>p.ready===true);}

async function maybeStartCountdown(room){
  if(countdownWritePending||room.phase!=='lobby'||room.hostId!==playerId||room.startCountdownAt||!allHumansReady(room))return;
  countdownWritePending=true;
  try{await update(ref(db,`rooms/${roomCode}`),{startCountdownAt:Date.now()+5000,announcement:'All players ready — eyes down in 5!'});}finally{countdownWritePending=false;}
}

function subscribeRoom(){
  roomUnsub?.();
  roomUnsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{
    if(!snap.exists())return;
    latestRoom=snap.val();
    renderReadyState();
    maybeStartCountdown(latestRoom);
    syncCountdown();
    syncAutoStart();
  });
}

async function toggleReady(){
  if(!roomCode||!playerId||!latestRoom||latestRoom.phase!=='lobby'||latestRoom.startCountdownAt)return;
  const mine=latestRoom.players?.[playerId];
  if(!mine)return;
  await update(ref(db,`rooms/${roomCode}/players/${playerId}`),{ready:!mine.ready});
}

function renderReadyState(){
  const room=latestRoom;if(!room)return;
  const btn=$('startGameBtn'),wait=$('waitingMessage'),list=$('playerList');
  if(room.phase==='lobby'&&btn){
    btn.classList.remove('hidden');
    const mine=room.players?.[playerId];
    btn.textContent=mine?.ready?'✓ Ready — tap to cancel':'Ready / Start';
    btn.disabled=!!room.startCountdownAt;
  }
  if(wait){
    const humans=humanPlayers(room),ready=humans.filter(([,p])=>p.ready).length;
    wait.classList.remove('hidden');
    wait.textContent=room.startCountdownAt?'Everyone is ready — game starting…':`${ready} of ${humans.length} players ready`;
  }
  if(list){
    [...list.children].forEach((row,i)=>{
      row.querySelector('.ready-badge')?.remove();
      const player=Object.values(room.players||{})[i];
      if(player?.ready||player?.computer){const badge=document.createElement('span');badge.className='ready-badge';badge.textContent=player.computer?'AUTO READY':'READY';row.appendChild(badge);}
    });
  }
}

function syncCountdown(){
  const room=latestRoom;
  if(!room?.startCountdownAt||room.phase!=='lobby'){overlay.classList.add('hidden');clearInterval(countdownTimer);countdownTimer=null;return;}
  overlay.classList.remove('hidden');
  const tick=()=>{
    const remaining=Math.max(0,Math.ceil((room.startCountdownAt-Date.now())/1000));
    $('sharedCountdownNumber').textContent=remaining||'GO!';
    if(remaining<=0){
      clearInterval(countdownTimer);countdownTimer=null;
      if(room.hostId===playerId){
        const startBtn=$('startGameBtn');
        if(startBtn){
          bypassStart=true;
          startBtn.disabled=false;
          startBtn.click();
          setTimeout(()=>{bypassStart=false;},100);
        }
      }
    }
  };
  tick();
  if(!countdownTimer)countdownTimer=setInterval(tick,200);
}

function syncAutoStart(){
  const room=latestRoom;
  if(room?.phase==='playing'&&!autoStartedForRound&&room.hostId===playerId){
    autoStartedForRound=true;
    overlay.classList.add('hidden');
    setTimeout(()=>{const btn=$('autoCallBtn');if(btn&&btn.textContent!=='Pause Game')btn.click();},500);
  }
  if(room?.phase==='lobby')autoStartedForRound=false;
}

document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#startGameBtn');
  if(!btn||bypassStart)return;
  if(latestRoom?.phase==='lobby'){
    e.preventDefault();e.stopImmediatePropagation();toggleReady();
  }
},true);

function relabelControls(){
  const auto=$('autoCallBtn'),speed=$('speedSelect');
  if(auto){
    if(auto.textContent==='Start Auto')auto.textContent='Resume Game';
    if(auto.textContent==='Pause Auto')auto.textContent='Pause Game';
  }
  if(speed&&speed.dataset.updated!=='yes'){
    speed.innerHTML='<option value="10000">Slow · 10 sec</option><option value="7000" selected>Normal · 7 sec</option><option value="4000">Fast · 4 sec</option>';
    speed.dataset.updated='yes';
    speed.setAttribute('aria-label','Change ball speed');
  }
}
setInterval(relabelControls,250);