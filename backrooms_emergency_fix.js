/* Backrooms emergency stability fix: prevent startup freezes by throttling streamed chunks and reducing light/GPU load. */
(function(){
'use strict';
let installed=false,oldUpdate=null,oldAdd=null,oldStart=null;
let lastCx=null,lastCz=null,lastWorldRun=0;
function optimizeGraphics(){
  try{
    if(typeof renderer!=='undefined'&&renderer) renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.1));
    if(typeof scene==='undefined'||!scene)return;
    let totalPoint=0;
    const overlay=scene.getObjectByName('LEVEL_VISUAL_OVERHAUL');
    if(overlay){
      let kept=0;
      overlay.traverse(o=>{
        if(o&&o.isLight){
          if(o.type==='PointLight'){
            kept++;
            if(kept>24){o.visible=false;o.intensity=0;}
          }
        }
      });
    }
    scene.traverse(o=>{
      if(o&&o.isLight&&o.type==='PointLight'){
        totalPoint++;
        if(totalPoint>40){o.visible=false;o.intensity=0;}
      }
    });
  }catch(_){ }
}
function patchChunks(){
  if(typeof window.addInfiniteChunk!=='function'||window.__brEmergencyChunkPatch)return;
  oldAdd=window.addInfiniteChunk;
  window.addInfiniteChunk=function(cx,cz,mat,level){
    try{
      if(typeof loadedChunks!=='undefined'&&loadedChunks && !loadedChunks.has(`${cx},${cz}`) && loadedChunks.size>=12) return;
    }catch(_){ }
    return oldAdd.apply(this,arguments);
  };
  window.__brEmergencyChunkPatch=true;
}
function patchWorld(){
  if(typeof window.updateInfiniteWorld!=='function'||window.__brEmergencyWorldPatch)return;
  oldUpdate=window.updateInfiniteWorld;
  window.updateInfiniteWorld=function(force){
    const now=performance.now();
    try{
      if(typeof controls!=='undefined'&&controls){
        const p=controls.getObject().position;
        const cx=Math.floor(p.x/CHUNK_SIZE),cz=Math.floor(p.z/CHUNK_SIZE);
        const moved=cx!==lastCx||cz!==lastCz;
        if(!moved && now-lastWorldRun<350) return;
        lastCx=cx;lastCz=cz;
      }
    }catch(_){ }
    lastWorldRun=now;
    // Always let the original function use its own chunk-change guard.
    try{return oldUpdate.call(this,false);}catch(e){console.warn('Backrooms world update:',e)}
  };
  window.__brEmergencyWorldPatch=true;
}
function patchStart(){
  if(typeof window.startGame!=='function'||window.__brEmergencyStartPatch)return;
  oldStart=window.startGame;
  window.startGame=function(mode){
    oldStart.apply(this,arguments);
    setTimeout(optimizeGraphics,120);
    setTimeout(optimizeGraphics,900);
  };
  window.__brEmergencyStartPatch=true;
}
function boot(){
  if(installed)return;
  patchChunks();patchWorld();patchStart();
  optimizeGraphics();
  if(window.__brEmergencyChunkPatch&&window.__brEmergencyWorldPatch&&window.__brEmergencyStartPatch) installed=true;
  else setTimeout(boot,120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
