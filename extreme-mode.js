import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const firebaseConfig={apiKey:'AIzaSyAhQcvXPsAkc22WQmnLII17JUNnYj_oeKQ',authDomain:'skinners-bar-bingo.firebaseapp.com',databaseURL:'https://skinners-bar-bingo-default-rtdb.europe-west1.firebasedatabase.app',projectId:'skinners-bar-bingo',storageBucket:'skinners-bar-bingo.firebasestorage.app',messagingSenderId:'1033478065497',appId:'1:1033478065497:web:e7b4904fd9ef7afd171048'};
const app=getApps().find(a=>a.options.projectId===firebaseConfig.projectId)||initializeApp(firebaseConfig,'extreme-mode');
const db=getDatabase(app);
const $=id=>document.getElementById(id);
let roomCode='';
let unsub=null;
let extreme=false;

const style=document.createElement('style');
style.textContent=`
.extreme-note{display:none;margin:7px 0 0;padding:8px 10px;border-radius:12px;background:linear-gradient(135deg,rgba(255,74,162,.17),rgba(139,92,246,.2));color:#ffe8a8;font-size:.75rem;font-weight:800;text-align:center}
body.extreme-active .extreme-note{display:block}
body.extreme-active #speedSelect{pointer-events:none;opacity:.8}
body.extreme-active .card-auto-row{border-color:rgba(255,74,162,.35);background:rgba(255,74,162,.09)}
`;
document.head.appendChild(style);

const note=document.createElement('div');
note.className='extreme-note';
note.textContent='⚡ Extreme mode: rapid calling and automatic dabbing are locked on.';
$('hostControls')?.prepend(note);

function findRoom(){
  const code=($('roomCodeDisplay')?.textContent||$('gameRoomCode')?.textContent||'').trim();
  if(/^\d{4}$/.test(code)&&code!==roomCode){
    roomCode=code;
    unsub?.();
    unsub=onValue(ref(db,`rooms/${roomCode}`),snap=>{
      if(!snap.exists())return;
      extreme=snap.val().mode==='extreme';
      document.body.classList.toggle('extreme-active',extreme);
      applyExtreme();
    });
  }
}

function applyExtreme(){
  if(!extreme)return;
  const speed=$('speedSelect');
  if(speed){
    if(!speed.querySelector('option[value="1500"]')){
      const option=document.createElement('option');
      option.value='1500';
      option.textContent='⚡ Extreme · 1.5 sec';
      speed.prepend(option);
    }
    speed.value='1500';
  }
  document.querySelectorAll('.card-auto-toggle').forEach(toggle=>{
    if(!toggle.checked){
      toggle.checked=true;
      toggle.dispatchEvent(new Event('change',{bubbles:true}));
    }
    toggle.disabled=true;
  });
  const badge=$('modeBadge');
  if(badge)badge.textContent='⚡ Extreme Bingo · Auto Dab';
  const label=$('gameModeLabel');
  if(label)label.textContent='Extreme';
}

setInterval(()=>{findRoom();applyExtreme();},180);
