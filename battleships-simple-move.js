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

  function isFree(cells){
    if(!cells)return false;
    return !me().board.ships.some((other,index)=>
      index!==selectedShip&&other.cells.some(cell=>cells.includes(cell))
    );
  }

  function applyShipPosition(ship,cells,horizontal){
    confirmedShips.delete(selectedShip);
    ship.cells=cells;
    ship.horizontal=horizontal;
    ship.hits=[];
    me().board.shots=[];
    savePlacement();
    render();
  }

  function moveBy(rowChange,columnChange){
    if(!placementActive())return;
    const ship=currentShip();
    if(!ship)return;

    const anchor=Math.min(...ship.cells);
    const row=Math.floor(anchor/size)+rowChange;
    const column=(anchor%size)+columnChange;
    if(row<0||column<0){
      showPlacementMessage('That ship cannot move any further.');
      return;
    }

    const start=row*size+column;
    const cells=candidateCells(start,ship.cells.length,ship.horizontal);
    if(!cells){
      showPlacementMessage('That ship cannot move any further.');
      return;
    }
    if(!isFree(cells)){
      showPlacementMessage('Ships cannot overlap.');
      return;
    }

    applyShipPosition(ship,cells,ship.horizontal);
  }

  function rotateSelectedShip(){
    if(!placementActive())return;
    const ship=currentShip();
    if(!ship)return;

    const newHorizontal=!ship.horizontal;
    const oldRows=ship.cells.map(cell=>Math.floor(cell/size));
    const oldColumns=ship.cells.map(cell=>cell%size);
    const centreRow=Math.round((Math.min(...oldRows)+Math.max(...oldRows))/2);
    const centreColumn=Math.round((Math.min(...oldColumns)+Math.max(...oldColumns))/2);

    const preferredRow=newHorizontal?centreRow:centreRow-Math.floor((ship.cells.length-1)/2);
    const preferredColumn=newHorizontal?centreColumn-Math.floor((ship.cells.length-1)/2):centreColumn;

    const candidates=[];
    for(let distance=0;distance<size;distance++){
      for(let rowOffset=-distance;rowOffset<=distance;rowOffset++){
        for(let columnOffset=-distance;columnOffset<=distance;columnOffset++){
          if(Math.max(Math.abs(rowOffset),Math.abs(columnOffset))!==distance)continue;
          const row=preferredRow+rowOffset;
          const column=preferredColumn+columnOffset;
          if(row<0||column<0||row>=size||column>=size)continue;
          candidates.push(row*size+column);
        }
      }
    }

    const validStart=candidates.find(start=>{
      const cells=candidateCells(start,ship.cells.length,newHorizontal);
      return cells&&isFree(cells);
    });

    if(validStart===undefined){
      showPlacementMessage('There is no clear space to rotate this ship. Move it away from the other ships first.');
      return;
    }

    applyShipPosition(ship,candidateCells(validStart,ship.cells.length,newHorizontal),newHorizontal);
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
    const board=$('mainBoard');
    const boardCard=board?.closest('.board-card');
    const allConfirmed=confirmedShips.size===fleet.length;

    if(tools)tools.classList.toggle('hidden',!active);
    if(board)board.classList.toggle('placement-board',active);
    if(boardCard)boardCard.classList.toggle('placement-card',active);

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

  $('moveUp')?.addEventListener('click',()=>moveBy(-1,0));
  $('moveDown')?.addEventListener('click',()=>moveBy(1,0));
  $('moveLeft')?.addEventListener('click',()=>moveBy(0,-1));
  $('moveRight')?.addEventListener('click',()=>moveBy(0,1));
  $('confirmShip')?.addEventListener('click',confirmShip);
  $('rotateShip')?.addEventListener('click',rotateSelectedShip);
  $('randomiseShips')?.addEventListener('click',randomiseFleet);
  $('readyShips')?.addEventListener('click',startBattle);

  const style=document.createElement('style');
  style.textContent=`
    .placement-tools{display:grid!important;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch}
    .placement-tools.hidden{display:none!important}
    .placement-card{width:min(76vw,360px);margin-left:auto;margin-right:auto;padding:7px}
    .placement-board{width:100%;max-width:340px;margin:0 auto}
    .ship-controller{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,58px);grid-template-rows:repeat(3,52px);justify-content:center;gap:6px}
    .ship-control{border:1px solid rgba(255,255,255,.24);border-radius:12px;background:#12364a;color:#fff;font-weight:900;font-size:22px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .ship-control:active{transform:translateY(2px);box-shadow:none}
    #moveUp{grid-column:2;grid-row:1}
    #moveLeft{grid-column:1;grid-row:2}
    #confirmShip{grid-column:2;grid-row:2;background:#169d63;font-size:16px}
    #moveRight{grid-column:3;grid-row:2}
    #moveDown{grid-column:2;grid-row:3}
    .rotate-control,#readyShips{grid-column:1/-1}
    #readyShips:disabled{opacity:.48;cursor:not-allowed}
    .cell.ship{cursor:pointer}
    .cell.ship.selected{outline:3px solid #ffd166;outline-offset:-3px;filter:brightness(1.25)}
    .cell.ship.confirmed:not(.selected){box-shadow:inset 0 0 0 3px rgba(62,220,139,.8)}
    @media(max-width:520px){
      .placement-tools{grid-template-columns:1fr!important}
      .placement-card{width:min(72vw,300px)}
      .placement-board{max-width:286px}
    }
  `;
  document.head.appendChild(style);
})();
