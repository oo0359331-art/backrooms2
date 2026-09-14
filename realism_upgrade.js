/* Third-person character + multiplayer avatar + emote/realism upgrade. */
(function(){
'use strict';
function boot(){
  if(typeof THREE==='undefined'||typeof scene==='undefined'||typeof camera==='undefined'||typeof controls==='undefined'||typeof renderer==='undefined') return setTimeout(boot,100);
  window.__thirdPerson=false;
  let localAvatar=null, thirdPerson=false, currentEmote='';
  const avatarParts={};
  function makeMat(color,rough=.8,metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
  function makeAvatar(){
    const g=new THREE.Group(); g.name='LOCAL_PLAYER_AVATAR';
    const skin=makeMat(0xc78d6a,.95), shirt=makeMat(typeof playerColor!=='undefined'?playerColor:0x4e7bd9,.75), pants=makeMat(0x17191d,.95), shoe=makeMat(0x080808,.9), hair=makeMat(0x151515,1);
    avatarParts.body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,6,10),shirt); avatarParts.body.position.y=1.15; g.add(avatarParts.body);
    avatarParts.head=new THREE.Mesh(new THREE.SphereGeometry(.34,18,14),skin); avatarParts.head.position.y=1.92; g.add(avatarParts.head);
    const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.355,18,9,0,Math.PI*2,0,Math.PI*.52),hair); hairCap.position.y=2.03; g.add(hairCap);
    for(const x of [-.12,.12]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,8,8),makeMat(0x050505,1)); eye.position.set(x,1.95,-.33); g.add(eye);}
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.16,10),skin); neck.position.y=1.61; g.add(neck);
    for(const x of [-.18,.18]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.13,.14,.72,10),pants); leg.position.set(x,.48,0); g.add(leg); const foot=new THREE.Mesh(new THREE.BoxGeometry(.27,.16,.46),shoe); foot.position.set(x,.12,-.08); g.add(foot);}
    for(const x of [-.47,.47]){const arm=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.82,10),shirt); arm.position.set(x,1.12,0); arm.rotation.z=x<0?-.08:.08; g.add(arm);}
    const name=document.createElement('canvas'); name.width=512; name.height=128; const ctx=name.getContext('2d'); ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(16,20,480,88); ctx.fillStyle='#fff'; ctx.font='bold 38px Arial'; ctx.textAlign='center'; ctx.fillText(typeof username!=='undefined'?username:'YOU',256,72);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(name),transparent:true,depthTest:false})); tag.name='localName'; tag.scale.set(2.4,.6,1); tag.position.y=2.85; g.add(tag);
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false})); shadow.rotation.x=-Math.PI/2; shadow.position.y=.03; g.add(shadow);
    g.visible=false;
    scene.add(g); return g;
  }
  function emoteSprite(g,e){let old=g.getObjectByName('tpEmote');if(old)g.remove(old);if(!e)return;const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.font='86px sans-serif';x.textAlign='center';x.fillText(e==='wave'?'👋':e==='point'?'👉':'😨',128,94);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));s.name='tpEmote';s.scale.set(1.15,.58,1);s.position.y=3.45;g.add(s);setTimeout(()=>{if(g.getObjectByName('tpEmote')===s)g.remove(s)},1300);}
  function updateCamera(){if(!thirdPerson)return;const p=controls.getObject(),yaw=p.rotation.y;const desired=new THREE.Vector3(p.position.x+Math.sin(yaw)*4.2,p.position.y+2.65,p.position.z+Math.cos(yaw)*4.2);camera.position.lerp(desired,.28);camera.lookAt(p.position.x,p.position.y+1.05,p.position.z);}
  function setThirdPerson(on){thirdPerson=!!on;window.__thirdPerson=thirdPerson;if(localAvatar)localAvatar.visible=thirdPerson;if(!thirdPerson){const p=controls.getObject();camera.position.set(p.position.x,p.position.y,p.position.z);camera.rotation.copy(p.rotation);}if(typeof showToast==='function')showToast(thirdPerson?'THIRD PERSON':'FIRST PERSON',1000);}
  localAvatar=makeAvatar();setThirdPerson(false);window.__localAvatar=localAvatar;
  document.addEventListener('keydown',e=>{if(e.code==='KeyV'){e.preventDefault();setThirdPerson(!thirdPerson);}});
  const realRender=renderer.render.bind(renderer);
  renderer.render=function(s,c){if(c===camera&&thirdPerson&&gameActive){const p=controls.getObject();localAvatar.position.copy(p.position);localAvatar.position.y-=1.6;localAvatar.rotation.y=p.rotation.y;if(typeof localEmote!=='undefined'&&localEmote&&localEmote!==currentEmote){currentEmote=localEmote;emoteSprite(localAvatar,currentEmote);}if(!localEmote)currentEmote='';updateCamera();}realRender(s,c);};
  let prev={x:0,z:0,t:performance.now()};
  const animateAvatars=()=>{const t=performance.now(),dt=Math.min(.05,(t-prev.t)/1000),p=controls.getObject();const speed=Math.hypot(p.position.x-prev.x,p.position.z-prev.z)/Math.max(dt,.001),moving=speed>.15;const swing=moving?Math.sin(t*.014*Math.min(speed,7))*.32:0;if(localAvatar&&thirdPerson){localAvatar.position.copy(p.position);localAvatar.position.y-=1.6;localAvatar.rotation.y=p.rotation.y;const legs=localAvatar.children.filter(x=>x.geometry&&x.geometry.type==='CylinderGeometry'&&x.position.y<.7);if(legs.length>=2){legs[0].rotation.x=swing;legs[1].rotation.x=-swing;}}for(const r of remotePlayers.values()){const last=r.userData._last||r.position.clone(),sp=Math.hypot(r.position.x-last.x,r.position.z-last.z)/Math.max(dt,.001),sw=sp>.12?Math.sin(t*.014*Math.min(sp,7))*.28:0;r.userData._last=r.position.clone();const legs=r.children.filter(x=>x.geometry&&(x.geometry.type==='CapsuleGeometry'||x.geometry.type==='CylinderGeometry')&&x.position.y<.8);if(legs.length>=2){legs[0].rotation.x=sw;legs[1].rotation.x=-sw;}}prev={x:p.position.x,z:p.position.z,t};requestAnimationFrame(animateAvatars);};
  requestAnimationFrame(animateAvatars);
  const oldRenderRemote=window.renderRemotePlayers;
  if(typeof oldRenderRemote==='function'){window.renderRemotePlayers=function(players){oldRenderRemote(players);for(const[id,state]of Object.entries(players||{})){const r=remotePlayers.get(id);if(!r||id===localPlayerId)continue;if(state.emote&&state.emote!==r.userData.__tpLastEmote){r.userData.__tpLastEmote=state.emote;emoteSprite(r,state.emote);}}};}
  const fx=document.createElement('div');fx.id='realism-fx';fx.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:15;box-shadow:inset 0 0 140px rgba(0,0,0,.72),inset 0 0 35px rgba(0,0,0,.35);opacity:.82;mix-blend-mode:multiply;';document.body.appendChild(fx);
  const grain=document.createElement('div');grain.style.cssText='position:fixed;inset:-50%;pointer-events:none;z-index:16;opacity:.055;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.55%27/%3E%3C/svg%3E");animation:grainMove .18s steps(2) infinite;';document.body.appendChild(grain);
  const style=document.createElement('style');style.textContent='@keyframes grainMove{0%{transform:translate(0,0)}25%{transform:translate(-2%,1%)}50%{transform:translate(1%,-2%)}75%{transform:translate(2%,2%)}100%{transform:translate(-1%,-1%)}}';document.head.appendChild(style);
  renderer.domElement.addEventListener('click',()=>{if(gameActive&&!isMobileMode&&!controls.isLocked)controls.lock();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();