import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js';

const firebaseConfig={apiKey:'AIzaSyAhQcvXPsAkc22WQmnLII17JUNnYj_oeKQ',authDomain:'skinners-bar-bingo.firebaseapp.com',databaseURL:'https://skinners-bar-bingo-default-rtdb.europe-west1.firebasedatabase.app',projectId:'skinners-bar-bingo',storageBucket:'skinners-bar-bingo.firebasestorage.app',messagingSenderId:'1033478065497',appId:'1:1033478065497:web:e7b4904fd9ef7afd171048'};
const app=getApps().length?getApp():initializeApp(firebaseConfig);
const db=getDatabase(app);
const $=id=>document.getElementById(id);

function openLobbyWithCode(roomCode){
  if(!roomCode)return;
  $('roomCodeDisplay').textContent=roomCode;
  $('gameRoomCode').textContent=roomCode;
  $('homeView').classList.remove('active');
  $('gameView').classList.remove('active');
  $('lobbyView').classList.add('active');
}

async function recoverCreatedRoom(){
  const myId=localStorage.getItem('skinnersPlayerId');
  if(!myId)return;
  try{
    const snapshot=await get(ref(db,'rooms'));
    if(!snapshot.exists())return;
    const now=Date.now();
    const matches=Object.entries(snapshot.val()||{})
      .filter(([,room])=>room?.hostId===myId&&room?.phase==='lobby'&&now-(Number(room.createdAt)||0)<120000)
      .sort((a,b)=>(Number(b[1]?.createdAt)||0)-(Number(a[1]?.createdAt)||0));
    if(matches[0])openLobbyWithCode(matches[0][0]);
  }catch(error){
    console.warn('Room-code recovery could not read rooms',error);
  }
}

$('confirmCreateBtn')?.addEventListener('click',()=>{
  let attempts=0;
  const timer=setInterval(async()=>{
    attempts+=1;
    const shown=$('roomCodeDisplay')?.textContent;
    if(/^\d{4}$/.test(shown||'')){clearInterval(timer);return;}
    await recoverCreatedRoom();
    if(attempts>=12)clearInterval(timer);
  },500);
});
