/* Backrooms Remastered character system — stylized realistic survivor bodies, clothing layers and animation. */
(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const safe=fn=>{try{return fn();}catch(e){}};
  const KEY='backrooms_remastered_profile_v1';
  const DEFAULT={name:'Player',tag:'SURVIVOR',skin:'#c78d6a',outfit:'#4e7bd9',accent:'#d4af37',body:'average',hair:'short',pants:'#24262b',shoes:'#15171b',clothes:'jacket'};
  function profile(){try{return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {...DEFAULT};}}
  function remoteProfile(id){
    let c=null;
    safe(()=>{if(typeof connections!=='undefined'&&connections)c=connections.get(id)||null;});
    safe(()=>{if(!c&&typeof hostConnection!=='undefined'&&hostConnection&&hostConnection.peer===id)c=hostConnection;});
    return Object.assign({},DEFAULT,c&&c._profile?c._profile:{});
  }
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function mat(color,rough=.82){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.03});}
  function box(w,h,d,color,rough){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,rough));m.castShadow=true;m.receiveShadow=true;return m;}
  function cyl(r,h,color,radial=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*0.92,h,radial),mat(color));m.castShadow=true;m.receiveShadow=true;return m;}
  function joint(x,y,z){const g=new THREE.Group();g.position.set(x,y,z);return g;}
  function pickAppearance(id,override){
    const base=Object.assign({},DEFAULT,profile(),override||{});
    const seed=hash(String(id||base.name));
    const opts={body:['slim','average','broad'],hair:['short','side','long','hood'],clothes:['jacket','hoodie','utility']};
    const out={...base};
    if(!opts.body.includes(out.body))out.body=opts.body[seed%opts.body.length];
    if(!opts.hair.includes(out.hair))out.hair=opts.hair[(seed>>>3)%opts.hair.length];
    if(!opts.clothes.includes(out.clothes))out.clothes=opts.clothes[(seed>>>6)%opts.clothes.length];
    if(!/^#[0-9a-f]{6}$/i.test(out.pants))out.pants=DEFAULT.pants;
    if(!/^#[0-9a-f]{6}$/i.test(out.shoes))out.shoes=DEFAULT.shoes;
    return out;
  }
  function clearOld(group){group.children.slice().forEach(c=>{if(c.type!=='Sprite'&&c.name!=='profileNameplate'&&c.name!=='localName')group.remove(c);});}
  function build(group,id,isLocal,override){
    if(!window.THREE||!group||group.userData.__brCharacterReady)return;
    clearOld(group);
    const p=pickAppearance(id,override);
    const root=new THREE.Group();root.name='br-character-model';
    const rig={root,arms:[],legs:[],phase:Math.random()*Math.PI*2,appearance:p};
    group.add(root);
    const scale=p.body==='slim'?.92:(p.body==='broad'?1.08:1);root.scale.set(scale,1,scale);
    const torsoH=p.body==='slim'?1.16:1.2;
    const torso=box(.62,torsoH,.34,p.outfit);torso.position.y=1.72;root.add(torso);
    if(p.clothes==='hoodie'){
      const hood=new THREE.Mesh(new THREE.SphereGeometry(.34,12,8,0,Math.PI*2,0,Math.PI*.52),mat(p.outfit));hood.position.set(0,2.48,0);hood.scale.set(1,1.12,.9);root.add(hood);
    }else if(p.clothes==='utility'){
      const vest=box(.66,1.05,.37,p.accent);vest.position.set(0,1.77,.015);vest.scale.set(.86,1,.28);root.add(vest);
      for(const x of [-.22,.22]){const pouch=box(.12,.18,.08,'#15171b');pouch.position.set(x,1.55,.21);root.add(pouch);}
    }else{
      const collar=box(.3,.12,.36,p.accent);collar.position.set(0,2.22,.01);root.add(collar);
    }
    const neck=cyl(.11,.18,p.skin,8);neck.position.y=2.37;root.add(neck);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),mat(p.skin,.9));head.position.y=2.68;head.scale.set(.9,1.06,.9);root.add(head);
    const face=new THREE.Mesh(new THREE.SphereGeometry(.285,16,10),mat(p.skin,.94));face.position.set(0,2.66,.045);face.scale.set(.92,.98,.86);root.add(face);
    if(p.hair==='short'||p.hair==='side'){
      const hair=new THREE.Mesh(new THREE.SphereGeometry(.33,16,8,0,Math.PI*2,0,Math.PI*.55),mat('#18191c'));hair.position.set(p.hair==='side'?-.035:0,2.82,0);hair.scale.set(1.02,.95,.96);root.add(hair);
      if(p.hair==='side'){const lock=box(.10,.28,.12,'#18191c');lock.position.set(-.22,2.67,.14);lock.rotation.z=-.12;root.add(lock);}
    }else if(p.hair==='long'){
      const hair=new THREE.Mesh(new THREE.SphereGeometry(.35,16,10),mat('#18191c'));hair.position.set(0,2.77,-.01);hair.scale.set(.99,1.05,.97);root.add(hair);
      const back=box(.5,.42,.14,'#18191c');back.position.set(0,2.52,-.12);root.add(back);
    }else if(p.hair==='hood'){
      const hood=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),mat(p.outfit));hood.position.y=2.72;hood.scale.set(1,.98,1.02);root.add(hood);
    }
    const hip=box(.66,.34,.38,p.pants);hip.position.y=1.1;root.add(hip);
    const legGap=p.body==='broad'?.22:.19;
    [-1,1].forEach(side=>{
      const upper=joint(side*legGap,1.02,0);root.add(upper);
      const thigh=cyl(.13,.65,p.pants,9);thigh.position.y=-.34;upper.add(thigh);
      const lower=joint(0,-.67,0);upper.add(lower);
      const shin=cyl(.105,.62,p.pants,9);shin.position.y=-.29;lower.add(shin);
      const shoe=box(.22,.12,.42,p.shoes);shoe.position.set(0,-.63,.08);lower.add(shoe);rig.legs.push(upper);
    });
    [-1,1].forEach(side=>{
      const arm=joint(side*.42,2.0,0);root.add(arm);arm.rotation.z=side*.035;
      const sleeve=cyl(.115,.66,p.outfit,9);sleeve.position.y=-.30;arm.add(sleeve);
      const elbow=joint(0,-.62,0);arm.add(elbow);
      const fore=cyl(.095,.56,p.outfit,9);fore.position.y=-.27;elbow.add(fore);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),mat(p.skin));hand.position.y=-.57;elbow.add(hand);rig.arms.push(arm);
    });
    const eyeMat=mat('#111214',.5);
    [-1,1].forEach(side=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),eyeMat);eye.position.set(side*.095,2.7,.306);root.add(eye);});
    group.userData.__brCharacterReady=true;group.userData.__brRig=rig;group.userData.__brProfileKey=JSON.stringify(p);group.userData.__brIsLocal=!!isLocal;animate(group,0);
  }
  function isMoving(group){
    if(group.userData.__brIsLocal)return safe(()=>typeof moveForward!=='undefined'&&(moveForward||moveBackward||moveLeft||moveRight))||false;
    const t=group.userData.target||group.userData.targetPosition;
    return !!(t&&group.position.distanceTo(t)>.035);
  }
  function animate(group,t){
    const rig=group.userData.__brRig;if(!rig)return;
    const moving=isMoving(group);const sprint=group.userData.__brIsLocal?safe(()=>typeof isSprinting!=='undefined'&&isSprinting):false;
    const spd=sprint?10:7;const a=moving?Math.sin(t*spd+rig.phase):Math.sin(t*1.5+rig.phase)*.08;const amp=moving?(sprint?.62:.42):.06;
    if(rig.legs[0])rig.legs[0].rotation.x=a*amp;if(rig.legs[1])rig.legs[1].rotation.x=-a*amp;
    if(rig.arms[0])rig.arms[0].rotation.x=-a*amp*.9;if(rig.arms[1])rig.arms[1].rotation.x=a*amp*.9;
    rig.root.position.y=Math.sin(t*(moving?spd*2:1.7)+rig.phase)*(moving?.012:.004);
  }
  function apply(){
    const p=profile();
    safe(()=>{const av=window.__localAvatar;if(av){const k=JSON.stringify(p);if(av.userData.__brProfileKey!==k){av.userData.__brCharacterReady=false;build(av,p.name,true,p);}}});
    safe(()=>{if(typeof remotePlayers!=='undefined'&&remotePlayers)for(const [id,g] of remotePlayers){const rp=remoteProfile(id);const k=JSON.stringify(rp);if(!g.userData.__brCharacterReady||g.userData.__brRemoteProfileKey!==k){g.userData.__brCharacterReady=false;build(g,id,false,rp);g.userData.__brProfileOwner=id;g.userData.__brRemoteProfileKey=k;}}});
  }
  function ui(){
    const modal=q('profile-card');if(!modal||q('br-char-options'))return;
    const wrap=document.createElement('div');wrap.id='br-char-options';wrap.style.cssText='margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)';
    wrap.innerHTML='<div style="font-size:10px;letter-spacing:1px;color:#aaa;margin-bottom:8px">CHARACTER STYLE</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><label style="font-size:9px;color:#777">BODY<select id="br-body" style="width:100%"><option value="slim">SLIM</option><option value="average">AVERAGE</option><option value="broad">BROAD</option></select></label><label style="font-size:9px;color:#777">HAIR<select id="br-hair" style="width:100%"><option value="short">SHORT</option><option value="side">SIDE</option><option value="long">LONG</option><option value="hood">HOOD</option></select></label><label style="font-size:9px;color:#777">OUTFIT<select id="br-clothes" style="width:100%"><option value="jacket">JACKET</option><option value="hoodie">HOODIE</option><option value="utility">UTILITY</option></select></label></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label style="font-size:9px;color:#777">PANTS<input id="br-pants" type="color" style="width:100%;height:34px"></label><label style="font-size:9px;color:#777">SHOES<input id="br-shoes" type="color" style="width:100%;height:34px"></label></div>';
    modal.insertBefore(wrap,modal.querySelector('.profile-preview'));
    const fill=()=>{const p=profile();['body','hair','clothes','pants','shoes'].forEach(k=>{const x=q('br-'+k);if(x)x.value=p[k]||DEFAULT[k];});};fill();
    ['body','hair','clothes','pants','shoes'].forEach(k=>q('br-'+k)?.addEventListener('change',()=>{const p=profile();p[k]=q('br-'+k).value;localStorage.setItem(KEY,JSON.stringify(p));safe(()=>q('profile-name')?.dispatchEvent(new Event('input')));const av=window.__localAvatar;if(av){av.userData.__brCharacterReady=false;}}));
  }
  function loop(now){const t=now/1000;apply();safe(()=>{if(typeof remotePlayers!=='undefined')for(const [,g] of remotePlayers)animate(g,t);});safe(()=>{const av=window.__localAvatar;if(av)animate(av,t);});ui();requestAnimationFrame(loop);}
  function init(){if(!window.THREE)return;requestAnimationFrame(loop);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.BackroomsCharacter={rebuild:()=>{safe(()=>{const av=window.__localAvatar;if(av)av.userData.__brCharacterReady=false;});}};
})();
