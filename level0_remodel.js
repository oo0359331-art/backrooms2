/* Level 0 visual remodel — environment dressing, ceiling fixtures, wall details, doors and subtle room variation. */
(function(){
  'use strict';
  const S={group:null,lastCell:'',seed:Math.floor(Math.random()*2147483647),cells:new Set()};
  const safe=fn=>{try{return fn();}catch(e){}};
  const getScene=()=>safe(()=>typeof scene!=='undefined'?scene:window.scene);
  const getCamera=()=>safe(()=>typeof camera!=='undefined'?camera:window.camera);
  const q=id=>document.getElementById(id);
  function ensure(){const s=getScene();if(!s||!window.THREE)return null;if(!S.group){S.group=new THREE.Group();S.group.name='LEVEL0_REMODEL';s.add(S.group);}return S.group;}
  function rnd(x,z,s=0){let n=(x*374761393+z*668265263+s*1447+S.seed)|0;n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return (n>>>0)/4294967296;}
  function mat(c,r=.82,e=0){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:.02,emissive:e?c:0,emissiveIntensity:e});}
  function box(x,y,z,c,px,py,pz){const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat(c));m.position.set(px,py,pz);m.castShadow=true;m.receiveShadow=true;S.group.add(m);return m;}
  function wallPanel(x,y,z,ry){const m=box(.025,1.15,.82,0x9b8a58,x,y,z);m.rotation.y=ry;return m;}
  function fixture(x,z){
    box(2.1,.06,.32,0xf4e5bc,x,4.86,z);
    const glow=box(1.9,.025,.22,0xffffdd,x,4.82,z);glow.material.emissive.setHex(0xfff7d6);glow.material.emissiveIntensity=.65;
    const L=new THREE.PointLight(0xffefc7,1.1,12);L.position.set(x,4.72,z);S.group.add(L);
  }
  function doorway(x,z,ry){
    const frame=mat(0x4e4a38);
    const a=box(.12,2.8,.12,0x4e4a38,x-.9,1.4,z);a.rotation.y=ry;
    const b=box(.12,2.8,.12,0x4e4a38,x+.9,1.4,z);b.rotation.y=ry;
    const top=box(1.92,.12,.12,0x4e4a38,x,2.76,z);top.rotation.y=ry;
    const door=box(1.55,2.55,.07,0x6e644d,x,1.28,z);door.rotation.y=ry;door.material.roughness=.93;
  }
  function wallArt(x,z,ry,k){
    const board=box(.9,.62,.035,k%2?0x6c5f48:0x3d463f,x,1.75,z);board.rotation.y=ry;
    for(let i=0;i<3;i++){const line=box(.65,.025,.015,0xb7aa84,x,1.86+i*.14,z);line.rotation.y=ry;}
  }
  function seedCell(cx,cz){
    const g=ensure();if(!g)return;const id=cx+','+cz;if(S.cells.has(id))return;S.cells.add(id);
    const bx=cx*36,bz=cz*36;
    fixture(bx,bz);if(rnd(cx,cz,2)>.35)fixture(bx+9,bz-11);
    if(rnd(cx,cz,3)>.48)doorway(bx+14.1,bz+4,(rnd(cx,cz,4)>.5?Math.PI/2:0));
    if(rnd(cx,cz,5)>.62)wallPanel(bx-17.96,1.85,bz-5,Math.PI/2);
    if(rnd(cx,cz,6)>.7)wallArt(bx+17.94,bz+8,Math.PI/2,Math.floor(rnd(cx,cz,7)*3)+1);
    if(rnd(cx,cz,8)>.76){
      const phone=box(.28,.08,.2,0x191a1a,bx-10,1.15,bz+17);phone.rotation.y=Math.PI/2;
      box(.04,.22,.04,0x202020,bx-10,1.29,bz+17);
    }
    if(rnd(cx,cz,9)>.8){
      box(.76,.84,.08,0x37372f,bx+13,1.08,bz-16);box(.65,.52,.05,0x4a4a3f,bx+13,1.18,bz-15.94);
    }
  }
  function prune(){const c=getCamera(),g=S.group;if(!c||!g)return;const cx=Math.floor(c.position.x/36),cz=Math.floor(c.position.z/36);for(const id of Array.from(S.cells)){const [x,z]=id.split(',').map(Number);if(Math.abs(x-cx)>2||Math.abs(z-cz)>2)S.cells.delete(id);}while(g.children.length>420){const o=g.children.shift();safe(()=>o.dispose?.());safe(()=>o.geometry?.dispose());safe(()=>o.material?.dispose());}}
  function loop(){const active=safe(()=>typeof gameActive!=='undefined'&&gameActive);if(active){const c=getCamera();if(c){const cx=Math.floor(c.position.x/36),cz=Math.floor(c.position.z/36),id=cx+','+cz;if(id!==S.lastCell){S.lastCell=id;for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++)seedCell(x,z);}prune();}}requestAnimationFrame(loop);}
  function init(){ensure();loop();}
  window.addEventListener('load',()=>setTimeout(init,700));
  window.Level0Remodel={reset:()=>{S.cells.clear();S.lastCell='';if(S.group)S.group.clear();}};
})();