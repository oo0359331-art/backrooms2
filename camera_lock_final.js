/* Final camera guard: UI clicks never hijack the mouse, but starting the game still locks normally. */
(function(){
  'use strict';
  let done=false, oldStart=null, oldLock=null, oldUnlock=null;
  const uiTarget=el=>!!(el&&el.closest&&el.closest('button,input,select,textarea,#chat-panel,#inventory-panel,#emote-panel,#start-screen,#win-screen,#view-toggle'));
  function boot(){
    if(done) return;
    if(typeof controls==='undefined'||!controls||typeof window.startGame!=='function') return setTimeout(boot,120);
    oldLock=controls.lock.bind(controls);
    oldUnlock=controls.unlock.bind(controls);
    controls.lock=function(){
      if(window.__brAllowNextLock){window.__brAllowNextLock=false;return oldLock();}
      const active=document.activeElement;
      if(uiTarget(active)) return;
      return oldLock();
    };
    controls.unlock=function(){
      if(window.__brSuppressUiUnlock){return;}
      return oldUnlock();
    };
    oldStart=window.startGame;
    window.startGame=function(mode){window.__brAllowNextLock=true;return oldStart.apply(this,arguments);};
    document.addEventListener('pointerdown',e=>{
      if(uiTarget(e.target)){
        window.__brSuppressUiUnlock=true;
        setTimeout(()=>{window.__brSuppressUiUnlock=false;},120);
      }
    },true);
    done=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
