/* Backrooms Remastered living world — subtle environmental dressing and reactive room anomalies. */
(function(){
  'use strict';
  const S={group:null,seed:Math.random()*1e6,lastCell:'',flickerAt:0,burned:new WeakSet(),decor:new Map(),puddleLevel:'0'};
  const q=id=>document.getElementById(id);const safe=fn=>{try{return fn();}catch(e){}};
  const cam=()=>safe(()=>typeof camera!=='undefined'?camera:window.camera);
  const sc=()=>safe(()=>typeof scene!=='undefined'?scene:window.scene);
  const active=()=>safe(()=>typeof gameActive!=='undefined'&&gameActive);
  const h=(x)=>{let n=Math.sin(x*12.9898+78.233)*43758.5453;return n-Math.floor(n);};
  function ensure(){const s=sc();if(!s||!window.THREE)return null;if(!S.group){S.group=new THREE.Group();S.group.name='RM_LIVING_WORLD';s.add(S.group);}return S.group;}
  function mat(c,rough=.8){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:0});}
  function makePuddle(x,z,scale){const g=ensure();if(!g)return;const m=new THREE.Mesh(new THREE.CircleGeometry(scale,18),new THREE.MeshStandardMaterial({color:0x302f2a,roughness:.15,metalness:.05,transparent:true,opacity:.46}));m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);m.scale.y=.62;g.add(m);return m;}
  function makeStain(x,z,rot,scale){const g=ensure();if(!g)return;const m=new THREE.Mesh(new THREE.CircleGeometry(scale,7),new THREE.MeshBasicMaterial({color:0x574631,transparent:true,opacity:.2,depthWrite:false}));m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.018,z);g.add(m);return m;}
  function makeBelonging(x,z,k){const g=ensure();if(!g||k===null)return;let o;if(k%4===0){o=new THREE.Mesh(new THREE.BoxGeometry(.32,.22,.14),mat(0x151515));o.position.y=.12;}else if(k%4===1){o=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.34,8),mat(0x52636b));o.rotation.z=.3;o.position.y=.17;}else if(k%4===2){o=new THREE.Mesh(new THREE.BoxGeometry(.48,.05,.32),mat(0x7b5d3b));o.position.y=.035;}else{o=new THREE.Mesh(new THREE.BoxGeometry(.28,.34,.25),mat(0x3d474b));o.position.y=.17;}o.position.x=x;o.position.z=z;g.add(o);return o;}
  function makeVending(x,z){const g=ensure();if(!g)return;const b=new THREE.Mesh(new THREE.BoxGeometry(.65,1.55,.5),mat(0x2d302c));b.position.set(x,.775,z);g.add(b);const glass=new THREE.Mesh(new THREE.PlaneGeometry(.44,.85),new THREE.MeshBasicMaterial({color:0xb9c0b7,transparent:true,opacity:.32}));glass.position.set(x,.95,z-.255);g.add(glass);}
  function makePhone(x,z){const g=ensure();if(!g)return;const base=new THREE.Mesh(new THREE.BoxGeometry(.28,.09,.2),mat(0x222222));base.position.set(x,.05,z);g.add(base);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.18,8),mat(0x1c1c1c));stem.position.set(x,.16,z);g.add(stem);}
  function makeFurniture(x,z,k){const g=ensure();if(!g)return;const body=new THREE.Mesh(new THREE.BoxGeometry(.9,.45,.45),mat(k%2?0x4f493e:0x262826));body.position.set(x,.23,z);g.add(body);const back=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.12),mat(k%2?0x4f493e:0x262826));back.position.set(x,.45,z+.2);g.add(back);}
  function seedCell(cx,cz){
    const g=ensure();if(!g)return;const id=cx+','+cz;if(S.decor.has(id))return;S.decor.set(id,1);
    const r=h(cx*91.7+cz*17.3+S.seed), r2=h(cx*11.2-cz*53.1+S.seed);
    const baseX=cx*36,baseZ=cz*36;
    if(r<.42)makePuddle(baseX+(r-.5)*24,baseZ+(r2-.5)*24,1.2+r2*1.4);
    if(r>.18&&r<.65)makeStain(baseX+(r2-.5)*25,baseZ+(r-.5)*25,r2*6.2,.5+r*.7);
    if(r2>.72)makeBelonging(baseX+(h(cx+7)-.5)*25,baseZ+(h(cz+13)-.5)*25,Math.floor(r*10));
    if(r2<.12)makeVending(baseX+8,baseZ-7);
    if(r>.82)makePhone(baseX-7,baseZ+6);
    if(r>.58&&r2>.52)makeFurniture(baseX-9+(r*4),baseZ+8,(cx+cz)&1);
  }
  function prune(){const g=ensure(),c=cam();if(!g||!c)return;const px=Math.floor(c.position.x/36),pz=Math.floor(c.position.z/36);for(const [id] of S.decor){const [x,z]=id.split(',').map(Number);if(Math.abs(x-px)>2||Math.abs(z-pz)>2){S.decor.delete(id);}}const keep=[];g.children.forEach(o=>{if(o.userData&&o.userData.keep)keep.push(o);});if(g.children.length>260){while(g.children.length>220){const o=g.children.shift();safe(()=>o.geometry?.dispose());safe(()=>o.material?.dispose());}}
  }
  function cell(){const c=cam();if(!c)return;const cx=Math.floor(c.position.x/36),cz=Math.floor(c.position.z/36),id=cx+','+cz;if(id===S.lastCell)return;S.lastCell=id;for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)seedCell(x,z);if(S.puddleLevel!==String(typeof currentLevel!=='undefined'?currentLevel:'0')){S.puddleLevel=String(typeof currentLevel!=='undefined'?currentLevel:'0');}}
  function flicker(){const s=sc();if(!s)return;const lights=[];s.traverse(o=>{if(o&&o.isLight&&o.intensity>0)lights.push(o);});if(!lights.length)return;const now=performance.now();if(now<S.flickerAt)return;S.flickerAt=now+9000+Math.random()*18000;const l=lights[Math.floor(Math.random()*lights.length)];if(S.burned.has(l))return;const old=l.intensity;let cycles=0;const t=setInterval(()=>{cycles++;l.intensity=cycles%2?old*.18:old;if(cycles>=7){clearInterval(t);if(Math.random()<.22){l.intensity=0;S.burned.add(l);safe(()=>window.BackroomsHorror?.announce?.('A fluorescent tube burned out.'));}}},90);
  }
  function roomEcho(){if(Math.random()>.08)return;const g=ensure();if(!g)return;const c=cam();if(!c)return;const echo=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.3,.08),new THREE.MeshBasicMaterial({color:0x6b5c31,transparent:true,opacity:.1,depthWrite:false}));echo.position.set(c.position.x+(Math.random()-.5)*18,1.15,c.position.z+(Math.random()-.5)*18);echo.rotation.y=Math.random()*Math.PI;g.add(echo);setTimeout(()=>{safe(()=>{g.remove(echo);echo.geometry.dispose();echo.material.dispose();});},11000+Math.random()*8000);}
  function loop(){if(active()){cell();if(Math.random()<.035)flicker();if(Math.random()<.004)roomEcho();prune();}requestAnimationFrame(loop);}
  function init(){ensure();loop();}
  window.addEventListener('load',()=>setTimeout(init,500));
  window.BackroomsLiving={reset:()=>{S.lastCell='';S.decor.clear();if(S.group)S.group.clear();}};
})();
