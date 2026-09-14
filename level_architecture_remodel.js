/* Backrooms Remastered — full architecture pass for non-Level-0 spaces.
   Adds stronger silhouettes, room proportions, ceiling systems, structural beams,
   stairs, balconies, pipes, pool architecture, hotel halls, archive stacks,
   garden structures, and flooded-office geometry while leaving gameplay builders intact. */
(function(){
'use strict';
const S={group:null,active:'',built:new Set(),lastLevel:''};
const safe=f=>{try{return f()}catch(e){return null}};
const T=()=>window.THREE;
const sc=()=>safe(()=>typeof scene!=='undefined'?scene:window.scene);
const cam=()=>safe(()=>typeof camera!=='undefined'?camera:window.camera);
const level=()=>document.getElementById('level-select')?.value||'0';
function group(){const s=sc(),TH=T();if(!s||!TH)return null;if(!S.group){S.group=new TH.Group();S.group.name='LEVEL_ARCHITECTURE_REMODEL';s.add(S.group);}return S.group;}
function M(c,r=.82,m=0,e=0,ei=0){const x=new T().MeshStandardMaterial({color:c,roughness:r,metalness:m});if(e){x.emissive.setHex(e);x.emissiveIntensity=ei;}return x;}
function mesh(g,mat,x,y,z,ry=0){const q=new T().Mesh(g,mat);q.position.set(x,y,z);q.rotation.y=ry;q.castShadow=true;q.receiveShadow=true;group()?.add(q);return q;}
function box(w,h,d,c,x,y,z,ry=0,r=.82,m=0,e=0,ei=0){return mesh(new T().BoxGeometry(w,h,d),M(c,r,m,e,ei),x,y,z,ry);}
function cyl(r,h,c,x,y,z,seg=20,rgh=.82){return mesh(new T().CylinderGeometry(r,r,h,seg),M(c,rgh),x,y,z);}
function beam(x,y,z,w,h,d,c=0x30312e,ry=0){return box(w,h,d,c,x,y,z,ry,.88,.15);}
function pipe(x,y,z,len,axis='x',c=0x565a54,r=.16){const q=cyl(r,len,c,x,y,z,12,.64);if(axis==='x')q.rotation.z=Math.PI/2;if(axis==='z')q.rotation.x=Math.PI/2;return q;}
function light(x,y,z,c=.d2d5c6,int=.45,dist=18){const l=new T().PointLight(c,int,dist);l.position.set(x,y,z);group()?.add(l);return l;}
function panel(x,z,c=0xf2ead5,ry=0){box(2.5,.055,.42,0xd5cfb9,x,4.86,z,ry,.5);const q=box(2.15,.022,.25,0xffffff,x,4.82,z,ry,.35,0,c,.42);return q;}
function door(x,z,ry=0,c=0x343532,w=1.55,h=2.55){box(w+.24,h+.24,.13,0x161715,x,1.28,z,ry,.9);box(w,h,.08,c,x,1.28,z,ry,.96);box(.06,h-.25,.04,0xbab7aa,x-w*.3,1.28,z,ry,.55,.1);}
function stairs(x,z,steps=8,w=3.6,run=.72,rise=.28,ry=0,c=0x55554f){for(let i=0;i<steps;i++)box(w,rise*(i+1),run*(i+1),c,x+(Math.cos(ry)*i*run),rise*(i+1)/2,z+(Math.sin(ry)*i*run),ry,.9);}
function rail(x,y,z,len,ry=0,c=0x4a4b47){pipe(x,y,z,len,'x',c,.07).rotation.y=ry;pipe(x,y-.8,z,len,'x',c,.05).rotation.y=ry;for(let i=-4;i<=4;i++)pipe(x+i*(len/8),y-.38,z,.72,'y',c,.045);}
function arch(x,z,w=6,h=3.3,c=0xd0cbc0,ry=0){box(.32,h,.34,c,x-w/2,1.65,z,ry,.9);box(.32,h,.34,c,x+w/2,1.65,z,ry,.9);box(w+.62,.32,.34,c,x,3.05,z,ry,.88);}
function windowStrip(x,z,w=5,h=1.6,ry=0,c=0x4a5e61){box(w,h,.08,c,x,2.55,z,ry,.34,.2);box(w-.18,.12,.04,0xbec4bd,x,3.32,z,ry,.45,.1);}
function reset(){const s=sc();if(S.group&&s){s.remove(S.group);S.group.traverse?.(o=>{safe(()=>o.geometry?.dispose());if(Array.isArray(o.material))o.material.forEach(m=>safe(()=>m.dispose()));else safe(()=>o.material?.dispose());});}S.group=null;S.built.clear();S.active='';}
function level1(){
 const c=0x565853, dark=0x3a3d3a, metal=0x555956;
 for(let x=-42;x<=42;x+=14)for(let z=-42;z<=42;z+=14){
   beam(x,4.25, z, .5,8.5,.5, dark);
   if((x+z)%28===0)panel(x,z,0xd7ded8);
 }
 for(let z=-48;z<=48;z+=16){beam(0,5.0,z,92,.45,.45,metal);pipe(-26,4.65,z,20,'x',0x444743,.12);pipe(26,4.65,z,20,'x',0x444743,.12);}
 for(let x=-32;x<=32;x+=16){for(let z=-28;z<=28;z+=14){box(5,.08,2.2,0x77756a,x,.04,z,0,.98);box(.14,.45,2.1,0x4d514d,x-2.35,.26,z);}}
 box(14,.25,5.2,0x3e413e,0,3.65,18,.0,.9,.15);beam(0,4.05,15,14,.25,.5,0x202321);stairs(-4,-18,10,4,.62,.28,0,0x4f514d);rail(-2.0,3.55,-14,4.5,0);rail(-2.0,3.0,-14,4.5,0);
 door(0,-44,0,0x315f65,1.85,2.7);windowStrip(-10,-43,5,1.3);windowStrip(10,-43,5,1.3);
 box(16,3.4,.35,0x454844,0,1.7,-5);box(.3,2.8,8,0x454844,7.8,1.4,-1);box(.3,2.8,8,0x454844,-7.8,1.4,-1);
 light(0,4.8,-34,0xc5d4d5,.55,22);light(0,4.8,34,0xc9d1cf,.4,20);
}
function pool(deep=false){
 const tile=deep?0x304d53:0xd3d7d1, edge=deep?0x6f9498:0xeff1ec, water=deep?0x0b3140:0x2d9f9a;
 for(let x=-40;x<=40;x+=20){for(let z=-40;z<=40;z+=20){cyl(.65,5.2,tile,x,2.6,z,24,.72);box(1.1,.08,1.1,edge,x,5.25,z);}}
 for(let z=-48;z<=48;z+=16){panel(-30,z,deep?0x6e94a0:0xbce9e4,.0);panel(30,z,deep?0x54798f:0xd6f0ea,.0);}
 for(let i=-2;i<=2;i++){box(10,.12,3.2,edge,i*16,.08,16);box(10,.12,3.2,edge,i*16,.08,-16);}
 for(let z=-36;z<=36;z+=18){arch(0,z,8,3.8,edge,0);}
 box(24,.15,10,water,0,.08,0,.0,.18,.08);
 stairs(-32,-22,7,3.8,.62,.25,Math.PI/2,edge);rail(-29.8,2.0,-22,4.0,Math.PI/2);
 if(deep){for(let i=0;i<5;i++)pipe(-18+i*9,1.0,28,7,'z',0x42616b,.11);for(let i=0;i<6;i++)puddle(-25+(i%3)*25,-28+Math.floor(i/3)*24,3.5,1.4,0x062632,.3);}
 light(0,5.8,0,deep?0x3d8ba5:0xb8e6df,.6,24);
}
function hotel(){
 const wood=0x44372e, brass=0x8a7450, wall=0x655a4d;
 for(let z=-48;z<=48;z+=16){arch(-14,z,7,3.2,wall,Math.PI/2);arch(14,z,7,3.2,wall,Math.PI/2);panel(0,z,0xf3d7ad);}
 for(let z=-40;z<=40;z+=20){beam(-20,4.45,z,0.5,.4,.5,wood);beam(20,4.45,z,.5,.4,.5,wood);box(36,.18,6.6,0x5c4b3b,0,3.72,z,0,.92);}
 for(let z=-36;z<=36;z+=18){door(-17,z,Math.PI/2,0x4d3c31,1.4,2.5);door(17,z,-Math.PI/2,0x3d3129,1.4,2.5);}
 stairs(-6,-2,9,4,.58,.25,Math.PI/2,wood);rail(-3.6,2.5,0,4,Math.PI/2,brass);rail(-3.6,2.05,0,4,Math.PI/2,brass);
 for(let z=-32;z<=32;z+=16){for(let x=-8;x<=8;x+=8){box(.12,1.8,.45,brass,x,3.95,z,.0,.46,.45);}}
 light(0,4.9,0,0xffd5a0,.8,20);light(-12,4.6,28,0xffe0b9,.35,15);light(12,4.6,-28,0xffdfaf,.35,15);
}
function offices(){
 const concrete=0x66706e, glass=0x56767a, trim=0x303733;
 for(let x=-42;x<=42;x+=14){beam(x,4.4,0,.38,.65,88,trim);pipe(x,4.0,0,78,'z',0x4b514f,.12);}
 for(let z=-32;z<=32;z+=16){for(let x=-30;x<=30;x+=20){box(6.5,.09,4.3,0x6f7470,x,.05,z,0,.94);box(.08,2.5,4.0,glass,x-3.15,1.25,z);windowStrip(x,z-2.02,5.8,1.1,0);}}
 for(let x=-36;x<=36;x+=18){door(x,-31,0,0x3a4a48);door(x,31,Math.PI,0x354744);}
 for(let z=-24;z<=24;z+=12){box(3.5,2.5,.08,glass,-40,1.25,z,Math.PI/2,.28,.25);box(3.5,2.5,.08,glass,40,1.25,z,Math.PI/2,.28,.25);}
 for(let i=0;i<9;i++)box(3.2,.06,1.1,0x4b4f4c,-32+(i%3)*32,.76,-22+Math.floor(i/3)*22,.0,.92);light(0,4.8,0,0xaed4d6,.45,24);
}
function tunnels(){
 const wall=0x424744, steel=0x555b56, copper=0x8d6d45;
 for(let z=-54;z<=54;z+=12){beam(-9,2.1,z,.4,4.2,.45,wall);beam(9,2.1,z,.4,4.2,.45,wall);beam(0,4.05,z,18,.45,.45,wall);}
 for(let y of [3.1,3.55]){pipe(-6,y,-50,100,'z',steel,.16);pipe(-3.8,y,-50,100,'z',copper,.12);pipe(4.8,y,-50,100,'z',0x64756b,.11);}
 for(let z=-48;z<=48;z+=16){box(2.8,1.5,.3,0x252824,0,1.0,z);box(2.1,.65,.12,0x6f7c72,0,1.55,z-.18);pipe(-7.2,2.8,z,.9,'y',0xa66c43,.08);pipe(7.2,2.8,z,.9,'y',0x4c7180,.08);}
 for(let z=-42;z<=42;z+=14){panel(0,z,0xb8c9b7);}
}
function archive(){
 const wood=0x4a382e, trim=0x665846, paper=0xb6a98f;
 for(let x=-36;x<=36;x+=9){for(let z=-36;z<=36;z+=12){box(4.0,4.2,9.6,wood,x,2.1,z,0,.95);for(let y=1;y<=3;y++)for(let i=-1;i<=1;i++)box(.55,.05,7.5,paper,x+i*1.1,y,z-.1,0,.98);}}
 box(10,.35,30,trim,0,4.35,0);rail(0,4.8,0,30,0,trim);stairs(-14,-30,9,4,.7,.27,Math.PI/2,wood);rail(-10.5,2.7,-27,5,Math.PI/2);
 for(let x=-30;x<=30;x+=15)box(2.8,.1,1.1,0x55443a,x,.76,42,.0,.92);for(let x=-30;x<=30;x+=15)box(2.8,.1,1.1,0x55443a,x,.76,-42,.0,.92);
 panel(0,0,0xeeddb3);light(0,5.7,0,0xf2dfb6,.45,24);
}
function garden(){
 const stone=0x807d6d, glass=0x90aaa0, green=0x406545;
 for(let x=-36;x<=36;x+=18){arch(x,0,8,5.5,glass,0);arch(x,24,8,5.5,glass,0);}
 for(let a=0;a<8;a++){const ang=a*Math.PI/4,x=Math.cos(ang)*24,z=Math.sin(ang)*24;box(6,.18,1.3,stone,x,.1,z,ang,.95);cyl(.28,2.2,green,x,1.1,z,14,.98);}
 for(let x=-30;x<=30;x+=15){for(let z=-30;z<=30;z+=15){if((x+z)%30===0){cyl(1.0,2.0,green,x,1,z,18,.96);cyl(.72,1.0,0x5d8060,x,2.5,z,18,.97);}}}
 box(12,.18,3.0,stone,0,.1,0);arch(0,-32,5,3.2,0x9ebaae,0);door(0,-32,0,0x456a58,1.5,2.4);light(0,6,0,0xb9f0c8,.7,28);
}
function tick(){const active=safe(()=>typeof gameActive!=='undefined'&&gameActive);if(!active){requestAnimationFrame(tick);return;}const id=level();if(id!==S.active){reset();S.active=id;group();if(id==='1')level1();else if(id==='2')pool(false);else if(id==='x37b')pool(true);else if(id==='x6')hotel();else if(id==='x14')offices();else if(id==='x9')tunnels();else if(id==='x21')archive();else if(id==='x3999')garden();}requestAnimationFrame(tick);}
window.addEventListener('load',()=>setTimeout(tick,1100));
window.LevelArchitectureRemodel={reset};
})();
