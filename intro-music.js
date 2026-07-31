(()=>{
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('intro-music-core.js').then(()=>load('netflix-home.js')).catch(error=>console.error('Could not load homepage enhancements.',error));
})();