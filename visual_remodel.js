/* Backrooms Remastered visual remodel — realistic browser-friendly presentation without external asset dependencies. */
(function(){
  'use strict';
  const S={ready:false,group:null,decor:new Set(),lastCell:'',floorTex:null,ceilTex:null};
  const safe=fn=>{try{return fn();}catch(e){}};
  const get=(name,fallback)=>safe(()=>typeof window[name]!=='undefined'?window[name]:fallback);
  const scene=()=>get('scene',null),cam=()=>get('camera',null),renderer=()=>get('renderer',null);
  function css(){
    if(document.getElementById('vr-look-style'))return;
    const s=document.createElement('style');s.id='vr-look-style';s.textContent=`
      #vr-cinematic{position:fixed;inset:0;z-index:14;pointer-events:none;box-shadow:inset 0 0 160px rgba(0,0,0,.78),inset 0 0 38px rgba(0,0,0,.34);mix-blend-mode:multiply;opacity:.65}
      #vr-letterbox{position:fixed;left:0;right:0;top:0;height:0;background:#000;z-index:13;pointer-events:none;transition:height .4s}
      @media(max-width:650px){#vr-cinematic{opacity:.48}}
    `;document.head.appendChild(s);
  }
  function dom(){
    if(document.getElementById('vr-cinematic'))return;
    const v=document.createElement('div');v.id='vr-cinematic';document.body.appendChild(v);
  }
  function tex(kind){
    const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');
    if(kind==='carpet'){
      x.fillStyle='#4e472c';x.fillRect(0,0,128,128);
      for(let i=0;i<4200;i++){const n=55+Math.floor(Math.random()*38);x.fillStyle=`rgb(${n},${n-4},${n-18})`;x.fillRect(Math.random()*128,Math.random()*128,1,1);}
      x.globalAlpha=.13;x.strokeStyle='#211f16';
      for(let y=3;y<128;y+=9){x.beginPath();x.moveTo(0,y);x.lineTo(128,y+Math.random()*3);x.stroke();}
    }else{
      x.fillStyle='#d8d8cf';x.fillRect(0,0,128,128);
      for(let i=0;i<900;i++){const n=165+Math.floor(Math.random()*45);x.fillStyle=`rgb(${n},${n},${n})`;x.fillRect(Math.random()*128,Math.random()*128,1,1);}
      x.strokeStyle='rgba(80,80,80,.18)';x.lineWidth=1;
      for(let y=0;y<=128;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(128,y);x.stroke();}
      for(let xx=0;xx<=128;xx+=32){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,128);x.stroke();}
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,8);t.anisotropy=safe(()=>renderer()?.capabilities?.getMaxAnisotropy?.())||4;return t;
  }
  function materializeSurface(){
    const floor=get('infiniteFloor',null),ceil=get('infiniteCeiling',null);if(!floor||!ceil||!window.THREE)return;
    if(!S.floorTex)S.floorTex=tex('carpet');if(!S.ceilTex)S.ceilTex=tex('ceiling');
    safe(()=>{floor.material.map=S.floorTex;floor.material.color.set('#817548');floor.material.roughness=.96;floor.material.needsUpdate=true;});
    safe(()=>{ceil.material.map=S.ceilTex;ceil.material.color.set('#d7d5ca');ceil.material.roughness=.9;ceil.material.needsUpdate=true;});
  }
  function setupRenderer(){
    const r=renderer();if(!r)return;
    safe(()=>{r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=.92;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;});
    const s=scene();if(s){safe(()=>{s.fog=new THREE.FogExp2(0x3b392e,.012);});}
  }
  function makeFixture(x,y,z,rot){
    if(!S.group)return;const body=new THREE.Mesh(new THREE.BoxGeometry(2.0,.09,.46),new THREE.MeshStandardMaterial({color:0x232522,roughness:.55,metalness:.15}));body.position.set(x,y,z);body.rotation.y=rot;body.castShadow=true;S.group.add(body);
    const tube=new THREE.Mesh(new THREE.BoxGeometry(1.45,.045,.16),new THREE.MeshStandardMaterial({color:0xece8d6,emissive:0xd7d2bd,emissiveIntensity:.85,roughness:.35}));tube.position.set(x,y-.055,z);tube.rotation.y=rot;S.group.add(tube);
  }
  function makeWallObject(x,z,rot,type){
    if(!S.group)return;const root=new THREE.Group();root.position.set(x,1.45,z);root.rotation.y=rot;S.group.add(root);
    if(type==='panel'){
      const frame=new THREE.Mesh(new THREE.BoxGeometry(.85,1.15,.07),new THREE.MeshStandardMaterial({color:0x5b584e,roughness:.8}));root.add(frame);
      const panel=new THREE.Mesh(new THREE.BoxGeometry(.68,.98,.075),new THREE.MeshStandardMaterial({color:0x4a4b45,roughness:.92}));panel.position.z=.02;root.add(panel);
      for(let i=0;i<3;i++){const led=new THREE.Mesh(new THREE.BoxGeometry(.08,.04,.02),new THREE.MeshBasicMaterial({color:i===1?0xff5b47:0x5cffb2}));led.position.set(-.24+i*.24,.34,.065);root.add(led);}
    }else{
      const clock=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.08,18),new THREE.MeshStandardMaterial({color:0xd5d3c6,roughness:.55}));clock.rotation.x=Math.PI/2;clock.position.z=.06;root.add(clock);
      const hand=new THREE.Mesh(new THREE.BoxGeometry(.025,.14,.02),new THREE.MeshBasicMaterial({color:0x252525}));hand.position.set(0,.08,.11);root.add(hand);
    }
  }
  function makeCell(cx,cz){
    const key=cx+','+cz;if(S.decor.has(key)||!S.group)return;S.decor.add(key);const baseX=cx*36,baseZ=cz*36;
    const r=Math.abs(Math.sin(cx*41.17+cz*9.31+13.5));
    makeFixture(baseX,4.72,baseZ,0);
    if(r>.28)makeFixture(baseX+8.8,4.72,baseZ-9.4,Math.PI/2);
    if(r>.62)makeWallObject(baseX-17.65,baseZ+4.5,Math.PI/2,'panel');
    if(r<.2)makeWallObject(baseX+12,baseZ-17.65,0,'clock');
  }
  function updateCells(){
    const c=cam();if(!c||!S.group||String(get('currentLevel','0'))!=='0')return;const cx=Math.floor(c.position.x/36),cz=Math.floor(c.position.z/36),id=cx+','+cz;if(id===S.lastCell)return;S.lastCell=id;for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)makeCell(x,z);if(S.group.children.length>80){while(S.group.children.length>70){const o=S.group.children.shift();safe(()=>o.traverse(m=>{m.geometry?.dispose?.();m.material?.dispose?.();}));}}}
  function animate(){const r=renderer(),s=scene(),c=cam();if(r&&s&&c&&S.ready){setupRenderer();materializeSurface();updateCells();}requestAnimationFrame(animate);}
  function init(){const s=scene();if(!s||!window.THREE){setTimeout(init,300);return;}S.group=new THREE.Group();S.group.name='VR_VISUAL_REMODEL';s.add(S.group);css();dom();setupRenderer();materializeSurface();S.ready=true;animate();}
  window.addEventListener('load',()=>setTimeout(init,650));
  window.BackroomsVisualRemodel={refresh:()=>{S.lastCell='';materializeSurface();}};
})();
