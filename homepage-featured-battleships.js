(()=>{
  const moveBattleships=()=>{
    const featureRow=document.querySelector('.feature-cards');
    const existing=document.querySelector('.battleships-card');
    if(!featureRow||!existing)return false;
    if(existing.parentElement!==featureRow)featureRow.appendChild(existing);
    existing.classList.add('featured-battleships');
    if(!existing.querySelector('.card-badge')){
      const badge=document.createElement('span');
      badge.className='card-badge live';
      badge.textContent='PLAY NOW';
      existing.prepend(badge);
    }
    const copy=existing.querySelector('.poster-copy small');
    if(copy)copy.textContent='Solo or multiplayer naval battle';
    return true;
  };
  if(!moveBattleships()){
    const timer=setInterval(()=>{if(moveBattleships())clearInterval(timer)},100);
    setTimeout(()=>clearInterval(timer),5000);
  }
})();