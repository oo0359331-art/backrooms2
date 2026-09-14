/* Performance pass: adaptive resolution, mobile-friendly effects, and low-overhead frame monitoring. */
(function(){
'use strict';
function boot(){
  if(typeof THREE==='undefined'||typeof renderer==='undefined'||typeof scene==='undefined') return setTimeout(boot,100);

  const mobile=!!window.isMobileMode || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const native=Math.max(1,Math.min(window.devicePixelRatio||1, mobile?1.35:1.75));
  let pixelRatio=native;
  let samples=0,total=0,last=performance.now(),lastAdjust=last;

  function apply(){
    pixelRatio=Math.max(0.75,Math.min(native,pixelRatio));
    renderer.setPixelRatio(pixelRatio);
    if(renderer.shadowMap){
      renderer.shadowMap.autoUpdate=true;
      if(renderer.shadowMap.type!==THREE.BasicShadowMap && mobile) renderer.shadowMap.type=THREE.BasicShadowMap;
    }
  }
  apply();

  /* The grain overlay is expensive on some mobile GPUs and adds little gameplay value. */
  const grain=[...document.querySelectorAll('div')].find(x=>x.style && String(x.style.backgroundImage).includes('fractalNoise'));
  if(grain && mobile) grain.style.display='none';

  /* Keep realism, but avoid rendering a huge off-screen CSS layer on small devices. */
  const fx=document.getElementById('realism-fx');
  if(fx && mobile) fx.style.boxShadow='inset 0 0 70px rgba(0,0,0,.62)';

  let lastFrame=performance.now();
  function frame(){
    const now=performance.now(),dt=now-lastFrame; lastFrame=now;
    if(dt>0 && dt<250){samples++;total+=dt;}
    if(now-lastAdjust>3000 && samples>=30){
      const avg=total/samples;
      if(avg>24 && pixelRatio>0.8) pixelRatio-=0.15;
      else if(avg<15 && pixelRatio<native) pixelRatio+=0.10;
      apply(); samples=0; total=0; lastAdjust=now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.__backroomsPerformance={mobile,getPixelRatio:()=>pixelRatio};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
