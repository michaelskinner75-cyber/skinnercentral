const $=id=>document.getElementById(id);
const enabledCards=new Set(JSON.parse(localStorage.getItem('skinnersAutoCards')||'[]'));
let syncing=false;

const style=document.createElement('style');
style.textContent=`
.card-auto-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 14px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}
.card-auto-copy{display:flex;flex-direction:column;gap:2px}.card-auto-copy strong{font-size:.92rem}.card-auto-copy span{font-size:.72rem;opacity:.72}
.card-auto-toggle{appearance:none;-webkit-appearance:none;width:54px;height:30px;border-radius:999px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;transition:.2s;border:1px solid rgba(255,255,255,.16);flex:0 0 auto}
.card-auto-toggle::after{content:'';position:absolute;width:24px;height:24px;left:2px;top:2px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35);transition:.2s}
.card-auto-toggle:checked{background:linear-gradient(135deg,#ff4fd8,#7b5cff);box-shadow:0 0 18px rgba(255,79,216,.4)}
.card-auto-toggle:checked::after{transform:translateX(24px)}
.card-auto-toggle:disabled{opacity:.55;cursor:not-allowed}
`;
document.head.appendChild(style);

function save(){localStorage.setItem('skinnersAutoCards',JSON.stringify([...enabledCards]));}
function cardIndex(panel){return [...document.querySelectorAll('#ticketsContainer .ticket-panel')].indexOf(panel);}
function calledNumbers(){return new Set([...document.querySelectorAll('#numberBoard .board-number.called')].map(x=>Number(x.textContent)).filter(Boolean));}

function enhanceCards(){
  document.querySelectorAll('#ticketsContainer .ticket-panel').forEach((panel,index)=>{
    if(panel.querySelector('.card-auto-row'))return;
    const row=document.createElement('label');
    row.className='card-auto-row';
    row.innerHTML=`<span class="card-auto-copy"><strong>✨ Auto Mark Numbers</strong><span>Automatically dab called numbers on this card</span></span><input class="card-auto-toggle" type="checkbox" aria-label="Auto mark Card ${index+1}">`;
    const toggle=row.querySelector('input');
    toggle.checked=enabledCards.has(index);
    toggle.addEventListener('change',()=>{toggle.checked?enabledCards.add(index):enabledCards.delete(index);save();syncAutoMarks();});
    const grid=panel.querySelector('.ticket-grid');
    panel.insertBefore(row,grid);
  });
}

async function syncAutoMarks(){
  if(syncing)return;
  syncing=true;
  try{
    const called=calledNumbers();
    for(const panel of document.querySelectorAll('#ticketsContainer .ticket-panel')){
      const index=cardIndex(panel);
      if(!enabledCards.has(index))continue;
      for(const cell of panel.querySelectorAll('.ticket-cell:not(.blank)')){
        const n=Number(cell.textContent.trim());
        if(called.has(n)&&!cell.classList.contains('called')){
          cell.click();
          await new Promise(r=>setTimeout(r,35));
        }
      }
    }
  }finally{syncing=false;}
}

let claimBusy=false;
function autoClaimWins(){
  const modal=$('claimModal'),button=$('claimNowBtn');
  if(claimBusy||!modal||modal.classList.contains('hidden')||!button)return;
  claimBusy=true;
  button.click();
  setTimeout(()=>{claimBusy=false;},700);
}

const observer=new MutationObserver(()=>{
  enhanceCards();
  syncAutoMarks();
  autoClaimWins();
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
setInterval(()=>{enhanceCards();syncAutoMarks();autoClaimWins();},350);
