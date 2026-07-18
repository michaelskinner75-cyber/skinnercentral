import { getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, onValue, update, push, remove } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const $=id=>document.getElementById(id);
const myId=()=>localStorage.getItem('skinnersPlayerId');
let db=null,roomCode='',roomUnsub=null,currentRoom=null,localStream=null,voiceOn=false;
const peers=new Map(),signalUnsubs=new Map(),remoteAudio=new Map();

const style=document.createElement('style');
style.textContent=`
.voice-chat-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-radius:18px;margin:0 0 12px;border:1px solid rgba(255,255,255,.13);background:linear-gradient(135deg,rgba(255,74,162,.17),rgba(139,92,246,.18));box-shadow:0 10px 30px rgba(0,0,0,.2)}
.voice-chat-copy{display:grid;gap:3px}.voice-chat-copy strong{font-size:.95rem}.voice-chat-copy span{font-size:.74rem;color:var(--muted)}
.voice-toggle{appearance:none;-webkit-appearance:none;width:62px;height:34px;border-radius:999px;background:rgba(255,255,255,.18);position:relative;border:1px solid rgba(255,255,255,.16);flex:0 0 auto;cursor:pointer;transition:.2s}
.voice-toggle::after{content:'🎤';position:absolute;width:28px;height:28px;left:2px;top:2px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#241521;font-size:.9rem;transition:.2s;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.voice-toggle:checked{background:linear-gradient(135deg,#5ce1a1,#25b978);box-shadow:0 0 18px rgba(92,225,161,.35)}
.voice-toggle:checked::after{transform:translateX(28px)}
.voice-live{color:#86efac!important;font-weight:800}.voice-error{color:#ff9ebf!important}
@media(max-width:500px){.voice-chat-bar{padding:11px 12px}.voice-chat-copy strong{font-size:.86rem}.voice-chat-copy span{font-size:.68rem}}
`;
document.head.appendChild(style);

function makeBar(id){
  const bar=document.createElement('div');
  bar.id=id;bar.className='voice-chat-bar glass';
  bar.innerHTML=`<div class="voice-chat-copy"><strong>🎤 Voice Chat</strong><span>Off — tap the switch to talk and listen</span></div><input class="voice-toggle" type="checkbox" aria-label="Turn voice chat on">`;
  bar.querySelector('input').addEventListener('change',e=>setVoice(e.target.checked,bar));
  return bar;
}
const lobbyBar=makeBar('lobbyVoiceChat'),gameBar=makeBar('gameVoiceChat');
$('lobbyView')?.insertBefore(lobbyBar,$('lobbyView').firstChild);
$('gameView')?.insertBefore(gameBar,$('gameView').firstChild);

function status(text,kind=''){
  [lobbyBar,gameBar].forEach(bar=>{
    const s=bar.querySelector('.voice-chat-copy span');s.textContent=text;s.className=kind;
    bar.querySelector('input').checked=voiceOn;
  });
}
function detectRoomCode(){return [$('gameRoomCode')?.textContent,$('roomCodeDisplay')?.textContent].map(x=>(x||'').trim()).find(x=>/^\d{4}$/.test(x))||'';}
function pairKey(a,b){return [a,b].sort().join('__');}
function closePeer(id){
  peers.get(id)?.close();peers.delete(id);
  signalUnsubs.get(id)?.forEach(fn=>fn());signalUnsubs.delete(id);
  remoteAudio.get(id)?.remove();remoteAudio.delete(id);
}
function closeAll(){[...peers.keys()].forEach(closePeer);}

async function setVoice(on,bar){
  if(on){
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone not supported');
      localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      voiceOn=true;status('On — everyone with Voice Chat on can hear you','voice-live');
      await publishVoice(true);syncPeers();
    }catch(e){
      console.error(e);voiceOn=false;bar.querySelector('input').checked=false;status('Microphone permission was not allowed','voice-error');
    }
  }else{
    voiceOn=false;localStream?.getTracks().forEach(t=>t.stop());localStream=null;closeAll();await publishVoice(false);status('Off — tap the switch to talk and listen');
  }
}
async function publishVoice(enabled){const id=myId();if(db&&roomCode&&id)await update(ref(db,`rooms/${roomCode}/players/${id}`),{voiceEnabled:enabled});}

function createPeer(otherId,initiator){
  if(peers.has(otherId)||!localStream)return peers.get(otherId);
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
  peers.set(otherId,pc);localStream.getTracks().forEach(track=>pc.addTrack(track,localStream));
  const key=pairKey(myId(),otherId),base=`rooms/${roomCode}/voiceSignals/${key}`;
  pc.onicecandidate=e=>{if(e.candidate)push(ref(db,`${base}/candidates/${myId()}`),e.candidate.toJSON());};
  pc.ontrack=e=>{
    let audio=remoteAudio.get(otherId);if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.dataset.voicePlayer=otherId;document.body.appendChild(audio);remoteAudio.set(otherId,audio);}audio.srcObject=e.streams[0];audio.play().catch(()=>{});
  };
  pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState))closePeer(otherId);};
  const unsubs=[];
  unsubs.push(onValue(ref(db,`${base}/offer`),async snap=>{const offer=snap.val();if(!offer||initiator||pc.currentRemoteDescription)return;try{await pc.setRemoteDescription(offer);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await update(ref(db,base),{answer:answer.toJSON()});}catch(e){console.error(e);}}));
  unsubs.push(onValue(ref(db,`${base}/answer`),async snap=>{const answer=snap.val();if(!answer||!initiator||pc.currentRemoteDescription)return;try{await pc.setRemoteDescription(answer);}catch(e){console.error(e);}}));
  unsubs.push(onValue(ref(db,`${base}/candidates/${otherId}`),async snap=>{for(const c of Object.values(snap.val()||{})){try{await pc.addIceCandidate(c);}catch{}}}));
  signalUnsubs.set(otherId,unsubs);
  if(initiator){(async()=>{try{await remove(ref(db,base));const offer=await pc.createOffer();await pc.setLocalDescription(offer);await update(ref(db,base),{offer:offer.toJSON(),createdAt:Date.now()});}catch(e){console.error(e);}})();}
  return pc;
}

function syncPeers(){
  if(!voiceOn||!currentRoom||!localStream)return;
  const id=myId();
  const active=Object.entries(currentRoom.players||{}).filter(([pid,p])=>pid!==id&&p.connected&&!p.computer&&p.voiceEnabled).map(([pid])=>pid);
  active.forEach(pid=>createPeer(pid,id.localeCompare(pid)<0));
  [...peers.keys()].filter(pid=>!active.includes(pid)).forEach(closePeer);
  status(active.length?`On — connected to ${active.length} other player${active.length===1?'':'s'}`:'On — waiting for another player to switch it on','voice-live');
}

function connect(){
  const code=detectRoomCode();if(!code||!getApps().length)return;
  if(code===roomCode)return;
  roomCode=code;db=getDatabase(getApps()[0]);roomUnsub?.();closeAll();
  roomUnsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{if(!snap.exists())return;currentRoom=snap.val();syncPeers();});
}
setInterval(connect,400);connect();
window.addEventListener('pagehide',()=>{publishVoice(false);localStream?.getTracks().forEach(t=>t.stop());closeAll();});
