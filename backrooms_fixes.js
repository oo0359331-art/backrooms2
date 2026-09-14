/* Backrooms controls / pickup / inventory / item-visual fixes. Loaded by index.html patch. */
(function(){
'use strict';

function installBackroomsFixes(){
  if (typeof THREE === 'undefined' || typeof scene === 'undefined') return setTimeout(installBackroomsFixes,100);

  /* PC + mobile: one authoritative yaw value. PointerLockControls owns body yaw. */
  if (typeof controls !== 'undefined' && controls && controls.getObject) {
    const body = controls.getObject();
    window.__backroomsYaw = function(){ return body.rotation.y; };
    window.__backroomsPitch = function(){ return camera.rotation.x; };
  }

  /* Replace mobile look surface so the original broken listener is removed. */
  const oldLook = document.getElementById('mobile-look');
  if (oldLook && !oldLook.dataset.fixed) {
    const look = oldLook.cloneNode(true); oldLook.replaceWith(look); look.dataset.fixed='1';
    let pointerId=null,lastX=0,lastY=0;
    const end=()=>{ pointerId=null; };
    look.addEventListener('pointerdown',e=>{ if(!window.isMobileMode)return; e.preventDefault(); pointerId=e.pointerId; lastX=e.clientX; lastY=e.clientY; look.setPointerCapture(pointerId); });
    look.addEventListener('pointermove',e=>{
      if(pointerId!==e.pointerId || !window.gameActive || !window.isMobileMode)return;
      const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
      const body=controls.getObject(); body.rotation.y -= dx*0.004;
      camera.rotation.x -= dy*0.004;
      camera.rotation.x=Math.max(-Math.PI/2,Math.min(Math.PI/2,camera.rotation.x));
    });
    look.addEventListener('pointerup',end); look.addEventListener('pointercancel',end);
  }

  /* Reliable mobile ACTION, including solo mode. */
  const action=document.getElementById('mobile-action');
  if(action && !action.dataset.fixed){
    action.dataset.fixed='1';
    action.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation(); if(window.gameActive) window.tryInteract();});
  }

  /* Reliable pickup/drop/interact logic. Solo is authoritative locally; host remains authoritative in multiplayer. */
  window.nearestItem=function(){
    const p=controls.getObject().position; let best=null,bd=3.25;
    for(const item of worldItems){
      if(item.picked) continue;
      const d=Math.hypot(p.x-item.x,p.z-item.z);
      if(d<bd){bd=d;best=item;}
    }
    return best;
  };

  window.tryInteract=function(){
    if(!window.gameActive) return;
    const p=controls.getObject().position;
    const item=window.nearestItem();
    if(item){
      if(inventory.length>=MAX_INVENTORY){ showToast('Inventory full. Press G to drop an item.'); return; }
      if(window.isHost || !window.hostConnection){
        item.picked=true;
        inventory.push(item.type);
        updateInventoryUI();
        if(inventoryComplete()) exitOpen=true;
        syncWorldMeshes();
        if(window.isHost && typeof broadcastWorld==='function') broadcastWorld();
        showToast('Picked up: '+((ITEM_TYPES.find(x=>x.id===item.type)||{}).name||item.type));
      } else if(window.hostConnection){
        sendTo(hostConnection,{type:'pickup',itemId:item.id});
        showToast('Picking up…');
      }
      return;
    }
    if(exitObject){
      const ex=exitObject.position; const d=Math.hypot(p.x-ex.x,p.z-ex.z);
      if(d<4.5){
        if(!inventoryComplete()){showToast('The exit is locked. Find the 3 items.');return;}
        if(window.isHost || !window.hostConnection) winGame(); else sendTo(hostConnection,{type:'escape'});
        return;
      }
    }
  };

  /* Better item models: key, gear and access card instead of identical glowing octahedrons. */
  window.spawnWorldItemMesh=function(item){
    let mesh=worldItemMeshes.get(item.id);
    const def=ITEM_TYPES.find(x=>x.id===item.type)||ITEM_TYPES[0];
    if(mesh){ scene.remove(mesh); worldItemMeshes.delete(item.id); mesh=null; }

    const group=new THREE.Group();
    group.userData.itemId=item.id; group.userData.type=item.type; group.userData.baseY=.38; group.userData.phase=(item.id.charCodeAt(0)||1)*.37;
    const mat=new THREE.MeshStandardMaterial({color:def.color,roughness:.28,metalness:.72});
    const dark=new THREE.MeshStandardMaterial({color:0x171717,roughness:.4,metalness:.7});

    if(item.type==='key'){
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.62,16),mat); shaft.rotation.z=Math.PI/2; group.add(shaft);
      const bow=new THREE.Mesh(new THREE.TorusGeometry(.17,.055,10,20),mat); bow.position.x=-.36; group.add(bow);
      const tooth1=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.06),mat); tooth1.position.x=.31; tooth1.position.y=-.08; group.add(tooth1);
      const tooth2=tooth1.clone(); tooth2.position.x=.40; tooth2.position.y=.04; group.add(tooth2);
    } else if(item.type==='gear'){
      const core=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.09,20),mat); group.add(core);
      const hole=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.105,16),dark); group.add(hole);
      for(let i=0;i<10;i++){ const a=i*Math.PI*2/10; const tooth=new THREE.Mesh(new THREE.BoxGeometry(.10,.10,.18),mat); tooth.position.set(Math.cos(a)*.29,0,Math.sin(a)*.29); tooth.rotation.y=-a; group.add(tooth); }
    } else {
      const card=new THREE.Mesh(new THREE.BoxGeometry(.66,.055,.43),mat); group.add(card);
      const stripe=new THREE.Mesh(new THREE.BoxGeometry(.66,.008,.075),dark); stripe.position.set(0,.034,.11); group.add(stripe);
      const chip=new THREE.Mesh(new THREE.BoxGeometry(.13,.012,.10),new THREE.MeshStandardMaterial({color:0xd4af37,metalness:.8,roughness:.2})); chip.position.set(-.19,.036,-.07); group.add(chip);
    }
    group.position.set(item.x,.38,item.z); group.rotation.y=item.id.length*.31; scene.add(group); worldItemMeshes.set(item.id,group);
  };

  window.syncWorldMeshes=function(){
    if(!window.worldItemMeshes) return;
    const live=new Set();
    for(const item of worldItems){ live.add(item.id); spawnWorldItemMesh(item); const m=worldItemMeshes.get(item.id); if(m)m.visible=!item.picked; }
    for(const [id,m] of worldItemMeshes){if(!live.has(id)){scene.remove(m);worldItemMeshes.delete(id);}}
  };

  /* Animate physical-looking items continuously. */
  if(!window.__backroomsItemLoop){
    window.__backroomsItemLoop=true;
    const tick=()=>{
      if(window.worldItemMeshes){
        const t=performance.now()*.001;
        for(const [id,m] of worldItemMeshes){ if(!m.visible)continue; m.rotation.y += .012; m.position.y=.38+Math.sin(t*1.7+(m.userData.phase||0))*.045; }
      }
      requestAnimationFrame(tick);
    }; requestAnimationFrame(tick);
  }

  /* Prevent stuck PC movement when the tab loses focus. */
  if(!window.__backroomsBlurFix){
    window.__backroomsBlurFix=true;
    const reset=()=>{moveForward=moveBackward=moveLeft=moveRight=isSprinting=false; if(window.joystickX!==undefined)joystickX=joystickZ=0;};
    window.addEventListener('blur',reset); document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',installBackroomsFixes); else installBackroomsFixes();
})();

/* Load the third-person/realism layer after the fixes layer. */
(function(){
  const s=document.createElement('script');
  s.src='./realism_upgrade.js';
  s.async=false;
  document.head.appendChild(s);
})();
