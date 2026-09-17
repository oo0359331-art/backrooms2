/* Final camera lock guard: UI clicks never hijack the mouse, but starting the game still locks normally. */
(function(){
  'use strict';
  let done=false, oldStart=null, oldLock=null;
  const uiTarget=el=>!!(el&&el.closest&&el.closest('button,input,select,textarea,#chat-panel,#inventory-panel,#emote-panel,#start-screen,#win-screen'));
  function boot(){
    if(done) return;
    if(typeof controls==='undefined'||!controls||typeof window.startGame!=='function') return setTimeout(boot,120);
    oldLock=controls.lock.bind(controls);
    controls.lock=function(){
      if(window.__brAllowNextLock){window.__brAllowNextLock=false;return oldLock();}
      const active=document.activeElement;
      if(uiTarget(active)) return;
      return oldLock();
    };
    oldStart=window.startGame;
    window.startGame=function(mode){window.__brAllowNextLock=true;return oldStart.apply(this,arguments);};
    done=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
