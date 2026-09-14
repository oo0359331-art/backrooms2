/* Backrooms Remastered — stability and level-selection hotfix. */
(function(){
  'use strict';
  function boot(){
    const sel=document.getElementById('level-select');
    if(!sel || typeof window.startGame!=='function') return setTimeout(boot,120);

    if(!window.__backroomsStartWrapped){
      const originalStartGame=window.startGame;
      window.startGame=function(mode){
        try{
          const value=sel.value;
          sel.dispatchEvent(new Event('change',{bubbles:true}));
          window.__backroomsSelectedLevel=value;
        }catch(e){}
        return originalStartGame.call(this,mode);
      };
      window.__backroomsStartWrapped=true;
    }

    // The core loop was forcing a procedural-world scan every rendered frame.
    // Let the existing chunk updater run only when the player changes chunks.
    if(typeof window.updateInfiniteWorld==='function' && !window.__backroomsWorldWrapped){
      const originalUpdate=window.updateInfiniteWorld;
      window.updateInfiniteWorld=function(force){
        return originalUpdate.call(this,false);
      };
      window.__backroomsWorldWrapped=true;
    }

    // The dedicated custom-level builder already supplies geometry for these levels.
    // Hide the extra architecture overlay there to avoid rendering duplicate rooms.
    if(!window.__backroomsPerfLoop){
      window.__backroomsPerfLoop=setInterval(()=>{
        try{
          const g=scene && scene.getObjectByName('LEVEL_ARCHITECTURE_REMODEL');
          if(!g || !sel) return;
          const id=String(sel.value||'');
          g.visible=(id==='1'||id==='2'||id==='x37b');
        }catch(e){}
      },220);
    }

    if(window.__backroomsPerfBadge)return;
    window.__backroomsPerfBadge=true;
    const style=document.createElement('style');
    style.textContent='#level-select{will-change:auto}';
    document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
