/* First-person camera comfort fix: reduce sensitivity, remove unwanted UI re-locks, keep mouse look clean. */
(function(){
  'use strict';
  let bound=false;
  function boot(){
    if(typeof controls==='undefined' || !controls) return setTimeout(boot,120);
    if(bound) return;
    bound=true;
    try{
      controls.pointerSpeed=0.55;
      controls.minPolarAngle=0.12;
      controls.maxPolarAngle=Math.PI-0.12;
    }catch(_){ }
    try{
      camera.fov=78;
      camera.updateProjectionMatrix();
    }catch(_){ }
    document.addEventListener('click',function(e){
      const ui=e.target && (e.target.closest('button,input,select,#chat-panel,#inventory-panel,#emote-panel,#start-screen'));
      if(ui && typeof gameActive!=='undefined' && gameActive && controls && controls.isLocked){
        setTimeout(()=>{try{controls.unlock();}catch(_){ }},0);
      }
    },false);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
