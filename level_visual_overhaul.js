/* Backrooms visual overhaul — lightweight version.
   Keeps the level identity but avoids hundreds of realtime lights that can freeze browsers. */
(function(){
  'use strict';
  let overlay=null, wrapped=false;

  function textureCanvas(base, accent, grid=false, speckle=true){
    const c=document.createElement('canvas'); c.width=256; c.height=256;
    const ctx=c.getContext('2d'); ctx.fillStyle=base; ctx.fillRect(0,0,256,256);
    if(grid){
      ctx.strokeStyle=accent; ctx.lineWidth=2;
      for(let x=0;x<=256;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
      for(let y=0;y<=256;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
    }
    if(speckle){
      ctx.fillStyle=accent;
      for(let i=0;i<700;i++)ctx.globalAlpha=Math.random()*.07,ctx.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*2,1+Math.random()*2);
      ctx.globalAlpha=1;
    }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8); return t;
  }

  function clearOverlay(){
    if(!overlay||typeof scene==='undefined')return;
    scene.remove(overlay);
    overlay.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const m=Array.isArray(o.material)?o.material:[o.material];m.forEach(x=>{if(x.map)x.map.dispose();x.dispose();});}});
    overlay=null;
  }

  function fixture(x,y,z,kind){
    const color=kind==='pool'?0xeaffff:kind==='level1'?0xffd8a8:0xf4edcf;
    const emissive=kind==='pool'?0xa7ffff:kind==='level1'?0xff8a30:0xfff0a0;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(3.8,.08,.34),new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:1.6,roughness:.4}));
    mesh.position.set(x,y,z); overlay.add(mesh);
    if(Math.random()<.28){
      const light=new THREE.PointLight(kind==='pool'?0xa9ffff:kind==='level1'?0xff9a45:0xffefbf,kind==='pool'?1.5:1.3,11);
      light.position.set(x,y-.12,z); overlay.add(light);
    }
  }

  function buildLevel0(){
    const carpet=new THREE.MeshStandardMaterial({map:textureCanvas('#846d25','rgba(35,25,0,1)',false,true),roughness:1});
    const ceiling=new THREE.MeshStandardMaterial({color:0xd8d1b3,roughness:1});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),carpet);floor.rotation.x=-Math.PI/2;floor.position.y=.01;overlay.add(floor);
    const roof=new THREE.Mesh(new THREE.PlaneGeometry(220,220),ceiling);roof.rotation.x=Math.PI/2;roof.position.y=5;overlay.add(roof);
    for(let x=-72;x<=72;x+=24)for(let z=-72;z<=72;z+=24)fixture(x,4.65,z,'level0');
    for(let i=0;i<18;i++){const trim=new THREE.Mesh(new THREE.BoxGeometry(5,.12,.08),new THREE.MeshStandardMaterial({color:0xc8b239,roughness:.9}));trim.position.set((Math.random()-.5)*180,.07,(Math.random()-.5)*180);overlay.add(trim);}
  }

  function buildLevel1(){
    const concrete=new THREE.MeshStandardMaterial({map:textureCanvas('#55585b','rgba(20,20,20,1)',false,true),roughness:1});
    const floorMat=new THREE.MeshStandardMaterial({map:textureCanvas('#34383b','rgba(0,0,0,1)',false,true),roughness:1});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(260,260),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=.01;overlay.add(floor);
    for(let x=-90;x<=90;x+=30)for(let z=-90;z<=90;z+=30){const p=new THREE.Mesh(new THREE.CylinderGeometry(.85,.95,5,10),concrete);p.position.set(x,2.5,z);overlay.add(p);}
    for(let x=-90;x<=90;x+=30)for(let z=-90;z<=90;z+=30)fixture(x,4.7,z,'level1');
  }

  function buildPoolrooms(){
    const tile=new THREE.MeshStandardMaterial({map:textureCanvas('#d8e6e6','rgba(80,140,145,1)',true,false),roughness:.38});tile.map.repeat.set(10,10);
    const ceilingMat=new THREE.MeshStandardMaterial({color:0xe9f1f0,roughness:.85});
    const waterMat=new THREE.MeshStandardMaterial({color:0x6bb7c4,transparent:true,opacity:.68,roughness:.12,metalness:.08});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(190,190),tile);floor.rotation.x=-Math.PI/2;floor.position.y=.02;overlay.add(floor);
    const water=new THREE.Mesh(new THREE.PlaneGeometry(120,82),waterMat);water.rotation.x=-Math.PI/2;water.position.set(18,.24,12);overlay.add(water);
    const roof=new THREE.Mesh(new THREE.PlaneGeometry(190,190),ceilingMat);roof.rotation.x=Math.PI/2;roof.position.y=8;overlay.add(roof);
    const wallMat=new THREE.MeshStandardMaterial({map:textureCanvas('#d8e6e6','rgba(80,140,145,1)',true,false),roughness:.45});
    [[0,4,-84,168,8,.6],[0,4,84,168,8,.6],[-84,4,0,.6,8,168],[84,4,0,.6,8,168]].forEach(([x,y,z,sx,sy,sz])=>{const w=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),wallMat);w.position.set(x,y,z);overlay.add(w);});
    for(let x=-72;x<=72;x+=36)for(let z=-72;z<=72;z+=36)fixture(x,7.55,z,'pool');
    for(let i=0;i<10;i++){const x=-54+(i%5)*27,z=-35+Math.floor(i/5)*70;const col=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,7.5,18),tile);col.position.set(x,3.75,z);overlay.add(col);}
  }

  function apply(id){clearOverlay();overlay=new THREE.Group();overlay.name='LEVEL_VISUAL_OVERHAUL';scene.add(overlay);if(String(id)==='0')buildLevel0();else if(String(id)==='1')buildLevel1();else if(String(id)==='2')buildPoolrooms();}
  function wrap(){
    if(wrapped||typeof window.buildLevel!=='function')return false;
    const old=window.buildLevel;
    window.buildLevel=buildLevel=function(level){const r=old.apply(this,arguments);setTimeout(()=>{try{apply(level);}catch(e){console.warn('Level visual overhaul:',e);}},30);return r;};
    wrapped=true; if(typeof currentLevel!=='undefined')setTimeout(()=>{try{apply(currentLevel);}catch(_){ }},60); return true;
  }
  function boot(){if(!wrap())return setTimeout(boot,120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
