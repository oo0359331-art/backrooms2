/* Backrooms visual overhaul — distinct, procedural level identities without external image assets. */
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  let overlay=null;
  let wrapped=false;

  function textureCanvas(base, accent, grid=false, speckle=true){
    const c=document.createElement('canvas'); c.width=256; c.height=256;
    const ctx=c.getContext('2d');
    ctx.fillStyle=base; ctx.fillRect(0,0,c.width,c.height);
    if(grid){
      ctx.strokeStyle=accent; ctx.lineWidth=2;
      for(let x=0;x<=256;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,256);ctx.stroke();}
      for(let y=0;y<=256;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
    }
    if(speckle){
      for(let i=0;i<1700;i++){
        const a=Math.random()*0.09; const s=Math.random()*2.5;
        ctx.fillStyle=accent.replace(')',','+a+')');
        ctx.globalAlpha=a;
        ctx.fillRect(Math.random()*256,Math.random()*256,s,s);
      }
      ctx.globalAlpha=1;
    }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8); t.colorSpace=THREE.SRGBColorSpace;
    return t;
  }

  function clearOverlay(){
    if(!overlay || typeof scene==='undefined') return;
    scene.remove(overlay);
    overlay.traverse(o=>{
      if(o.geometry) o.geometry.dispose();
      if(o.material){ const m=Array.isArray(o.material)?o.material:[o.material]; m.forEach(x=>{if(x.map)x.map.dispose();x.dispose();}); }
    });
    overlay=null;
  }

  function addFluorescent(x,y,z,weak=false){
    const fixture=new THREE.Mesh(
      new THREE.BoxGeometry(3.8,.08,.34),
      new THREE.MeshStandardMaterial({color:0xf5f0dc,emissive:0xfff4bf,emissiveIntensity:weak?.7:1.6,roughness:.35})
    );
    fixture.position.set(x,y,z); overlay.add(fixture);
    const light=new THREE.PointLight(0xfff0c4,weak?1.0:2.8,12);
    light.position.set(x,y-.1,z); overlay.add(light);
    if(Math.random()<.18){
      setInterval(()=>{if(fixture.parent){light.intensity=Math.random()<.45?0:weak?.8:2.4;}},180+Math.random()*380);
    }
  }

  function addPoolLight(x,y,z){
    const strip=new THREE.Mesh(
      new THREE.BoxGeometry(4,.08,.18),
      new THREE.MeshStandardMaterial({color:0xf4ffff,emissive:0xb8ffff,emissiveIntensity:2.5,roughness:.2})
    );
    strip.position.set(x,y,z); overlay.add(strip);
    const light=new THREE.PointLight(0xa9ffff,2.4,16); light.position.set(x,y-.15,z); overlay.add(light);
  }

  function makeTileMaterial(){
    const map=textureCanvas('#d8e6e6','rgba(80,140,145,1)',true,false); map.repeat.set(10,10);
    return new THREE.MeshStandardMaterial({map,roughness:.38,metalness:.02});
  }

  function buildLevel0(){
    const wall= new THREE.MeshStandardMaterial({map:textureCanvas('#d7b83f','rgba(115,87,0,1)',false,true),roughness:.96});
    const carpet= new THREE.MeshStandardMaterial({map:textureCanvas('#846d25','rgba(35,25,0,1)',false,true),roughness:1});
    const ceiling= new THREE.MeshStandardMaterial({color:0xd8d1b3,roughness:1});

    const floor=new THREE.Mesh(new THREE.PlaneGeometry(220,220),carpet); floor.rotation.x=-Math.PI/2; floor.position.y=.01; overlay.add(floor);
    const roof=new THREE.Mesh(new THREE.PlaneGeometry(220,220),ceiling); roof.rotation.x=Math.PI/2; roof.position.y=5.0; overlay.add(roof);

    const wallPieces=[];
    for(let i=0;i<12;i++){
      const x=-90+i*16;
      const back=new THREE.Mesh(new THREE.BoxGeometry(.3,5,16),wall); back.position.set(x,2.5,-92); overlay.add(back); wallPieces.push(back);
    }
    for(let i=0;i<12;i++){
      const z=-90+i*16;
      const side=new THREE.Mesh(new THREE.BoxGeometry(16,5,.3),wall); side.position.set(-92,2.5,z); overlay.add(side);
    }

    for(let x=-72;x<=72;x+=12) for(let z=-72;z<=72;z+=12) addFluorescent(x,4.65,z,Math.random()<.2);

    for(let i=0;i<35;i++){
      const trim=new THREE.Mesh(new THREE.BoxGeometry(5,.12,.08),new THREE.MeshStandardMaterial({color:0xc8b239,roughness:.9}));
      trim.position.set((Math.random()-.5)*180,.07,(Math.random()-.5)*180); overlay.add(trim);
    }
  }

  function buildLevel1(){
    const concrete=new THREE.MeshStandardMaterial({map:textureCanvas('#55585b','rgba(20,20,20,1)',false,true),roughness:1});
    const floorMat=new THREE.MeshStandardMaterial({map:textureCanvas('#34383b','rgba(0,0,0,1)',false,true),roughness:1});
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(260,260),floorMat); floor.rotation.x=-Math.PI/2; floor.position.y=.01; overlay.add(floor);
    for(let x=-100;x<=100;x+=20){ for(let z=-100;z<=100;z+=20){
      const p=new THREE.Mesh(new THREE.CylinderGeometry(.8,.95,5,10),concrete); p.position.set(x,2.5,z); overlay.add(p);
    }}
    for(let x=-90;x<=90;x+=18) for(let z=-90;z<=90;z+=18){
      const lamp=new THREE.Mesh(new THREE.BoxGeometry(3,.12,.25),new THREE.MeshStandardMaterial({color:0xffd7a0,emissive:0xff6a00,emissiveIntensity:1.2})); lamp.position.set(x,4.7,z); overlay.add(lamp);
      const light=new THREE.PointLight(0xff9a45,1.5,13); light.position.copy(lamp.position); overlay.add(light);
    }
  }

  function buildPoolrooms(){
    const tile=makeTileMaterial();
    const ceilingMat=new THREE.MeshStandardMaterial({color:0xe9f1f0,roughness:.85});
    const waterMat=new THREE.MeshStandardMaterial({color:0x6bb7c4,transparent:true,opacity:.68,roughness:.12,metalness:.08});

    const floor=new THREE.Mesh(new THREE.PlaneGeometry(190,190),tile); floor.rotation.x=-Math.PI/2; floor.position.y=.02; overlay.add(floor);
    const water=new THREE.Mesh(new THREE.PlaneGeometry(120,82),waterMat); water.rotation.x=-Math.PI/2; water.position.set(18,.24,12); overlay.add(water);
    const roof=new THREE.Mesh(new THREE.PlaneGeometry(190,190),ceilingMat); roof.rotation.x=Math.PI/2; roof.position.y=8; overlay.add(roof);

    const wallMat=makeTileMaterial();
    const perimeter=[
      [0,4,-84,168,8,.6],[0,4,84,168,8,.6],[-84,4,0,.6,8,168],[84,4,0,.6,8,168]
    ];
    for(const [x,y,z,sx,sy,sz] of perimeter){ const w=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),wallMat); w.position.set(x,y,z); overlay.add(w); }

    for(let x=-72;x<=72;x+=18) for(let z=-72;z<=72;z+=18) addPoolLight(x,7.55,z);

    for(let i=0;i<16;i++){
      const x=-60+(i%8)*17, z=-52+Math.floor(i/8)*70;
      const col=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,7.5,20),tile); col.position.set(x,3.75,z); overlay.add(col);
    }

    for(let i=0;i<6;i++){
      const step=new THREE.Mesh(new THREE.BoxGeometry(8,.28,1.3),tile); step.position.set(-22+i*1.2,.4,42); overlay.add(step);
    }
  }

  function apply(id){
    clearOverlay(); overlay=new THREE.Group(); overlay.name='LEVEL_VISUAL_OVERHAUL'; scene.add(overlay);
    if(String(id)==='0') buildLevel0();
    else if(String(id)==='1') buildLevel1();
    else if(String(id)==='2') buildPoolrooms();
  }

  function wrap(){
    if(wrapped || typeof window.buildLevel!=='function') return false;
    const old=window.buildLevel;
    window.buildLevel=buildLevel=function(level){
      const result=old.apply(this,arguments);
      setTimeout(()=>{try{apply(level);}catch(e){console.warn('Level visual overhaul:',e);}},30);
      return result;
    };
    wrapped=true;
    if(typeof currentLevel!=='undefined') setTimeout(()=>{try{apply(currentLevel);}catch(_){ }},50);
    return true;
  }

  function boot(){ if(!wrap()) return setTimeout(boot,120); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
