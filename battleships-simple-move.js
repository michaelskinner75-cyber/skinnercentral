(()=>{
  const confirmedShips=new Set();
  const originalRender=render;
  const originalBuildBoard=buildBoard;
  const originalRandomise=randomise;
  const originalReadyFleet=readyFleet;

  const me=()=>state.players&&state.players[myKey];
  const placementActive=()=>state.phase==='placement'&&me()&&!me().ready;
  const currentShip=()=>me()?.board?.ships?.[selectedShip]||null;

  function showPlacementMessage(text){
    const message=$('message');
    if(message)message.textContent=text;
  }

  function moveBy(rowChange,columnChange){
    if(!placementActive())return;
    const ship=currentShip();
    if(!ship)return;

    const firstCell=Math.min(...ship.cells);
    const row=Math.floor(firstCell/size)+rowChange;
    const column=(firstCell%size)+columnChange;
    const lastRow=row+(ship.horizontal?0:ship.cells.length-1);
    const lastColumn=column+(ship.horizontal?ship.cells.length-1:0);

    if(row<0||column<0||lastRow>=size||lastColumn>=size){
      showPlacementMessage('That ship cannot move any further.');
      return;
    }

    const start=row*size+column;
    const cells=candidateCells(start,ship.cells.length,ship.horizontal);
    const blocked=me().board.ships.some((other,index)=>
      index!==selectedShip&&other.cells.some(cell=>cells.includes(cell))
    );

    if(blocked){
      showPlacementMessage('Ships cannot overlap.');
      return;
    }

    confirmedShips.delete(selectedShip);
    ship.cells=cells;
    ship.hits=[];
    me().board.shots=[];
    savePlacement();
    render();
  }

  function rotateShip(){
    if(!placementActive())return;
    const ship=currentShip();
    if(!ship)return;

    const firstCell=Math.min(...ship.cells);
    const cells=candidateCells(firstCell,ship.cells.length,!ship.horizontal);
    if(!cells){
      showPlacementMessage('There is not enough room to rotate here. Move the ship first.');
      return;
    }

    const blocked=me().board.ships.some((other,index)=>
      index!==selectedShip&&other.cells.some(cell=>cells.includes(cell))
    );
    if(blocked){
      showPlacementMessage('The ship cannot rotate because another ship is in the way.');
      return;
    }

    confirmedShips.delete(selectedShip);
    ship.horizontal=!ship.horizontal;
    ship.cells=cells;
    ship.hits=[];
    savePlacement();
    render();
  }

  function confirmShip(){
    if(!placementActive())return;
    confirmedShips.add(selectedShip);

    const count=me().board.ships.length;
    let next=-1;
    for(let index=0;index<count;index++){
      if(!confirmedShips.has(index)){
        next=index;
        break;
      }
    }

    if(next>=0)selectedShip=next;
    render();
  }

  function randomiseFleet(){
    confirmedShips.clear();
    originalRandomise();
  }

  function startBattle(){
    if(confirmedShips.size!==fleet.length){
      showPlacementMessage('Press OK on every ship before starting the battle.');
      return;
    }
    originalReadyFleet();
  }

  buildBoard=function(board,view){
    originalBuildBoard(board,view);
    if(view!=='own'||!placementActive())return;

    const cells=$('mainBoard')?.children||[];
    Array.from(cells).forEach((button,index)=>{
      const shipIndex=shipAt(board,index);
      button.onclick=null;
      if(shipIndex>=0){
        if(shipIndex===selectedShip)button.classList.add('selected');
        if(confirmedShips.has(shipIndex))button.classList.add('confirmed');
        button.onclick=()=>{
          selectedShip=shipIndex;
          render();
        };
      }
    });
  };

  render=function(){
    originalRender();
    const active=placementActive();
    const tools=$('placementTools');
    const ready=$('readyShips');
    const allConfirmed=confirmedShips.size===fleet.length;

    if(tools)tools.classList.toggle('hidden',!active);
    if(ready){
      ready.disabled=!allConfirmed;
      ready.textContent=allConfirmed?'✅ Ready for battle':`Confirm ships (${confirmedShips.size}/${fleet.length})`;
    }

    if(active){
      const shipName=shipNames[selectedShip]||'ship';
      showPlacementMessage(allConfirmed
        ?'All ships are set. Press Ready for battle.'
        :`Move ${shipName} with the arrows, rotate if needed, then press OK. (${confirmedShips.size}/${fleet.length} set)`
      );
    }
  };

  const up=$('moveUp');
  const down=$('moveDown');
  const left=$('moveLeft');
  const right=$('moveRight');
  const ok=$('confirmShip');
  const rotate=$('rotateShip');
  const random=$('randomiseShips');
  const ready=$('readyShips');

  if(up)up.onclick=()=>moveBy(-1,0);
  if(down)down.onclick=()=>moveBy(1,0);
  if(left)left.onclick=()=>moveBy(0,-1);
  if(right)right.onclick=()=>moveBy(0,1);
  if(ok)ok.onclick=confirmShip;
  if(rotate)rotate.onclick=rotateShip;
  if(random)random.onclick=randomiseFleet;
  if(ready)ready.onclick=startBattle;

  const style=document.createElement('style');
  style.textContent=`
    .placement-tools{display:grid!important;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch}
    .placement-tools.hidden{display:none!important}
    .ship-controller{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(62px,82px));grid-template-rows:repeat(3,62px);justify-content:center;gap:8px}
    .ship-control{border:1px solid rgba(255,255,255,.24);border-radius:14px;background:#12364a;color:#fff;font-weight:900;font-size:25px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .ship-control:active{transform:translateY(2px);box-shadow:none}
    #moveUp{grid-column:2;grid-row:1}
    #moveLeft{grid-column:1;grid-row:2}
    #confirmShip{grid-column:2;grid-row:2;background:#169d63;font-size:18px}
    #moveRight{grid-column:3;grid-row:2}
    #moveDown{grid-column:2;grid-row:3}
    .rotate-control,#readyShips{grid-column:1/-1}
    #readyShips:disabled{opacity:.48;cursor:not-allowed}
    .cell.ship{cursor:pointer}
    .cell.ship.selected{outline:3px solid #ffd166;outline-offset:-3px;filter:brightness(1.25)}
    .cell.ship.confirmed:not(.selected){box-shadow:inset 0 0 0 3px rgba(62,220,139,.8)}
    @media(max-width:520px){.placement-tools{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
})();
