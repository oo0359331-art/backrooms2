/* Backrooms Remastered gameplay pass — immersive controls, flashlight, sound feedback and survival HUD. */
(function(){
  'use strict';

  const S = {
    crouch:false,
    flashlightOn:true,
    battery:100,
    sprintDrainTimer:0,
    footstepTimer:0,
    audioCtx:null,
    flashlight:null,
    flashlightGlow:null,
    originalCameraY:null,
    targetCameraY:null,
    initialized:false,
    lastLevel:null
  };

  const q = id => document.getElementById(id);
  const safe = fn => { try { return fn(); } catch(e) {} };

  function style(){
    const s=document.createElement('style'); s.id='rm-gp-style'; s.textContent=`
      #rm-survival{position:fixed;left:18px;top:76px;z-index:32;display:none;color:#ddd;font:10px 'Courier New',monospace;letter-spacing:1px;text-shadow:0 2px 6px #000;pointer-events:none}
      #rm-battery{width:115px;height:7px;margin-top:5px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.45);overflow:hidden}
      #rm-battery-fill{height:100%;width:100%;background:#d8d1b4;transition:width .2s}
      #rm-crouch{position:fixed;right:18px;bottom:18px;z-index:45;display:none;width:86px;padding:9px 10px;background:rgba(0,0,0,.48);color:#eee;border:1px solid rgba(255,255,255,.35);border-radius:7px;font:700 11px 'Courier New',monospace;letter-spacing:1px}
      #rm-flashlight{position:fixed;right:18px;bottom:68px;z-index:45;display:none;width:110px;padding:8px 10px;background:rgba(0,0,0,.48);color:#eee;border:1px solid rgba(255,255,255,.35);border-radius:7px;font:700 10px 'Courier New',monospace;letter-spacing:1px}
      #rm-danger-edge{position:fixed;inset:0;z-index:17;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,transparent 35%,rgba(120,0,0,.18) 72%,rgba(160,0,0,.55));transition:opacity .18s}
      #rm-breath{position:fixed;left:50%;bottom:21px;transform:translateX(-50%);z-index:30;color:rgba(255,255,255,.55);font:9px 'Courier New',monospace;letter-spacing:2px;display:none;pointer-events:none;text-shadow:0 2px 5px #000}
      @media(max-width:650px){#rm-survival{left:10px;top:58px;font-size:9px}#rm-crouch,#rm-flashlight{display:block}}
    `; document.head.appendChild(s);
  }

  function dom(){
    if(q('rm-survival')) return;
    const h=document.createElement('div'); h.id='rm-survival'; h.innerHTML='<div>FLASHLIGHT <span id="rm-flash-state">ON</span></div><div id="rm-battery"><div id="rm-battery-fill"></div></div><div style="margin-top:6px">NOISE <span id="rm-noise">LOW</span></div>'; document.body.appendChild(h);
    const c=document.createElement('button'); c.id='rm-crouch'; c.textContent='CROUCH [C]'; document.body.appendChild(c);
    const f=document.createElement('button'); f.id='rm-flashlight'; f.textContent='FLASHLIGHT [F]'; document.body.appendChild(f);
    const edge=document.createElement('div'); edge.id='rm-danger-edge'; document.body.appendChild(edge);
    const breath=document.createElement('div'); breath.id='rm-breath'; breath.textContent='BREATHING HEAVY'; document.body.appendChild(breath);
    c.onclick=toggleCrouch; f.onclick=toggleFlashlight;
  }

  function audio(){
    if(!S.audioCtx) safe(()=>{ S.audioCtx=new (window.AudioContext||window.webkitAudioContext)(); });
    safe(()=>S.audioCtx && S.audioCtx.state==='suspended' && S.audioCtx.resume());
    return S.audioCtx;
  }

  function tone(freq,duration,volume,type){
    const ctx=audio(); if(!ctx) return;
    safe(()=>{ const o=ctx.createOscillator(), g=ctx.createGain(); o.type=type||'sine'; o.frequency.value=freq; g.gain.setValueAtTime(volume,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+duration); });
  }

  function ensureLight(){
    if(S.flashlight || !window.THREE || !window.camera) return;
    safe(()=>{
      S.flashlight=new THREE.SpotLight(0xfff4dd,2.4,32,Math.PI/6,.7,1.25);
      S.flashlight.position.set(0,.04,.1);
      window.camera.add(S.flashlight);
      S.flashlight.target.position.set(0,0,-8);
      window.camera.add(S.flashlight.target);
      S.flashlightGlow=new THREE.PointLight(0xffefcc,.08,4);
      S.flashlightGlow.position.set(0,.02,.1);
      window.camera.add(S.flashlightGlow);
    });
  }

  function setLight(on){
    S.flashlightOn=!!on;
    ensureLight();
    if(S.flashlight) S.flashlight.intensity=on?2.4:0;
    if(S.flashlightGlow) S.flashlightGlow.intensity=on?.08:0;
    const st=q('rm-flash-state'); if(st) st.textContent=on?'ON':'OFF';
    const btn=q('rm-flashlight'); if(btn) btn.textContent=on?'FLASHLIGHT [F]':'FLASHLIGHT OFF [F]';
  }

  function toggleFlashlight(){
    if(S.battery<=0){ tone(100,.12,.03,'square'); return; }
    setLight(!S.flashlightOn);
    tone(S.flashlightOn?420:180,.07,.018,'square');
  }

  function toggleCrouch(){
    S.crouch=!S.crouch;
    S.targetCameraY=S.crouch?.95:(S.originalCameraY||1.65);
    const b=q('rm-crouch'); if(b) b.textContent=S.crouch?'STAND [C]':'CROUCH [C]';
    tone(S.crouch?130:170,.05,.012,'triangle');
  }

  function noise(){
    const el=q('rm-noise'); if(!el) return;
    let n='LOW';
    try{
      if(typeof isSprinting!=='undefined' && isSprinting) n='HIGH';
      else if(S.crouch) n='VERY LOW';
      else if(typeof moveForward!=='undefined' && (moveForward||moveBackward||moveLeft||moveRight)) n='MED';
    }catch(e){}
    el.textContent=n;
  }

  function footstep(){
    const moving=safe(()=>typeof moveForward!=='undefined' && (moveForward||moveBackward||moveLeft||moveRight));
    if(!moving) return;
    tone(S.crouch?62:82,.055,S.crouch?.006:.012,'sine');
  }

  function updateBattery(dt){
    if(S.flashlightOn && S.battery>0){
      S.battery=Math.max(0,S.battery-dt*.85);
      if(S.battery===0) setLight(false);
    }
    const fill=q('rm-battery-fill'); if(fill) fill.style.width=S.battery+'%';
    if(fill) fill.style.opacity=S.battery<20?(.55+.45*Math.sin(performance.now()/120)):1;
  }

  function updateMovement(dt){
    try{
      if(!window.camera || !S.targetCameraY) return;
      const p=window.camera.position;
      p.y += (S.targetCameraY-p.y)*Math.min(1,dt*8);
      if(typeof isSprinting!=='undefined' && isSprinting && !S.crouch){
        S.sprintDrainTimer += dt;
        if(S.sprintDrainTimer>.12) S.sprintDrainTimer=0;
      }
    }catch(e){}
  }

  function updateDanger(){
    const edge=q('rm-danger-edge'); if(!edge) return;
    let danger=0;
    try{
      if(typeof entity!=='undefined' && entity && window.controls){
        const p=window.controls.getObject().position;
        if(entity.position) danger=Math.max(0,1-p.distanceTo(entity.position)/24);
      }
    }catch(e){}
    edge.style.opacity=String(Math.min(.72,danger*.72));
    if(q('rm-breath')) q('rm-breath').style.display=(typeof isSprinting!=='undefined' && isSprinting)?'block':'none';
  }

  function keys(){
    document.addEventListener('keydown',e=>{
      if(e.repeat) return;
      if(e.code==='KeyC' && !e.ctrlKey && !e.metaKey) toggleCrouch();
      if(e.code==='KeyF' && !e.ctrlKey && !e.metaKey) toggleFlashlight();
    });
    window.addEventListener('blur',()=>{ if(S.crouch){S.crouch=false;S.targetCameraY=S.originalCameraY||1.65; const b=q('rm-crouch'); if(b)b.textContent='CROUCH [C]';} });
  }

  function loop(){
    const now=performance.now();
    const dt=Math.min(.05,(now-(S.lastLevel===null?now:loop.last))/1000)||0;
    loop.last=now;
    let active=false; safe(()=>{ active=typeof gameActive!=='undefined'&&gameActive; });
    if(active){
      ensureLight();
      updateBattery(dt);
      updateMovement(dt);
      noise();
      S.footstepTimer-=dt;
      if(S.footstepTimer<=0){ const moving=safe(()=>typeof moveForward!=='undefined'&&(moveForward||moveBackward||moveLeft||moveRight)); if(moving){footstep(); S.footstepTimer=S.crouch?.72:.46;} else S.footstepTimer=.1; }
      updateDanger();
      const ui=q('rm-survival'); if(ui) ui.style.display='block';
    }else{
      const ui=q('rm-survival'); if(ui) ui.style.display='none';
      const edge=q('rm-danger-edge'); if(edge) edge.style.opacity='0';
      if(q('rm-breath')) q('rm-breath').style.display='none';
    }
    requestAnimationFrame(loop);
  }

  function init(){
    if(S.initialized) return; S.initialized=true;
    style(); dom(); keys();
    setTimeout(()=>{ safe(()=>{ S.originalCameraY=window.camera?.position?.y||1.65; S.targetCameraY=S.originalCameraY; }); },1200);
    loop();
  }

  window.addEventListener('load',()=>setTimeout(init,300));
})();
