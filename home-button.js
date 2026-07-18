import { getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, get, update } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const $=id=>document.getElementById(id);
const button=document.createElement('button');
button.id='returnHomeBtn';
button.type='button';
button.className='btn btn-ghost';
button.textContent='🏠 Return to Home';
button.setAttribute('aria-label','Return to home');

const style=document.createElement('style');
style.textContent=`
#returnHomeBtn{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:9000;min-height:44px;padding:9px 13px;border-radius:14px;background:rgba(20,10,25,.94);border:1px solid rgba(255,255,255,.2);box-shadow:0 8px 28px rgba(0,0,0,.45);font-size:.78rem;display:none}
body.in-room #returnHomeBtn{display:block}
@media(max-width:500px){#returnHomeBtn{font-size:.72rem;min-height:40px;padding:8px 11px}}
`;
document.head.appendChild(style);
document.body.appendChild(button);

function roomCode(){
  return [$('gameRoomCode')?.textContent,$('roomCodeDisplay')?.textContent]
    .map(v=>(v||'').trim()).find(v=>/^\d{4}$/.test(v))||'';
}
function syncVisibility(){
  const inRoom=$('lobbyView')?.classList.contains('active')||$('gameView')?.classList.contains('active');
  document.body.classList.toggle('in-room',!!inRoom);
}

async function leaveRoom(){
  const code=roomCode();
  const id=localStorage.getItem('skinnersPlayerId');
  if(!code||!id){location.reload();return;}
  const ok=confirm('Return to the home screen and leave this game?');
  if(!ok)return;
  button.disabled=true;
  button.textContent='Leaving…';
  try{
    if(getApps().length){
      const db=getDatabase(getApps()[0]);
      const playerSnap=await get(ref(db,`rooms/${code}/players/${id}`));
      const player=playerSnap.val()||{};
      const name=player.name||'A player';
      await update(ref(db,`rooms/${code}`),{
        notice:{id:`home-${Date.now()}-${id}`,target:null,title:'Player left the game',message:`${name} has returned to the home screen.`,emoji:'🏠'},
        [`players/${id}/connected`]:false,
        [`players/${id}/ready`]:false,
        [`players/${id}/lastSeen`]:Date.now(),
        [`rematchReady/${id}`]:null
      });
    }
  }catch(error){console.error('Could not update leave status',error);}
  location.reload();
}

button.addEventListener('click',leaveRoom);
new MutationObserver(syncVisibility).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
setInterval(syncVisibility,500);
syncVisibility();
