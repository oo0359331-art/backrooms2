/* Backrooms Remastered — multi-level visual remodel pack.
   Adds level-specific architecture, lighting, props, water, signage, and atmosphere
   without replacing the existing gameplay/collision builders. PC + mobile safe. */
(function(){
  'use strict';
  const S={group:null,active:'',cells:new Set(),lastCell:''};
  const safe=f=>{try{return f()}catch(e){return null}};
  const sceneRef=()=>safe(()=>typeof scene!=='undefined'?scene:window.scene);
  const cameraRef=()=>safe(()=>typeof camera!=='undefined'?camera:window.camera);
  const T=()=>window.THREE;
  const selectRef=()=>document.getElementById('level-select');
  const currentLevel=()=>selectRef()?.value||'0';
  function ensure(){const sc=sceneRef(),t=T();if(!sc||!t)return null;if(!S.group){S.group=new t.Group();S.group.name='LEVEL_REMODEL_PACK';sc.add(S.group);}return S.group;}
  function mat(c,r=.82,m=0,e=0,ei=0){const t=T();const x=new t.MeshStandardMaterial({color:c,roughness:r,metalness:m});if(e){x.emissive.setHex(e);x.emissiveIntensity=ei;}return x;}
  function mesh(g,m,x,y,z,ry=0){const t=T(),q=new t.Mesh(g,m);q.position.set(x,y,z);q.rotation.y=ry;q.castShadow=true;q.receiveShadow=true;ensure()?.add(q);return q;}
  function box(w,h,d,c,x,y,z,ry=0,rough=.82,metal=0,emit=0){const t=T();return mesh(new t.BoxGeometry(w,h,d),mat(c,rough,metal,emit?c:0,emit),x,y,z,ry)}
  function cyl(r,h,c,x,y,z,rough=.8){const t=T();return mesh(new t.CylinderGeometry(r,r,h,18),mat(c,rough),x,y,z)}
  function light(x,y,z,c,int=1.0,dist=18){const t=T(),l=new t.PointLight(c,int,dist);l.position.set(x,y,z);ensure()?.add(l);return l;}
  function panelLight(x,z,c=0xfff1cc,int=1.0,dist=16,ry=0){box(2.5,.06,.36,0xf0ead0,x,4.85,z,ry,.55,0);const g=box(2.15,.025,.23,0xffffff,x,4.81,z,ry,.35,0);if(g.material){g.material.emissive.setHex(c);g.material.emissiveIntensity=.75;}light(x,4.65,z,c,int,dist);}
  function trimWall(x,z,ry=0,c=0x706b59){box(.06,2.6,8,c,x,1.45,z,ry,.9);}
  function door(x,z,ry=0,c=0x2f302e,h=2.45,w=1.45){box(w+.22,h+.22,.13,0x161715,x,1.28,z,ry,.92);box(w,h,.08,c,x,1.28,z,ry,.95);box(.04,h-.3,.04,0xd6d2b9,x-w*.32,1.28,z,ry,.55,.1);}
  function vent(x,z,ry=0){box(.9,.48,.05,0x30312d,x,3.15,z,ry,.72,.3);for(let i=-3;i<=3;i++)box(.55,.025,.025,0x9a9b91,x,3.15,z+i*.06,ry,.55,.35);}
  function consoleUnit(x,z,accent=0x80917c){box(.55,.9,.38,0x252724,x,.48,z,.08,.6,.4);const s=box(.4,.16,.04,accent,x,.9,z-.18,.08,.45,.2);s.material.emissive.setHex(accent);s.material.emissiveIntensity=.45;}
  function bench(x,z,ry=0){box(2.4,.12,.55,0x6b6252,x,.78,z,ry,.9);box(.12,.72,.12,0x3a3934,x-1,.38,z-.2,ry,.95,.1);box(.12,.72,.12,0x3a3934,x+1,.38,z-.2,ry,.95,.1);}
  function vending(x,z,accent=0x6b6352,ry=0){box(1.15,2.0,.55,0x242521,x,1.0,z,ry,.72,.2);box(.82,1.18,.05,accent,x,1.25,z-.29,ry,.5,.05);box(.78,.22,.04,0x171815,x,2.03,z-.3,ry,.42,.25);}
  function phone(x,z,ry=0){box(.24,.42,.08,0x262824,x,1.28,z,ry,.8,.1);box(.12,.08,.04,0xc7c7bd,x,1.53,z-.045,ry,.4,.1);}
  function puddle(x,z,sx,sz,c=0x263a3d,opacity=.55){const t=T(),m=new t.MeshStandardMaterial({color:c,transparent:true,opacity,roughness:.18,metalness:.12}),q=new t.Mesh(new t.CircleGeometry(1,32),m);q.scale.set(sx,sz,1);q.rotation.x=-Math.PI/2;q.position.set(x,.035,z);ensure()?.add(q);}
  function sign(text,x,y,z,ry=0){const t=T(),cv=document.createElement('canvas');cv.width=512;cv.height=128;const k=cv.getContext('2d');k.fillStyle='rgba(20,20,18,.92)';k.fillRect(0,0,512,128);k.fillStyle='#151512';k.fillRect(8,8,496,112);k.fillStyle='#ded4b1';k.font='bold 30px Arial';k.textAlign='center';k.fillText(text,256,78);const sp=new t.Sprite(new t.SpriteMaterial({map:new t.CanvasTexture(cv),transparent:true,depthTest:false}));sp.scale.set(3.2,.8,1);sp.position.set(x,y,z);sp.rotation.y=ry;ensure()?.add(sp);}
  function reset(){const g=S.group,sc=sceneRef();if(g&&sc)sc.remove(g);if(g)g.traverse?.(o=>{safe(()=>o.geometry?.dispose());if(Array.isArray(o.material))o.material.forEach(m=>safe(()=>m.dispose()));else safe(()=>o.material?.dispose());});S.group=null;S.cells.clear();S.lastCell='';S.active='';}
  function levelOneCell(cx,cz){const id=cx+','+cz;if(S.cells.has(id))return;S.cells.add(id);const bx=cx*24,bz=cz*24,r=((cx*928371+cz*364583)&0xffff)/65535;panelLight(bx,bz,0xbfd0d0,.7,14);if(r>.32)panelLight(bx+8,bz-7,0xe1ddd0,.55,13);if(r>.22)trimWall(bx-11.9,bz-2,Math.PI/2,0x5b5b54);if(r>.52)trimWall(bx+11.9,bz+5,Math.PI/2,0x5f625e);if(r>.38)door(bx+6.8,bz+11.85,0,0x6b6b62);if(r>.72)door(bx-8,bz-11.85,0,0x4a4c49);if(r>.44)vending(bx+7,bz+5,r>.7?0x5f735f:0x665e51,Math.PI/2);if(r>.65)consoleUnit(bx-6,bz-6,0x7c9184);if(r>.56)phone(bx+4,bz-10);if(r>.48)bench(bx-4,bz+7,Math.PI/2);if(r>.78)vent(bx+11.7,bz-7,Math.PI/2);if(r>.72)puddle(bx-4,bz-2,1.3,.55,0x263a3d,.22);if(r>.82)sign(r>.9?'SUPPLIES':'MAINT',bx,bz>0?3.0:2.8,bz+11.7);}
  function remodelLevel1(){const c=cameraRef();if(!c)return;const cx=Math.floor(c.position.x/24),cz=Math.floor(c.position.z/24),now=cx+','+cz;if(S.lastCell===now)return;S.lastCell=now;for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++)levelOneCell(x,z);}
  function poolColumns(){for(let x=-36;x<=36;x+=18)for(let z=-36;z<=36;z+=18)if((x+z)%36===0){cyl(.55,4.6,0xc7d6d2,x,2.3,z,.72);cyl(.72,.08,0xf0f4f0,x,4.62,z,.5);}for(let x=-36;x<=36;x+=18)panelLight(x,0,0xb9e7e5,.38,22);}
  function remodelPools(deep=false){puddle(-8,-6,7,4,deep?0x0c3944:0x5e9da3,.25);puddle(9,8,5,3,deep?0x0a2730:0x79b5b5,.25);for(let i=-2;i<=2;i++){panelLight(i*18,0,deep?0x66b9cf:0x8fe0df,deep?.55:.8,deep?18:21);panelLight(i*18,14,deep?0x385d92:0xcfeff0,deep?.45:.6,deep?18:21);}poolColumns();for(let z=-32;z<=32;z+=16)door(z%32===0?4:-4,z,0,deep?0x17323a:0x91aaa5,2.35,1.35);if(deep){sign('LOWER POOL ACCESS',0,3.4,-34);for(let i=0;i<9;i++)puddle(-26+(i%3)*26,-28+Math.floor(i/3)*26,3.5,1.4,0x072d38,.28);}else sign('QUIET WATER — KEEP VOICES LOW',0,3.4,-34);}
  function remodelHotel(){for(let z=-48;z<=48;z+=16){panelLight(0,z,0xffd8a3,.45,20);door(-21,z,Math.PI/2,0x5a5145,2.5,1.5);door(21,z,-Math.PI/2,0x4a4037,2.5,1.5);if(z%32===0){vending(-17,z,0x625848);vending(17,z,0x514941);}}bench(-6,-20);bench(6,20,Math.PI/2);phone(-18,20,Math.PI/2);phone(18,-20,-Math.PI/2);sign('SERVICE ELEVATOR',0,3.7,18);sign('ROOMS 001 — 099',0,3.7,-18);for(let i=-2;i<=2;i++)puddle(i*9,30+(i%2)*2,1.8,.6,0x302b29,.2);}
  function remodelOffices(){for(let x=-40;x<=40;x+=16){panelLight(x,-15,0x9cc4cb,.52,18);panelLight(x,15,0xb5d8d6,.42,18);}[-36,0,36].forEach((x,i)=>{vending(x,i===1?6:-7,i===1?0x53777d:0x555c59,Math.PI/2);phone(x+(i-1)*3,i===1?14:-14);});for(let i=0;i<12;i++)puddle(-36+(i%6)*14,-18+Math.floor(i/6)*36,2.8,1.1,0x27484e,.28);sign('FLOOD CONTROL / EMERGENCY',0,3.65,27);vent(46,0,Math.PI/2);}
  function remodelTunnels(){for(let z=-52;z<=52;z+=13){panelLight(0,z,0xb9d1b9,.32,14);if(z%26===0){vent(-11.15,z,Math.PI/2);vent(11.15,z,Math.PI/2);}}for(let x=-30;x<=30;x+=15)consoleUnit(x,0,0x7f8e7f);sign('SUBSTATION CONTROL',0,4.9,-52);puddle(4,20,2.2,.55,0x222b28,.24);}
  function remodelArchive(){for(let x=-35;x<=35;x+=14)panelLight(x,0,0xf1dfb8,.25,20);for(let z=-30;z<=30;z+=15){bench(-15,z,Math.PI/2);bench(15,z,-Math.PI/2);}for(let x=-30;x<=30;x+=20)vending(x,-36,0x4a4c47);phone(-36,18,Math.PI/2);phone(36,-18,-Math.PI/2);sign('ARCHIVE 021 / STAFF ONLY',0,4.2,-39);}
  function remodelGarden(){for(let x=-40;x<=40;x+=16)for(let z=-40;z<=40;z+=16)if(((x/16+z/16)&1)===0)cyl(.18,.9,0x587f5b,x,.45,z,.95);for(let a=0;a<8;a++){const ang=a*Math.PI/4;panelLight(Math.cos(ang)*22,Math.sin(ang)*22,0xbdf3ce,.32,25);}bench(0,22);bench(0,-22);sign('QUIET GARDEN — MAINTENANCE',0,5.0,-38);puddle(-14,-5,2.5,1.0,0x37654c,.18);}
  function apply(id){reset();ensure();S.active=id;S.lastCell='';if(id==='1'){remodelLevel1();return;}if(id==='2'){remodelPools(false);return;}if(id==='x37b'){remodelPools(true);return;}if(id==='x6'){remodelHotel();return;}if(id==='x14'){remodelOffices();return;}if(id==='x9'){remodelTunnels();return;}if(id==='x21'){remodelArchive();return;}if(id==='x3999'){remodelGarden();return;}if(id==='0')return;}
  function tick(){const id=currentLevel(),active=safe(()=>typeof gameActive!=='undefined'&&gameActive);if(active&&id!==S.active)apply(id);if(active&&id==='1')remodelLevel1();requestAnimationFrame(tick);}
  function init(){ensure();apply(currentLevel());tick();}
  window.addEventListener('load',()=>setTimeout(init,900));
  window.LevelRemodelPack={apply,reset};
})();
