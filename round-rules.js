import { getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const $=id=>document.getElementById(id);
const myId=()=>localStorage.getItem('skinnersPlayerId');
let db=null,roomCode='',roomUnsub=null,currentRoom=null,handledFinish='',starting=false;

const style=document.createElement('style');
style.textContent=`
#rematchModal{z-index:12000!important}.rematch-card{width:min(390px,100%);padding:26px;border-radius:26px;text-align:center}.rematch-card h2{margin:8px 0}.rematch-card p{color:var(--muted);line-height:1.45}.rematch-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.rematch-panel{margin:0 0 12px;padding:11px 13px;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:10px}.rematch-panel span{font-size:.8rem;color:var(--muted)}.rematch-panel strong{color:var(--gold2)}@media(max-width:500px){.rematch-actions{grid-template-columns:1fr}.rematch-card{padding:22px 18px}}
`;
document.head.appendChild(style);

const modal=document.createElement('div');
modal.id='rematchModal';
modal.className='modal hidden';
modal.innerHTML=`<div class="rematch-card glass"><div class="modal-emoji">🏆</div><h2 id="rematchTitle">Game finished!</h2><p id="rematchMessage">Would you like to play again?</p><div class="rematch-actions"><button id="rematchYes" class="btn btn-primary">Yes — Play Again</button><button id="rematchNo" class="btn btn-ghost">No — Leave Game</button></div></div>`;
document.body.appendChild(modal);

const panel=document.createElement('div');
panel.id='rematchPanel';
panel.className='rematch-panel glass hidden';
panel.innerHTML=`<div><strong>Ready for another game</strong><br><span id="rematchStatus">Waiting for the other players…</span></div><span>✓ Ready</span>`;
$('gameView')?.insertBefore(panel,$('gameView').firstChild);

function getDisplayedWinner(){
  const text=[$('modalMessage')?.textContent,$('finishedText')?.textContent,$('announcement')?.textContent].filter(Boolean).join(' ');
  const match=text.match(/(?:Congratulations\s+)?(.+?)\s+(?:has won|won the Full House|— Full House)/i);
  return match?.[1]?.trim()||currentRoom?.finished?.winnerName||'The winner';
}

function showRematch(force=false){
  const finished=currentRoom?.phase==='finished'||!$('finishedBanner')?.classList.contains('hidden');
  if(!finished&&!force)return;
  $('modal')?.classList.add('hidden');
  $('claimModal')?.classList.add('hidden');
  $('rematchTitle').textContent=`${getDisplayedWinner()} won the Full House!`;
  $('rematchMessage').textContent='Would you like to play another game with the same players?';
  modal.classList.remove('hidden');
}

function humanPlayers(room){return Object.entries(room?.players||{}).filter(([,p])=>p.connected&&!p.computer);}

function updateReady(room){
  const humans=humanPlayers(room),id=myId();
  const ready=humans.filter(([pid])=>room.rematchReady?.[pid]).length;
  $('rematchStatus').textContent=`${ready} of ${humans.length} players ready`;
  panel.classList.toggle('hidden',!room.rematchReady?.[id]||room.phase!=='finished');
  const me=room.players?.[id];
  if(me?.creator&&humans.length&&ready===humans.length&&!starting){
    starting=true;
    remove(ref(db,`rooms/${roomCode}/rematchReady`)).finally(()=>{
      setTimeout(()=>{
        const btn=$('newRoundBtn');
        if(btn){btn.disabled=false;btn.click();}
        starting=false;
      },250);
    });
  }
}

async function chooseYes(){
  const id=myId();
  if(!db||!roomCode||!id)return;
  await update(ref(db,`rooms/${roomCode}`),{[`rematchReady/${id}`]:true});
  modal.classList.add('hidden');
  panel.classList.remove('hidden');
}

async function chooseNo(){
  const id=myId();
  if(!db||!roomCode||!id)return;
  const name=currentRoom?.players?.[id]?.name||'A player';
  await update(ref(db,`rooms/${roomCode}`),{
    notice:{id:`left-${Date.now()}-${id}`,target:null,title:'Player left the game',message:`${name} has left the game.`,emoji:'👋'},
    [`players/${id}/connected`]:false,
    [`players/${id}/lastSeen`]:Date.now(),
    [`rematchReady/${id}`]:null
  });
  modal.classList.add('hidden');
  setTimeout(()=>location.reload(),700);
}

$('rematchYes').onclick=chooseYes;
$('rematchNo').onclick=chooseNo;

function detectRoomCode(){
  const candidates=[$('gameRoomCode')?.textContent,$('roomCodeDisplay')?.textContent];
  return candidates.find(code=>/^\d{4}$/.test((code||'').trim()))?.trim()||'';
}

function connect(){
  const code=detectRoomCode();
  if(!code||code===roomCode||!getApps().length)return;
  roomCode=code;
  db=getDatabase(getApps()[0]);
  roomUnsub?.();
  roomUnsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{
    if(!snap.exists())return;
    currentRoom=snap.val();
    updateReady(currentRoom);
    if(currentRoom.phase==='playing'){
      handledFinish='';
      modal.classList.add('hidden');
      panel.classList.add('hidden');
    }
    const finishId=currentRoom.finished?.id||`${currentRoom.finished?.finishedAt||''}`;
    if(currentRoom.phase==='finished'&&finishId!==handledFinish){
      handledFinish=finishId;
      setTimeout(()=>showRematch(true),600);
    }
  });
}

function fallbackCheck(){
  connect();
  const finishedVisible=$('finishedBanner')&&!$('finishedBanner').classList.contains('hidden');
  if(finishedVisible&&modal.classList.contains('hidden')&&!panel.classList.contains('hidden'))return;
  if(finishedVisible&&modal.classList.contains('hidden')&&!currentRoom?.rematchReady?.[myId()])showRematch(true);
}

new MutationObserver(()=>setTimeout(fallbackCheck,50)).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
setInterval(fallbackCheck,500);
connect();
