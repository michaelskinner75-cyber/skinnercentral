import { getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const $=id=>document.getElementById(id);
const myId=localStorage.getItem('skinnersPlayerId');
let db=null,roomCode='',roomUnsub=null,firstWinners={},lastPhase='',handledFinish='',starting=false,currentRoom=null;

const style=document.createElement('style');
style.textContent=`
.rematch-card{width:min(390px,100%);padding:26px;border-radius:26px;text-align:center}.rematch-card h2{margin:8px 0}.rematch-card p{color:var(--muted);line-height:1.45}.rematch-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.rematch-panel{margin:0 0 12px;padding:11px 13px;border-radius:16px;display:flex;align-items:center;justify-content:space-between;gap:10px}.rematch-panel span{font-size:.8rem;color:var(--muted)}.rematch-panel strong{color:var(--gold2)}@media(max-width:500px){.rematch-actions{grid-template-columns:1fr}.rematch-card{padding:22px 18px}}
`;
document.head.appendChild(style);

const modal=document.createElement('div');
modal.id='rematchModal';modal.className='modal hidden';modal.innerHTML=`<div class="rematch-card glass"><div class="modal-emoji">🏆</div><h2 id="rematchTitle">Game finished!</h2><p id="rematchMessage">Would you like to play again?</p><div class="rematch-actions"><button id="rematchYes" class="btn btn-primary">Yes — Play Again</button><button id="rematchNo" class="btn btn-ghost">No — Leave Game</button></div></div>`;
document.body.appendChild(modal);

const panel=document.createElement('div');
panel.id='rematchPanel';panel.className='rematch-panel glass hidden';panel.innerHTML=`<div><strong>Ready for another game</strong><br><span id="rematchStatus">Waiting for the other players…</span></div><span>✓ Ready</span>`;
$('gameView')?.insertBefore(panel,$('gameView').firstChild);

function prizeType(text=''){
  const t=text.toLowerCase();
  if(t.includes('full house'))return'full-house';
  if(t.includes('two lines')||t.includes('2 lines'))return'two-lines';
  if(t.includes('a line')||t.includes('one line'))return'line';
  return'';
}
function winnerName(id){return currentRoom?.players?.[id]?.name||'Player';}
function recordFirstWinners(room){
  for(const [id,types] of Object.entries(room.wins||{}))for(const type of (Array.isArray(types)?types:[]))if(!firstWinners[type])firstWinners[type]=id;
}
function suppressDuplicatePopups(){
  const normal=$('modal');
  if(normal&&!normal.classList.contains('hidden')){
    const message=$('modalMessage')?.textContent||'',type=prizeType(message),first=firstWinners[type];
    if(type&&first&&!message.includes(winnerName(first)))normal.classList.add('hidden');
  }
  const claim=$('claimModal');
  if(claim&&!claim.classList.contains('hidden')){
    const type=prizeType(`${$('claimTitle')?.textContent||''} ${$('claimMessage')?.textContent||''}`);
    if(type&&firstWinners[type]&&firstWinners[type]!==myId)claim.classList.add('hidden');
  }
}
new MutationObserver(suppressDuplicatePopups).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});

function showRematch(room){
  const winner=room.finished?.winnerName||'The winner';
  $('modal')?.classList.add('hidden');
  $('claimModal')?.classList.add('hidden');
  $('rematchTitle').textContent=`${winner} won the Full House!`;
  $('rematchMessage').textContent='Would you like to play another game with the same players?';
  modal.classList.remove('hidden');
}
function updateReady(room){
  const humans=Object.entries(room.players||{}).filter(([,p])=>p.connected&&!p.computer);
  const ready=humans.filter(([id])=>room.rematchReady?.[id]).length;
  $('rematchStatus').textContent=`${ready} of ${humans.length} players ready`;
  panel.classList.toggle('hidden',!room.rematchReady?.[myId]||room.phase!=='finished');
  const me=room.players?.[myId];
  if(me?.creator&&humans.length&&ready===humans.length&&!starting){
    starting=true;
    remove(ref(db,`rooms/${roomCode}/rematchReady`)).finally(()=>{
      setTimeout(()=>{$('newRoundBtn')?.click();starting=false;},150);
    });
  }
}
async function chooseYes(){
  if(!db||!roomCode)return;
  await update(ref(db,`rooms/${roomCode}`),{[`rematchReady/${myId}`]:true});
  modal.classList.add('hidden');panel.classList.remove('hidden');
}
async function chooseNo(){
  if(!db||!roomCode)return;
  const name=currentRoom?.players?.[myId]?.name||'A player';
  await update(ref(db,`rooms/${roomCode}`),{
    notice:{id:`left-${Date.now()}-${myId}`,target:null,title:'Player left the game',message:`${name} has left the game.`,emoji:'👋'},
    [`players/${myId}/connected`]:false,
    [`players/${myId}/lastSeen`]:Date.now(),
    [`rematchReady/${myId}`]:null
  });
  modal.classList.add('hidden');
  setTimeout(()=>location.reload(),900);
}
$('rematchYes').onclick=chooseYes;$('rematchNo').onclick=chooseNo;

function connect(){
  const code=($('roomCodeDisplay')?.textContent||$('gameRoomCode')?.textContent||'').trim();
  if(!/^\d{4}$/.test(code)||code===roomCode||!getApps().length)return;
  roomCode=code;db=getDatabase(getApps()[0]);roomUnsub?.();
  roomUnsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{
    if(!snap.exists())return;const room=snap.val();currentRoom=room;
    if(room.phase==='playing'&&lastPhase!=='playing'){firstWinners={};handledFinish='';panel.classList.add('hidden');modal.classList.add('hidden');}
    recordFirstWinners(room);suppressDuplicatePopups();updateReady(room);
    if(room.phase==='finished'&&room.finished?.id&&room.finished.id!==handledFinish){handledFinish=room.finished.id;setTimeout(()=>showRematch(room),250);}
    lastPhase=room.phase;
  });
}
setInterval(connect,400);connect();
