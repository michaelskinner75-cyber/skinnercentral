import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, get, update, onValue } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const firebaseConfig={apiKey:'AIzaSyAhQcvXPsAkc22WQmnLII17JUNnYj_oeKQ',authDomain:'skinners-bar-bingo.firebaseapp.com',databaseURL:'https://skinners-bar-bingo-default-rtdb.europe-west1.firebasedatabase.app',projectId:'skinners-bar-bingo',storageBucket:'skinners-bar-bingo.firebasestorage.app',messagingSenderId:'1033478065497',appId:'1:1033478065497:web:e7b4904fd9ef7afd171048'};
const app=getApps()[0]||initializeApp(firebaseConfig);
const db=getDatabase(app);
const myId=localStorage.getItem('skinnersPlayerId');
const overlay=document.getElementById('readyOverlay');
const readyBtn=document.getElementById('playerReadyBtn');
const readyTitle=document.getElementById('readyTitle');
const readyMessage=document.getElementById('readyMessage');
const readyStatus=document.getElementById('readyStatus');
const countdownNumber=document.getElementById('countdownNumber');
let roomCode='';
let roomUnsub=null;
let countdownTimer=null;
let startTriggered=false;
let autoTriggered=false;

function getRoomCode(){
  const code=(document.getElementById('roomCodeDisplay')?.textContent||'').trim();
  return /^\d{4}$/.test(code)?code:'';
}

function showOverlay(show=true){overlay?.classList.toggle('hidden',!show);}
function clearCountdown(){clearInterval(countdownTimer);countdownTimer=null;}
function humanPlayers(room){return Object.entries(room.players||{}).filter(([,p])=>p.connected!==false&&!p.computer);}

async function markReady(){
  if(!roomCode||!myId)return;
  readyBtn.disabled=true;
  readyBtn.textContent='READY ✓';
  await update(ref(db,`rooms/${roomCode}/players/${myId}`),{ready:true,readyAt:Date.now()});
}

function renderReady(room){
  const humans=humanPlayers(room);
  const readyCount=humans.filter(([,p])=>p.ready).length;
  const me=room.players?.[myId];
  const countdownEndsAt=Number(room.countdownEndsAt)||0;
  const inLobby=room.phase==='lobby';

  if(!inLobby){
    showOverlay(false);
    clearCountdown();
    if(room.phase==='playing'&&room.hostId===myId&&!autoTriggered){
      autoTriggered=true;
      setTimeout(()=>document.getElementById('autoCallBtn')?.click(),700);
    }
    return;
  }

  showOverlay(true);
  readyStatus.textContent=`${readyCount} of ${humans.length} players ready`;
  readyBtn.disabled=!!me?.ready||countdownEndsAt>0;
  readyBtn.textContent=me?.ready?'READY ✓':'I’M READY';

  if(countdownEndsAt){
    readyTitle.textContent='EVERYONE IS READY!';
    readyMessage.textContent='Eyes down — the game is about to begin.';
    readyBtn.classList.add('hidden');
    countdownNumber.classList.remove('hidden');
    clearCountdown();
    const tick=()=>{
      const seconds=Math.max(0,Math.ceil((countdownEndsAt-Date.now())/1000));
      countdownNumber.textContent=seconds||'GO!';
      if(seconds<=0){
        clearCountdown();
        if(room.hostId===myId&&!startTriggered){
          startTriggered=true;
          document.getElementById('startGameBtn')?.click();
        }
      }
    };
    tick();
    countdownTimer=setInterval(tick,200);
    return;
  }

  readyTitle.textContent=me?.ready?'YOU’RE READY!':'READY TO PLAY?';
  readyMessage.textContent=me?.ready?'Waiting for the other players to confirm.':'Please ensure your device volume is turned up so you can hear the bingo caller.';
  readyBtn.classList.remove('hidden');
  countdownNumber.classList.add('hidden');

  const allReady=humans.length>0&&humans.every(([,p])=>p.ready);
  if(allReady&&room.hostId===myId){
    update(ref(db,`rooms/${roomCode}`),{countdownEndsAt:Date.now()+5000}).catch(console.error);
  }
}

function watchRoom(code){
  if(!code||code===roomCode)return;
  roomCode=code;
  roomUnsub?.();
  roomUnsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{
    if(snap.exists())renderReady(snap.val());
  });
}

readyBtn?.addEventListener('click',markReady);

const observer=new MutationObserver(()=>{
  const code=getRoomCode();
  if(code)watchRoom(code);
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true});

setInterval(()=>{
  const code=getRoomCode();
  if(code)watchRoom(code);
},500);
