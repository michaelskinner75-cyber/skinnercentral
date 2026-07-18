const $=id=>document.getElementById(id);
let celebrationActive=false;
let celebrationTimer=null;
let resumeAfterCelebration=false;
let lastWinnerMessage='';

const style=document.createElement('style');
style.textContent=`
#winnerCelebration{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(circle at center,rgba(74,20,91,.5),rgba(7,3,12,.88));backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);pointer-events:none}
#winnerCelebration.hidden{display:none}.winner-stage{position:relative;width:min(94vw,900px);padding:34px 18px;text-align:center;filter:drop-shadow(0 18px 30px rgba(0,0,0,.45));animation:winnerStageIn .45s cubic-bezier(.2,.9,.25,1.25)}
.winner-kicker{font-family:'Marker Felt','Chalkboard SE','Comic Sans MS',cursive;font-size:clamp(2.15rem,9vw,5.8rem);line-height:.95;font-weight:900;letter-spacing:.02em;color:#ffe45e;text-shadow:0 3px 0 #e443a8,0 6px 0 #7028bb,0 0 24px rgba(255,228,94,.85),0 0 48px rgba(255,67,181,.65);transform:rotate(-2deg);animation:winnerFloat 1.25s ease-in-out infinite alternate}
.winner-message{margin-top:22px;font-family:'Marker Felt','Chalkboard SE','Comic Sans MS',cursive;font-size:clamp(1.65rem,6.2vw,4.2rem);line-height:1.08;font-weight:900;color:#fff;text-shadow:0 3px 0 #6a24a8,0 0 18px rgba(255,255,255,.65),0 0 36px rgba(74,220,255,.5);animation:winnerFloat 1.25s ease-in-out .15s infinite alternate}
.winner-subtext{margin-top:18px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#dffcff;font-size:clamp(.8rem,2.8vw,1.1rem);text-shadow:0 0 12px rgba(95,225,255,.8)}
.firework{position:absolute;width:14px;height:14px;border-radius:50%;box-shadow:0 -72px #ffe45e,51px -51px #ff4fab,72px 0 #62e8ff,51px 51px #75ff7a,0 72px #ff875e,-51px 51px #bd75ff,-72px 0 #fff,-51px -51px #ffda68;animation:fireworkBurst 1.35s ease-out infinite}
.firework::before,.firework::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:0 -48px #fff,34px -34px #75ff7a,48px 0 #ffda68,34px 34px #ff4fab,0 48px #62e8ff,-34px 34px #fff,-48px 0 #bd75ff,-34px -34px #ff875e;animation:fireworkSpin 1.35s linear infinite}.firework::after{transform:rotate(22.5deg) scale(.72);animation-direction:reverse}.firework.one{left:10%;top:25%}.firework.two{right:10%;top:20%;animation-delay:.35s}.firework.three{left:18%;bottom:18%;animation-delay:.7s}.firework.four{right:16%;bottom:16%;animation-delay:1s}
.sparkle{position:absolute;font-size:clamp(1.5rem,5vw,3rem);animation:sparkleDance 1.1s ease-in-out infinite alternate}.sparkle.s1{left:5%;top:8%}.sparkle.s2{right:4%;top:48%;animation-delay:.3s}.sparkle.s3{left:42%;bottom:0;animation-delay:.6s}.sparkle.s4{right:40%;top:0;animation-delay:.9s}
@keyframes winnerStageIn{from{opacity:0;transform:scale(.55) rotate(-4deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes winnerFloat{from{transform:translateY(5px) rotate(-2deg) scale(1)}to{transform:translateY(-10px) rotate(1deg) scale(1.035)}}@keyframes fireworkBurst{0%{opacity:0;transform:scale(.2)}20%{opacity:1}75%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(1.4)}}@keyframes fireworkSpin{to{transform:rotate(360deg)}}@keyframes sparkleDance{from{opacity:.4;transform:scale(.7) rotate(-15deg)}to{opacity:1;transform:scale(1.25) rotate(18deg)}}
@media (prefers-reduced-motion:reduce){.winner-stage,.winner-kicker,.winner-message,.firework,.firework::before,.firework::after,.sparkle{animation:none!important}}
`;
document.head.appendChild(style);

const overlay=document.createElement('div');
overlay.id='winnerCelebration';
overlay.className='hidden';
overlay.setAttribute('aria-live','assertive');
overlay.innerHTML=`<div class="firework one"></div><div class="firework two"></div><div class="firework three"></div><div class="firework four"></div><div class="sparkle s1">✨</div><div class="sparkle s2">🎆</div><div class="sparkle s3">✨</div><div class="sparkle s4">🎇</div><div class="winner-stage"><div class="winner-kicker">CONGRATULATIONS!</div><div id="winnerCelebrationMessage" class="winner-message"></div><div class="winner-subtext">Game paused for the celebration</div></div>`;
document.body.appendChild(overlay);

function hostControlsVisible(){const controls=$('hostControls');return !!controls&&!controls.classList.contains('hidden');}
function pauseGame(){const auto=$('autoCallBtn');resumeAfterCelebration=hostControlsVisible()&&!!auto&&!auto.disabled&&/pause/i.test(auto.textContent||'');if(resumeAfterCelebration)auto.click();}
function resultFrom(message=''){const full=/full house/i.test(message),two=/two lines|2 lines/i.test(message),name=message.split(/ has claimed /i)[0]?.trim()||'A player';if(full)return{type:'full-house',text:`${name} has won the FULL HOUSE!`};if(two)return{type:'two-lines',text:`${name} has won TWO LINES!`};return{type:'line',text:`${name} has won A LINE!`};}
function celebrate(message){if(celebrationActive||!message||message===lastWinnerMessage)return;lastWinnerMessage=message;celebrationActive=true;const result=resultFrom(message);pauseGame();$('modal')?.classList.add('hidden');$('winnerCelebrationMessage').textContent=result.text;overlay.classList.remove('hidden');clearTimeout(celebrationTimer);celebrationTimer=setTimeout(()=>{overlay.classList.add('hidden');celebrationActive=false;if(!hostControlsVisible())return;if(result.type==='full-house'){const newRound=$('newRoundBtn');if(newRound&&!newRound.disabled)newRound.click();}else if(resumeAfterCelebration){const auto=$('autoCallBtn');if(auto&&!auto.disabled&&!/pause/i.test(auto.textContent||''))auto.click();}resumeAfterCelebration=false;},4800);}
function inspectWinnerModal(){const modal=$('modal'),title=$('modalTitle')?.textContent||'',message=$('modalMessage')?.textContent||'';if(!modal||modal.classList.contains('hidden'))return;if(!/winner|congratulations/i.test(title)||!/has claimed|has won/i.test(message))return;celebrate(message);}
const observer=new MutationObserver(inspectWinnerModal);const modal=$('modal');if(modal)observer.observe(modal,{attributes:true,subtree:true,childList:true,characterData:true});setInterval(inspectWinnerModal,250);
