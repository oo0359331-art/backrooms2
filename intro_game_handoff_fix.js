/* Backrooms Remastered — make intro Skip/Enter launch the actual selected game. */
(function(){
  'use strict';

  const LEVEL_NAMES={
    '0':'LEVEL 0 // THE YELLOW ROOMS',
    '1':'LEVEL 1 // HABITABLE ZONE',
    '2':'LEVEL 37 // THE POOLROOMS',
    'x6':'LEVEL 6 // TERROR HOTEL',
    'x14':'LEVEL 14 // FLOODED OFFICES',
    'x9':'LEVEL 9 // SERVICE TUNNELS',
    'x21':'LEVEL 21 // ENDLESS ARCHIVE',
    'x37b':'LEVEL 37B // DEEP POOLS',
    'x3999':'LEVEL 3999 // QUIET GARDEN'
  };

  function q(id){return document.getElementById(id)}
  function selected(){
    const visible=q('br-level');
    const hidden=q('level-select');
    return String((visible&&visible.value)||(hidden&&hidden.value)||window.__backroomsSelectedLevel||'1');
  }
  function sync(){
    const id=selected();
    window.__backroomsSelectedLevel=id;
    const hidden=q('level-select');
    if(hidden && hidden.value!==id){hidden.value=id;hidden.dispatchEvent(new Event('change',{bubbles:true}));}
    const label=LEVEL_NAMES[id]||('LEVEL '+id);
    const loc=q('rm-intro-location');
    if(loc)loc.textContent=label;
    return id;
  }
  function modeFromPending(){
    const pending=q('rm-intro')?.dataset.pending||'solo-btn';
    return pending==='host-btn'?'host':pending==='join-btn'?'guest':'solo';
  }
  function launch(){
    const id=sync();
    const mode=modeFromPending();
    const intro=q('rm-intro');
    const start=q('start-screen');
    try{
      if(intro){intro.style.display='none';intro.dataset.pending='';}
      if(start){start.style.visibility='hidden';start.style.display='none';}
      if(typeof window.startGame==='function'){
        window.startGame(mode);
      }else if(typeof startGame==='function'){
        startGame(mode);
      }
    }catch(e){
      if(start){start.style.visibility='visible';start.style.display='flex';}
      if(intro)intro.style.display='flex';
      if(typeof showToast==='function')showToast('GAME LAUNCH ERROR — RELOAD THE PAGE',2600);
      console.error(e);
    }
  }
  function patch(){
    const next=q('rm-next'),skip=q('rm-skip');
    if(!next||!skip||typeof window.startGame!=='function')return false;

    if(!next.dataset.gameLaunchPatched){
      next.dataset.gameLaunchPatched='1';
      next.onclick=function(){
        // The last intro page is the handoff into the real selected level.
        const title=(q('rm-intro-title')?.textContent||'').toUpperCase();
        if(title==='ENTER.' || next.textContent.trim()==='ENTER LEVEL 0') launch();
        else {
          // Preserve the existing chapter progression until the final page.
          if(window.BackroomsRemastered?.openIntro){}
          const ev=document.createEvent('Event');ev.initEvent('rm:continue',true,true);
          document.dispatchEvent(ev);
        }
      };
    }
    if(!skip.dataset.gameLaunchPatched){
      skip.dataset.gameLaunchPatched='1';
      skip.onclick=function(){launch();};
    }

    for(const id of ['br-solo','br-create','br-join','br-continue']){
      const b=q(id);if(!b||b.dataset.levelPreviewPatched)continue;
      b.dataset.levelPreviewPatched='1';
      b.addEventListener('pointerdown',sync,{capture:true});
      b.addEventListener('click',sync,{capture:true});
    }
    sync();
    return true;
  }

  function boot(){
    if(!patch())return setTimeout(boot,120);
    setInterval(patch,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
