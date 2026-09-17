/* Backrooms Remastered — make intro Skip/Enter hand off to the actual selected game. */
(function(){
  'use strict';
  const LEVEL_NAMES={
    '0':'LEVEL 0 // THE YELLOW ROOMS','1':'LEVEL 1 // HABITABLE ZONE','2':'LEVEL 37 // THE POOLROOMS',
    'x6':'LEVEL 6 // TERROR HOTEL','x14':'LEVEL 14 // FLOODED OFFICES','x9':'LEVEL 9 // SERVICE TUNNELS',
    'x21':'LEVEL 21 // ENDLESS ARCHIVE','x37b':'LEVEL 37B // DEEP POOLS','x3999':'LEVEL 3999 // QUIET GARDEN'
  };
  const q=id=>document.getElementById(id);
  function selected(){
    const visible=q('br-level'),hidden=q('level-select');
    return String((visible&&visible.value)||(hidden&&hidden.value)||window.__backroomsSelectedLevel||'1');
  }
  function sync(){
    const id=selected(); window.__backroomsSelectedLevel=id;
    const hidden=q('level-select');
    if(hidden&&hidden.value!==id){hidden.value=id;hidden.dispatchEvent(new Event('change',{bubbles:true}));}
    const loc=q('rm-intro-location'); if(loc)loc.textContent=LEVEL_NAMES[id]||('LEVEL '+id);
    return id;
  }
  function hideMenuAfterLaunch(){
    setTimeout(()=>{
      const start=q('start-screen');
      if(typeof gameActive!=='undefined'&&gameActive&&start){start.style.visibility='hidden';start.style.display='none';}
    },40);
  }
  function loadScript(id,src,flag){
    if(window[flag]||document.getElementById(id)) return;
    const script=document.createElement('script');
    script.id=id; script.src=src; script.async=false;
    script.onload=()=>{window[flag]=true;};
    script.onerror=()=>{console.warn(src+' could not be loaded.');};
    document.body.appendChild(script);
  }
  function loadEnhancements(){
    loadScript('hollow-purple-script','./hollow_purple.js','__hollowPurpleLoaded');
    loadScript('playability-upgrade-script','./playability_upgrade.js','__playabilityUpgradeLoaded');
    loadScript('level-progression-script','./level_progression.js','__levelProgressionLoaded');
    loadScript('level-visual-overhaul-script','./level_visual_overhaul.js','__levelVisualOverhaulLoaded');
    loadScript('camera-comfort-script','./camera_comfort_fix.js','__cameraComfortLoaded');
  }
  function patch(){
    const next=q('rm-next'),skip=q('rm-skip');
    if(!next||!skip||typeof window.startGame!=='function')return false;

    if(!next.dataset.launchHandoffPatched){
      const old=next.onclick;
      next.onclick=function(e){
        sync();
        if(typeof old==='function')old.call(this,e);
        hideMenuAfterLaunch();
      };
      next.dataset.launchHandoffPatched='1';
    }
    if(!skip.dataset.launchHandoffPatched){
      const old=skip.onclick;
      skip.onclick=function(e){
        sync();
        if(typeof old==='function')old.call(this,e);
        hideMenuAfterLaunch();
      };
      skip.dataset.launchHandoffPatched='1';
    }

    for(const id of ['br-solo','br-create','br-join','br-continue']){
      const b=q(id);if(!b||b.dataset.levelPreviewPatched)continue;
      b.dataset.levelPreviewPatched='1';
      b.addEventListener('pointerdown',sync,{capture:true});
      b.addEventListener('click',sync,{capture:true});
    }
    sync(); return true;
  }
  function boot(){loadEnhancements();if(!patch())return setTimeout(boot,120);setInterval(patch,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
