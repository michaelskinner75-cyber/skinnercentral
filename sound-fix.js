import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const firebaseConfig={apiKey:'AIzaSyAhQcvXPsAkc22WQmnLII17JUNnYj_oeKQ',authDomain:'skinners-bar-bingo.firebaseapp.com',databaseURL:'https://skinners-bar-bingo-default-rtdb.europe-west1.firebasedatabase.app',projectId:'skinners-bar-bingo',storageBucket:'skinners-bar-bingo.firebasestorage.app',messagingSenderId:'1033478065497',appId:'1:1033478065497:web:e7b4904fd9ef7afd171048'};
const app=getApps()[0]||initializeApp(firebaseConfig);
const db=getDatabase(app);
let audioContext=null,unsub=null,currentRoom='',lastCount=0,enabled=true,unlocked=false;

function phrase(n){const nick={1:'Kelly’s eye',2:'One little duck',3:'Cup of tea',7:'Lucky seven',11:'Legs eleven',22:'Two little ducks',33:'All the threes',44:'Droopy drawers',55:'Snakes alive',66:'Clickety click',77:'Sunset strip',88:'Two fat ladies',90:'Top of the shop'};return nick[n]?`${nick[n]} — ${n}`:`Number ${n}`;}
function toast(text){const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2200);}
function unlock(){try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();unlocked=true;}catch{}if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance('');u.volume=0;window.speechSynthesis.speak(u);}}
function tone(){if(!enabled||!unlocked||!audioContext)return;try{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=660;g.gain.setValueAtTime(.05,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.16);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.16);}catch{}}
function speak(n){if(!enabled||!unlocked||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(phrase(n));u.rate=.88;u.pitch=1;u.volume=1;window.speechSynthesis.speak(u);tone();}
function watchRoom(code){if(!/^\d{4}$/.test(code)||code===currentRoom)return;unsub?.();currentRoom=code;lastCount=0;unsub=onValue(ref(db,`rooms/${code}/called`),snap=>{const called=Array.isArray(snap.val())?snap.val():[];const host=document.getElementById('hostControls');const isHost=host&&!host.classList.contains('hidden');if(lastCount&&called.length>lastCount&&!isHost)speak(called.at(-1));lastCount=called.length;});}
function detectRoom(){const code=(document.getElementById('gameRoomCode')?.textContent||document.getElementById('roomCodeDisplay')?.textContent||'').trim();watchRoom(code);}

document.addEventListener('pointerdown',unlock,{once:true,capture:true});
document.addEventListener('touchstart',unlock,{once:true,capture:true,passive:true});
const soundBtn=document.getElementById('soundBtn');
soundBtn?.addEventListener('click',()=>{unlock();enabled=soundBtn.textContent!=='🔇';if(enabled){const u=new SpeechSynthesisUtterance('Sound ready');u.rate=.95;window.speechSynthesis?.cancel();window.speechSynthesis?.speak(u);toast('Sound ready on this device');}},true);
new MutationObserver(detectRoom).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
setInterval(detectRoom,1000);
detectRoom();