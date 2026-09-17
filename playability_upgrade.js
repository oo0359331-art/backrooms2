/* Backrooms playability upgrade: simple missions, reliable controls, bigger streamed map,
   Bacteria entity, non-lethal horror events, and level-completion reward for Hollow Purple. */
(function(){
  'use strict';
  const UNLOCK_KEY='backrooms_hollow_purple_unlocked';
  const q=id=>document.getElementById(id);
  let missionRoot, bacteria=null, bacteriaActive=false, lastPlayerPos=null, distanceTravelled=0;
  let lastEvent=0, eventBusy=false, wrapped=false;

  function unlocked(){ return localStorage.getItem(UNLOCK_KEY)==='1'; }
  function setUnlocked(){ localStorage.setItem(UNLOCK_KEY,'1'); }

  function addStyle(){
    if(q('playability-upgrade-style')) return;
    const s=document.createElement('style'); s.id='playability-upgrade-style';
    s.textContent=`
      #playability-mission{position:fixed;top:16px;right:16px;z-index:90;width:min(340px,88vw);padding:12px 14px;background:rgba(8,7,4,.78);border:1px solid rgba(255,210,70,.55);border-radius:9px;color:#fff;box-shadow:0 0 18px rgba(0,0,0,.4);font:700 13px 'Courier New',monospace;display:none;backdrop-filter:blur(4px)}
      #playability-mission .title{color:#ffd84d;letter-spacing:2px;margin-bottom:7px}.playability-mission .line{line-height:1.45;font-weight:600}
      #playability-mission .done{color:#7dffb0}
      #playability-horror{position:fixed;inset:0;z-index:240;display:none;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(130,0,0,.12),rgba(0,0,0,.78));pointer-events:none}
      #playability-horror .msg{color:#fff;font:900 clamp(28px,6vw,72px) 'Courier New',monospace;letter-spacing:5px;text-align:center;text-shadow:0 0 8px #fff,0 0 25px #f00,0 0 50px #500;animation:brScare .9s ease-out forwards}
      @keyframes brScare{0%{opacity:0;transform:scale(.45);filter:blur(10px)}20%{opacity:1;transform:scale(1.08);filter:blur(0)}65%{opacity:1}100%{opacity:0;transform:scale(1.18)}}
      #hollow-purple-button:disabled{opacity:.42;filter:grayscale(.3);cursor:not-allowed}
      #bacteria-label{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:85;color:#d9ffd9;font:700 12px 'Courier New',monospace;text-shadow:0 0 8px #7dff88;display:none;pointer-events:none}
    `;
    document.head.appendChild(s);
  }

  function setupMissionUI(){
    addStyle();
    if(q('playability-mission')) return;
    missionRoot=document.createElement('div'); missionRoot.id='playability-mission';
    missionRoot.innerHTML='<div class="title">CURRENT MISSION</div><div class="line" id="mission-line">Find the 3 items.</div>';
    document.body.appendChild(missionRoot);
    const scare=document.createElement('div'); scare.id='playability-horror'; scare.innerHTML='<div class="msg"></div>'; document.body.appendChild(scare);
    const label=document.createElement('div'); label.id='bacteria-label'; label.textContent='BACTERIA IS NEAR'; document.body.appendChild(label);
    const close=q('win-close'); if(close) close.addEventListener('click',()=>{if(missionRoot)missionRoot.style.display='none';});
  }

  function showHorror(text){
    if(eventBusy) return;
    eventBusy=true;
    const el=q('playability-horror'); const msg=el.querySelector('.msg');
    msg.textContent=text; el.style.display='flex';
    setTimeout(()=>{el.style.display='none';eventBusy=false;},1000);
  }

  function redLights(){
    if(typeof scene==='undefined') return;
    const lights=[];
    scene.traverse(o=>{if(o.isLight){lights.push({o,color:o.color.clone(),intensity:o.intensity});o.color.set(0xff1408);o.intensity*=1.7;}});
    if(scene.fog&&scene.fog.color){scene.__brFog=scene.fog.color.clone();scene.fog.color.set(0x4b0505);}
    showHorror('THE LIGHTS ARE WRONG');
    setTimeout(()=>{lights.forEach(x=>{x.o.color.copy(x.color);x.o.intensity=x.intensity});if(scene.__brFog&&scene.fog&&scene.fog.color)scene.fog.color.copy(scene.__brFog);},1600);
  }

  function randomHorrorEvent(){
    if(typeof gameActive==='undefined'||!gameActive||eventBusy)return;
    Math.random()<0.58?redLights():showHorror('DON’T TURN AROUND');
  }

  function scheduleEvents(){clearTimeout(lastEvent);const delay=26000+Math.random()*26000;lastEvent=setTimeout(()=>{randomHorrorEvent();scheduleEvents();},delay);}

  function makeBacteria(){
    if(bacteria||typeof THREE==='undefined'||typeof scene==='undefined')return;
    bacteria=new THREE.Group();bacteria.name='BACTERIA_ENTITY';
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,2),new THREE.MeshStandardMaterial({color:0x162416,emissive:0x0b260f,emissiveIntensity:1.15,roughness:.5}));bacteria.add(core);
    for(let i=0;i<10;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.22+Math.random()*.18,10,10),new THREE.MeshStandardMaterial({color:0x6be36d,emissive:0x153e18,emissiveIntensity:1.2,roughness:.4}));const a=(i/10)*Math.PI*2,r=1.05+Math.random()*.35;p.position.set(Math.cos(a)*r,(Math.random()-.5)*.8,Math.sin(a)*r);bacteria.add(p);}
    bacteria.add(new THREE.PointLight(0x70ff7a,2.2,9));scene.add(bacteria);resetBacteria();
  }

  function resetBacteria(){
    if(!bacteria){makeBacteria();return;}
    const root=typeof controls!=='undefined'&&controls?controls.getObject().position:new THREE.Vector3();
    bacteria.position.set(root.x+28,1.3,root.z+24);bacteria.visible=true;bacteriaActive=true;
  }
  window.__bacteriaReset=resetBacteria;

  function updateBacteria(dt){
    if(!bacteria||!bacteriaActive||typeof controls==='undefined'||!controls)return;
    const p=controls.getObject().position,d=bacteria.position.distanceTo(p);
    bacteria.rotation.y+=dt*1.4;bacteria.rotation.z+=dt*.8;bacteria.scale.setScalar(1+Math.sin(performance.now()*.005)*.08);
    if(d<22){q('bacteria-label').style.display='block';const dir=p.clone().sub(bacteria.position);dir.y=0;if(dir.lengthSq()>0.01){dir.normalize();bacteria.position.addScaledVector(dir,dt*2.6);}}else q('bacteria-label').style.display='none';
    if(d<3.5){showHorror('BACTERIA GOT TOO CLOSE');bacteria.position.set(p.x+18,1.3,p.z-22);if(typeof stamina!=='undefined')stamina=Math.max(15,stamina-35);}
  }

  function setupWideWorld(){
    if(window.__wideWorldPatched||typeof updateInfiniteWorld!=='function'||typeof addInfiniteChunk!=='function')return;
    const original=updateInfiniteWorld;
    updateInfiniteWorld=function(force){
      original(force);
      if(typeof currentLevel==='undefined'||!['0','1'].includes(currentLevel)||typeof controls==='undefined'||!controls)return;
      if(typeof isMobileMode!=='undefined'&&isMobileMode)return;
      const p=controls.getObject().position,cx=Math.floor(p.x/CHUNK_SIZE),cz=Math.floor(p.z/CHUNK_SIZE);
      for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++)addInfiniteChunk(x,z,window.__backroomsWallMat,currentLevel);
    };
    window.__wideWorldPatched=true;try{updateInfiniteWorld(true);}catch(_){ }
  }

  function ensureExit(){
    if(typeof currentLevel==='undefined'||currentLevel==='2'||typeof exitObject!=='undefined'&&exitObject)return;
    if(typeof createExitDoor==='function'){try{createExitDoor();}catch(_){ }}
  }

  function missionText(){
    const line=q('mission-line');if(!line||typeof currentLevel==='undefined')return;
    if(typeof inventoryComplete==='function'&&inventoryComplete())line.innerHTML='<span class="done">✓ All 3 items found.</span><br>Go to the exit and press E.';
    else{const count=typeof inventory!=='undefined'&&Array.isArray(inventory)?inventory.length:0;line.textContent=`Find the 3 items. Progress: ${Math.min(3,count)}/3`;}
  }

  function enableReward(){
    setUnlocked();const b=q('hollow-purple-button');if(b){b.disabled=false;b.title='Unlocked by finishing a level.';b.style.display='block';}
    showHorror('HOLLOW PURPLE UNLOCKED');if(typeof showToast==='function')showToast('You finished the level. Hollow Purple is yours.');
  }

  function gateHollowPurple(){
    const b=q('hollow-purple-button'),ok=unlocked();if(b){b.disabled=!ok;if(ok)b.title='Unlocked by finishing a level.';}
    if(!ok&&!window.__hollowGateBound){document.addEventListener('keydown',e=>{if(e.code!=='KeyP')return;e.preventDefault();e.stopImmediatePropagation();if(typeof showToast==='function')showToast('Finish your current level to unlock Hollow Purple.');},true);window.__hollowGateBound=true;}
  }

  function wrapGame(){
    if(wrapped||typeof window.startGame!=='function')return false;
    const oldStart=window.startGame;
    window.startGame=function(mode){oldStart(mode);setTimeout(()=>{setupMissionUI();if(missionRoot)missionRoot.style.display='block';try{ensureExit();}catch(_){ }try{setupWideWorld();}catch(_){ }try{resetBacteria();}catch(_){ }gateHollowPurple();scheduleEvents();},250);};
    if(typeof window.winGame==='function'){
      const oldWin=window.winGame;
      window.winGame=function(){oldWin.apply(this,arguments);const text=q('win-text');if(text&&typeof currentLevel!=='undefined')text.textContent=`${username||'Player'} escaped Level ${currentLevel}.`;enableReward();};
    }
    wrapped=true;return true;
  }

  function bindControls(){
    if(window.__controlWatchdog)return;window.__controlWatchdog=true;
    const down=e=>{if(typeof isMobileMode!=='undefined'&&isMobileMode)return;if(e.code==='KeyW')moveForward=true;else if(e.code==='KeyA')moveLeft=true;else if(e.code==='KeyS')moveBackward=true;else if(e.code==='KeyD')moveRight=true;else if(e.code==='ShiftLeft'||e.code==='ShiftRight'){if(typeof stamina==='undefined'||stamina>0)isSprinting=true;}};
    const up=e=>{if(e.code==='KeyW')moveForward=false;else if(e.code==='KeyA')moveLeft=false;else if(e.code==='KeyS')moveBackward=false;else if(e.code==='KeyD')moveRight=false;else if(e.code==='ShiftLeft'||e.code==='ShiftRight')isSprinting=false;};
    document.addEventListener('keydown',down,true);document.addEventListener('keyup',up,true);window.addEventListener('blur',()=>{moveForward=moveBackward=moveLeft=moveRight=false;isSprinting=false;});
    document.addEventListener('click',()=>{if(typeof gameActive!=='undefined'&&gameActive&&typeof controls!=='undefined'&&controls&&!controls.isLocked&&!isMobileMode)try{controls.lock();}catch(_){ }},true);
  }

  function frame(){
    if(typeof gameActive!=='undefined'&&gameActive&&typeof controls!=='undefined'&&controls){const p=controls.getObject().position;if(lastPlayerPos)distanceTravelled+=p.distanceTo(lastPlayerPos);lastPlayerPos=p.clone();missionText();updateBacteria(1/60);}else lastPlayerPos=null;
    gateHollowPurple();requestAnimationFrame(frame);
  }

  function boot(){setupMissionUI();bindControls();const tryWrap=()=>{if(!wrapGame())setTimeout(tryWrap,150);};tryWrap();frame();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
