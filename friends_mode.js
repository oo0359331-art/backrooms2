/* Backrooms Friends Mode — 1P/3P camera, flashlight, crouch, party pings, friend compass, proximity HUD, and safer camera behavior. */
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  let thirdPerson=false, crouching=false, flashlightOn=false;
  let localAvatar=null, flashlight=null, flashlightTarget=null, ui=null;
  let pingMeshes=[], pingSeq=0, bound=false, netPatched=false, lastPartyTick=0;
  let oldTryMove=null;

  function addStyle(){
    if(q('friends-mode-style')) return;
    const s=document.createElement('style'); s.id='friends-mode-style';
    s.textContent=`
      #friends-hud{position:fixed;top:16px;left:16px;z-index:88;display:none;pointer-events:none;color:#fff;font:700 12px/1.35 'Courier New',monospace;text-shadow:0 2px 4px #000}
      #friends-hud .card{background:rgba(0,0,0,.48);border:1px solid rgba(255,255,255,.28);border-radius:9px;padding:9px 11px;backdrop-filter:blur(4px);margin-bottom:6px;min-width:205px}
      #friends-hud .title{color:#ffe36a;letter-spacing:1px;margin-bottom:3px}
      #view-toggle{position:fixed;right:18px;top:16px;z-index:91;display:none;width:auto;min-width:92px;padding:9px 12px;border:1px solid rgba(255,255,255,.42);background:rgba(0,0,0,.55);color:#fff;border-radius:9px;font:800 12px 'Courier New',monospace;cursor:pointer}
      #party-direction{position:fixed;left:50%;top:52px;transform:translateX(-50%);z-index:88;display:none;padding:6px 10px;border-radius:999px;background:rgba(0,0,0,.45);border:1px solid rgba(127,255,212,.32);color:#dffff3;font:800 12px 'Courier New',monospace;pointer-events:none;text-shadow:0 2px 5px #000}
      #friends-help{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:88;display:none;padding:7px 10px;border-radius:8px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.16);color:#ddd;font:700 11px 'Courier New',monospace;pointer-events:none;text-align:center}
    `;
    document.head.appendChild(s);
  }

  function setupUI(){
    addStyle();
    if(ui) return;
    ui=document.createElement('div'); ui.id='friends-hud';
    ui.innerHTML=`<div class="card"><div class="title">PARTY</div><div id="friends-count">FRIENDS: 1</div><div id="friends-near">NO FRIEND NEARBY</div></div><div class="card"><div class="title">SURVIVOR GEAR</div><div id="friends-gear">🔦 FLASHLIGHT OFF • 🧍 STANDING • 👁 1P</div></div>`;
    document.body.appendChild(ui);
    const b=document.createElement('button'); b.id='view-toggle'; b.textContent='VIEW: 1P'; b.addEventListener('click',()=>toggleView()); document.body.appendChild(b);
    const dir=document.createElement('div'); dir.id='party-direction'; document.body.appendChild(dir);
    const help=document.createElement('div'); help.id='friends-help'; help.innerHTML='V = 1P / 3P &nbsp; F = FLASHLIGHT &nbsp; C = CROUCH &nbsp; Q = PARTY PING'; document.body.appendChild(help);
  }

  function toast(text,ms=1500){ if(typeof showToast==='function') showToast(text,ms); }

  function avatarMesh(){
    const g=new THREE.Group(); g.name='LOCAL_FRIEND_AVATAR';
    const color=new THREE.Color(typeof playerColor!=='undefined' ? playerColor : 0x4e7bd9);
    const bodyMat=new THREE.MeshStandardMaterial({color:color.getHex(),roughness:.75});
    const skin=new THREE.MeshStandardMaterial({color:0xf0c7a4,roughness:.95});
    const dark=new THREE.MeshStandardMaterial({color:0x242020,roughness:.9});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,1.05,12),bodyMat); body.position.y=1.04; g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.33,14,12),skin); head.position.y=1.78; g.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.345,14,8,0,Math.PI*2,0,Math.PI*.5),dark); hair.position.y=1.87; g.add(hair);
    for(const x of [-.11,.11]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),dark);eye.position.set(x,1.82,-.31);g.add(eye);}
    for(const x of [-.18,.18]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.12,.14,.72,8),dark);leg.position.set(x,.42,0);g.add(leg);}
    g.visible=false;
    return g;
  }

  function setupAvatar(){
    if(localAvatar || typeof controls==='undefined' || !controls) return;
    localAvatar=avatarMesh();
    controls.getObject().add(localAvatar);
  }

  function setCameraMode(third){
    thirdPerson=!!third;
    setupAvatar();
    if(!thirdPerson){
      camera.position.set(0,crouching?1.02:1.6,0);
      if(localAvatar) localAvatar.visible=false;
    }else{
      camera.position.set(0,2.45,5.6);
      if(localAvatar) localAvatar.visible=true;
      camera.rotation.x=0;
    }
    const b=q('view-toggle'); if(b) b.textContent=thirdPerson?'VIEW: 3P':'VIEW: 1P';
    const gear=q('friends-gear'); if(gear) gear.textContent=`${flashlightOn?'🔦 FLASHLIGHT ON':'🔦 FLASHLIGHT OFF'} • ${crouching?'🧎 CROUCHED':'🧍 STANDING'} • ${thirdPerson?'👁 3P':'👁 1P'}`;
    try{localStorage.setItem('backrooms_camera_mode',thirdPerson?'3':'1');}catch(_){ }
  }

  function toggleView(){ setCameraMode(!thirdPerson); toast(thirdPerson?'Third-person camera':'First-person camera',900); }

  function setupFlashlight(){
    if(flashlight || typeof camera==='undefined') return;
    flashlightTarget=new THREE.Object3D(); flashlightTarget.position.set(0,0,-8); camera.add(flashlightTarget);
    flashlight=new THREE.SpotLight(0xffffee,0,24,Math.PI*.26,.45,1.3);
    flashlight.position.set(0,.02,-.25); camera.add(flashlight); flashlight.target=flashlightTarget;
  }
  function toggleFlashlight(){
    setupFlashlight(); flashlightOn=!flashlightOn; if(flashlight) flashlight.intensity=flashlightOn?3.4:0;
    const gear=q('friends-gear'); if(gear) gear.textContent=`${flashlightOn?'🔦 FLASHLIGHT ON':'🔦 FLASHLIGHT OFF'} • ${crouching?'🧎 CROUCHED':'🧍 STANDING'} • ${thirdPerson?'👁 3P':'👁 1P'}`;
    toast(flashlightOn?'Flashlight ON':'Flashlight OFF',700);
  }

  function setCrouch(on){
    crouching=!!on;
    if(!thirdPerson) camera.position.y=crouching?1.02:1.6;
    if(localAvatar) localAvatar.scale.y=crouching?.74:1;
    const gear=q('friends-gear'); if(gear) gear.textContent=`${flashlightOn?'🔦 FLASHLIGHT ON':'🔦 FLASHLIGHT OFF'} • ${crouching?'🧎 CROUCHED':'🧍 STANDING'} • ${thirdPerson?'👁 3P':'👁 1P'}`;
  }
  function toggleCrouch(){ setCrouch(!crouching); toast(crouching?'Crouch':'Stand',650); }

  function wrapMovement(){
    if(oldTryMove || typeof window.tryMovePlayer!=='function') return;
    oldTryMove=window.tryMovePlayer;
    const fn=function(dx,dz,steps){ const mult=crouching?.58:1; return oldTryMove.call(this,dx*mult,dz*mult,steps); };
    fn.__friendsWrapped=true; window.tryMovePlayer=tryMovePlayer=fn;
  }

  function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
  function friendData(){
    const arr=[]; if(typeof remotePlayers==='undefined') return arr;
    const p=controls.getObject().position;
    for(const r of remotePlayers.values()) arr.push({r,d:distance(p,r.position),name:r.userData.name||'Friend'});
    arr.sort((a,b)=>a.d-b.d); return arr;
  }

  function updateHud(){
    if(!ui) return;
    ui.style.display=(typeof gameActive!=='undefined'&&gameActive)?'block':'none';
    const b=q('view-toggle'); if(b) b.style.display=(typeof gameActive!=='undefined'&&gameActive)?'block':'none';
    const help=q('friends-help'); if(help) help.style.display=(typeof gameActive!=='undefined'&&gameActive)?'block':'none';
    const count=1+(typeof remotePlayers!=='undefined'?remotePlayers.size:0);
    const c=q('friends-count'); const n=q('friends-near');
    if(c) c.textContent=`FRIENDS: ${count}`;
    const data=friendData();
    if(n) n.textContent=data.length?`NEAREST: ${data[0].name} • ${Math.round(data[0].d)}m`:'NO FRIEND NEARBY';
    const dir=q('party-direction');
    if(!dir) return;
    if(!data.length){dir.style.display='none';return;}
    const target=data[0].r.position.clone(); target.y=1.3; const projected=target.project(camera);
    const onScreen=projected.z<1 && projected.x>-0.86 && projected.x<0.86 && projected.y>-0.82 && projected.y<0.82;
    if(onScreen){dir.textContent=`👥 ${data[0].name} • ${Math.round(data[0].d)}m`;dir.style.transform='translateX(-50%)';dir.style.display='block';}
    else{
      const dx=projected.x, dy=-projected.y; const ang=Math.atan2(dy,dx); const deg=ang*180/Math.PI;
      dir.textContent=`FRIEND ${Math.round(data[0].d)}m →`; dir.style.transform=`translateX(-50%) rotate(${deg}deg)`; dir.style.display='block';
    }
  }

  function makePing(x,z,name){
    if(typeof scene==='undefined') return;
    const group=new THREE.Group();
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.4,3.8,12),new THREE.MeshBasicMaterial({color:0x7fffd4,transparent:true,opacity:.35}));
    beam.position.y=1.9; group.add(beam);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.8,32),new THREE.MeshBasicMaterial({color:0x7fffd4,transparent:true,opacity:.8,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; group.add(ring);
    group.position.set(x,0,z); scene.add(group);
    pingMeshes.push({group,t:performance.now(),name:name||'Friend'});
    setTimeout(()=>{scene.remove(group);pingMeshes=pingMeshes.filter(x=>x.group!==group);},2600);
  }

  function broadcastPing(x,z,name){
    const packet={type:'party_ping',x:Number(x)||0,z:Number(z)||0,name:String(name||'Friend').slice(0,16),id:++pingSeq};
    makePing(packet.x,packet.z,packet.name);
    if(typeof isHost!=='undefined'&&isHost){
      if(typeof connections!=='undefined') for(const c of connections.values()) if(typeof sendTo==='function') sendTo(c,packet);
    } else if(typeof hostConnection!=='undefined'&&hostConnection&&hostConnection.open&&typeof sendTo==='function') sendTo(hostConnection,packet);
  }
  function partyPing(){
    if(typeof gameActive==='undefined'||!gameActive) return;
    const p=controls.getObject().position; broadcastPing(p.x,p.z,typeof username!=='undefined'?username:'Friend'); toast('📍 PARTY PING — COME HERE!',1100);
  }

  function patchNetworking(){
    if(netPatched || typeof setupEnhancedHostConnection!=='function' || typeof setupEnhancedGuestConnection!=='function') return false;
    const oldHost=setupEnhancedHostConnection, oldGuest=setupEnhancedGuestConnection;
    setupEnhancedHostConnection=function(conn){
      oldHost(conn);
      conn.on('data',data=>{
        if(!data||data.type!=='party_ping') return;
        const packet={type:'party_ping',x:Number(data.x)||0,z:Number(data.z)||0,name:String(data.name||'Friend').slice(0,16),id:data.id||0};
        makePing(packet.x,packet.z,packet.name);
        if(typeof connections!=='undefined') for(const [id,c] of connections) if(c!==conn&&typeof sendTo==='function') sendTo(c,packet);
      });
    };
    setupEnhancedGuestConnection=function(conn){
      oldGuest(conn);
      conn.on('data',data=>{if(data&&data.type==='party_ping') makePing(Number(data.x)||0,Number(data.z)||0,String(data.name||'Friend'));});
    };
    netPatched=true; return true;
  }

  function boot(){
    setupUI();
    wrapMovement();
    setupFlashlight();
    setupAvatar();
    if(!patchNetworking()) setTimeout(boot,180);
    if(!bound){
      bound=true;
      document.addEventListener('keydown',e=>{
        if(e.code==='KeyV'){e.preventDefault();if(typeof gameActive!=='undefined'&&gameActive)toggleView();}
        if(e.code==='KeyF'){e.preventDefault();if(typeof gameActive!=='undefined'&&gameActive)toggleFlashlight();}
        if(e.code==='KeyC'){e.preventDefault();if(typeof gameActive!=='undefined'&&gameActive)toggleCrouch();}
        if(e.code==='KeyQ'){e.preventDefault();if(typeof gameActive!=='undefined'&&gameActive)partyPing();}
      },true);
      try{ if(localStorage.getItem('backrooms_camera_mode')==='3') thirdPerson=true; }catch(_){ }
      setTimeout(()=>setCameraMode(thirdPerson),400);
    }
  }

  function frame(){
    if(typeof gameActive!=='undefined'&&gameActive){
      setupAvatar(); setupFlashlight();
      if(thirdPerson && camera){
        camera.position.z=5.6; camera.position.y=2.45;
        try{
          const wp=new THREE.Vector3(); camera.getWorldPosition(wp);
          if(typeof walls!=='undefined' && walls.some(w=>w.containsPoint(wp))) camera.position.z=2.25;
        }catch(_){ }
      }else if(camera){ camera.position.z=0; camera.position.y=crouching?1.02:1.6; }
      updateHud();
      const now=performance.now();
      pingMeshes.forEach(p=>{
        const age=(now-p.t)/1000; const pulse=1+Math.sin(age*10)*.18; p.group.scale.set(pulse,1,pulse); const beam=p.group.children[0]; if(beam) beam.material.opacity=Math.max(0,.42*(1-age/2.6));
      });
      if(now-lastPartyTick>1500){lastPartyTick=now; if(typeof isHost!=='undefined'&&isHost&&typeof sendAllPlayers==='function') sendAllPlayers();}
    }
    requestAnimationFrame(frame);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{boot();frame();},{once:true}); else {boot();frame();}
})();
