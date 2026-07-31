(()=>{
  const confirmedShips=new Set();
  const originalRender=render;
  const originalRandomise=randomise;

  function placementActive(){
    const me=state.players?.[myKey];
    return state.phase==='placement'&&me&&!me.ready;
  }

  function selected(){
    return state.players?.[myKey]?.board?.ships?.[selectedShip]||null;
  }

  function moveBy(rowDelta,colDelta){
    if(!placementActive())return;
    const ship=selected();
    if(!ship)return;

    const start=ship.cells[0];
    const row=Math.floor(start/size)+rowDelta;
    const col=(start%size)+colDelta;
    const endRow=row+(ship.horizontal?0:ship.cells.length-1);
    const endCol=col+(ship.horizontal?ship.cells.length-1:0);

    if(row<0||col<0||endRow>=size||endCol>=size){
      flash('That ship cannot move any further.');
      return;
    }

    confirmedShips.delete(selectedShip);
    moveSelected(row*size+col);
  }

  function confirmSelected(){
    if(!placementActive())return;
    confirmedShips.add(selectedShip);

    const shipCount=state.players[myKey].board.ships.length;
    const next=Array.from({length:shipCount},(_,i)=>i).find(i=>!confirmedShips.has(i));

    if(next===undefined){
      $('message').textContent='All ships are set. Press Ready for battle.';
    }else{
      selectedShip=next;
      $('message').textContent=`Ship set. Now position ${shipNames[selectedShip]}.`;
    }
    render();
  }

  async function rotateWithReset(){
    if(!placementActive())return;
    confirmedShips.delete(selectedShip);
    await rotateSelected();
  }

  async function randomiseWithReset(){
    confirmedShips.clear();
    await originalRandomise();
  }

  buildBoard=function(board,view){
    const el=$('mainBoard');
    el.innerHTML='';
    el.classList.toggle('targeting',view==='enemy'&&state.phase==='playing'&&state.turn===myKey);

    for(let i=0;i<size*size;i++){
      const b=document.createElement('button');
      b.className='cell';
      b.type='button';

      const shot=board.shots.includes(i);
      const shipIndex=shipAt(board,i);
      const ship=shipIndex>=0?board.ships[shipIndex]:null;
      const sunk=ship&&ship.cells.every(c=>ship.hits.includes(c));
      const showShip=view==='own'||sunk;

      if(showShip&&ship)b.classList.add('ship');
      if(view==='own'&&state.phase==='placement'&&shipIndex===selectedShip)b.classList.add('selected');
      if(view==='own'&&state.phase==='placement'&&shipIndex>=0&&confirmedShips.has(shipIndex))b.classList.add('confirmed');
      if(shot)b.classList.add('shot',ship?'hit':'miss');
      if(sunk)b.classList.add('sunk');

      if(placementActive()&&view==='own'&&shipIndex>=0){
        b.onclick=()=>{
          selectedShip=shipIndex;
          render();
        };
      }else if(view==='enemy'&&state.phase==='playing'&&state.turn===myKey&&!shot){
        b.onclick=()=>shoot(i);
      }

      el.appendChild(b);
    }
  };

  render=function(){
    originalRender();
    const active=placementActive();
    const tools=$('placementTools');
    const ready=$('readyShips');
    const allSet=confirmedShips.size===fleet.length;

    if(tools)tools.classList.toggle('hidden',!active);
    if(ready){
      ready.disabled=!allSet;
      ready.classList.toggle('placement-ready',allSet);
    }

    if(active){
      const name=shipNames[selectedShip]||'ship';
      const count=confirmedShips.size;
      $('message').textContent=allSet
        ?'All ships are set. Press Ready for battle.'
        :`Position ${name} with the arrows, rotate if needed, then press OK. (${count}/${fleet.length} set)`;
    }
  };

  $('moveUp')?.addEventListener('click',()=>moveBy(-1,0));
  $('moveDown')?.addEventListener('click',()=>moveBy(1,0));
  $('moveLeft')?.addEventListener('click',()=>moveBy(0,-1));
  $('moveRight')?.addEventListener('click',()=>moveBy(0,1));
  $('confirmShip')?.addEventListener('click',confirmSelected);
  if($('rotateShip'))$('rotateShip').onclick=rotateWithReset;
  if($('randomiseShips'))$('randomiseShips').onclick=randomiseWithReset;

  const style=document.createElement('style');
  style.textContent=`
    .placement-tools{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch}
    .placement-tools.hidden{display:none}
    .ship-controller{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(58px,78px));grid-template-rows:repeat(3,58px);justify-content:center;gap:8px}
    .ship-control{border:1px solid rgba(255,255,255,.2);border-radius:14px;background:#12364a;color:#fff;font-weight:900;font-size:24px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);touch-action:manipulation}
    .ship-control:active{transform:translateY(2px);box-shadow:none}
    #moveUp{grid-column:2;grid-row:1}
    #moveLeft{grid-column:1;grid-row:2}
    #confirmShip{grid-column:2;grid-row:2;background:#19a66a;font-size:18px}
    #moveRight{grid-column:3;grid-row:2}
    #moveDown{grid-column:2;grid-row:3}
    .rotate-control{grid-column:1/-1}
    #readyShips{grid-column:1/-1;opacity:.45}
    #readyShips.placement-ready{opacity:1;box-shadow:0 0 0 3px rgba(25,166,106,.24)}
    .cell.ship{cursor:pointer}
    .cell.ship.selected{outline:3px solid #ffd166;outline-offset:-3px;filter:brightness(1.25)}
    .cell.ship.confirmed:not(.selected){box-shadow:inset 0 0 0 2px rgba(255,255,255,.35)}
    @media(max-width:520px){
      .placement-tools{grid-template-columns:1fr}
      .ship-controller{grid-template-columns:repeat(3,minmax(64px,82px));grid-template-rows:repeat(3,62px)}
    }
  `;
  document.head.appendChild(style);
})();
