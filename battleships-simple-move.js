(()=>{
  const originalBuildBoard=buildBoard;

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
      if(shot)b.classList.add('shot',ship?'hit':'miss');
      if(sunk)b.classList.add('sunk');

      if(state.phase==='placement'&&view==='own'&&!state.players[myKey].ready){
        b.onclick=()=>{
          if(shipIndex>=0){
            if(shipIndex===selectedShip){
              rotateSelected();
            }else{
              selectedShip=shipIndex;
              render();
            }
          }else{
            moveSelected(i);
          }
        };
      }else if(view==='enemy'&&state.phase==='playing'&&state.turn===myKey&&!shot){
        b.onclick=()=>shoot(i);
      }

      el.appendChild(b);
    }
  };

  const originalRender=render;
  render=function(){
    originalRender();
    const me=state.players?.[myKey];
    if(state.phase==='placement'&&me&&!me.ready){
      $('message').textContent='Tap a ship to select it. Tap it again to rotate. Tap an empty square to move it.';
    }
  };

  const rotateButton=$('rotateShip');
  if(rotateButton)rotateButton.remove();

  const style=document.createElement('style');
  style.textContent=`
    .placement-tools{grid-template-columns:1fr 1fr!important}
    .cell.ship{cursor:pointer}
    .cell.ship.selected{outline:3px solid #ffd166;outline-offset:-3px;filter:brightness(1.25)}
    @media(max-width:520px){.placement-tools{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
})();
