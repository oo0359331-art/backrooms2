/* Backrooms Remastered horror pass — procedural flicker, ambience and subtle reality glitches. */
(function(){
  'use strict';
  const H={nextFlicker:0,lastWhisper:0,audio:null,active:false};
  const q=id=>document.getElementById(id);
  const safe=fn=>{try{return fn();}catch(e){}};
  function audio(){if(!H.audio)safe(()=>H.audio=new(window.AudioContext||window.webkitAudioContext)());safe(()=>H.audio&&H.audio.state==='suspended'&&H.audio.resume());return H.audio;}
  function tone(f,d,v,type='sine'){const c=audio();if(!c)return;safe(()=>{const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+d);});}
  function flicker(){
    if(typeof scene==='undefined'||!scene.children)return;
    const lights=[];scene.traverse(o=>{if(o.isPointLight||o.isSpotLight)lights.push(o);});
    if(!lights.length)return;
    const pick=lights[Math.floor(Math.random()*lights.length)],old=pick.intensity;
    pick.intensity*=.12;tone(58,.045,.005,'square');
    setTimeout(()=>safe(()=>{pick.intensity=old*.55;}),55);
    setTimeout(()=>safe(()=>{pick.intensity=old;}),130+Math.random()*170);
  }
  function whisper(){
    if(!audio())return;
    const c=H.audio,now=c.currentTime;
    safe(()=>{
      const o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(180+Math.random()*80,now);o.frequency.exponentialRampToValueAtTime(95,now+.55);f.type='lowpass';f.frequency.value=620;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.018,now+.14);g.gain.exponentialRampToValueAtTime(.0001,now+.58);o.connect(f).connect(g).connect(c.destination);o.start(now);o.stop(now+.6);
    });
  }
  function glitch(){
    const grade=q('rm-grade');if(!grade)return;grade.style.opacity='.75';setTimeout(()=>{if(grade)grade.style.opacity='.42';},120);
    const flash=q('rm-flash');if(flash){flash.style.background='#b9a34c';flash.style.opacity='.08';setTimeout(()=>{if(flash)flash.style.opacity='0';},110);}
  }
  function loop(){
    const active=safe(()=>typeof gameActive!=='undefined'&&gameActive);
    const now=performance.now();
    if(active){
      if(now>=H.nextFlicker){
        H.nextFlicker=now+(Math.random()<.16?900:3500+Math.random()*7500);
        if(Math.random()<.72)flicker();
      }
      if(now-H.lastWhisper>9000+Math.random()*14000){H.lastWhisper=now;if(Math.random()<.35)whisper();}
      if(Math.random()<.0025)glitch();
    }
    requestAnimationFrame(loop);
  }
  function init(){
    document.addEventListener('pointerdown',()=>audio(),{once:true,passive:true});
    loop();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
