/* Backrooms Remastered profile system — persistent identity, character colors and synced nameplates. */
(function(){
  'use strict';

  const KEY='backrooms_remastered_profile_v1';
  const DEFAULT={name:'Player',tag:'SURVIVOR',skin:'#c78d6a',outfit:'#4e7bd9',accent:'#d4af37'};
  let profile=load();
  let wiredConnections=new WeakSet();
  let profileSignature='';
  let panelOpen=false;

  const q=id=>document.getElementById(id);
  const safe=fn=>{try{return fn();}catch(e){}};

  function load(){
    try{ return Object.assign({},DEFAULT,JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){ return {...DEFAULT}; }
  }
  function clean(v,fallback,max){
    v=String(v||'').trim().replace(/[<>]/g,'');
    return (v||fallback).slice(0,max);
  }
  function save(){
    profile.name=clean(profile.name,'Player',16);
    profile.tag=clean(profile.tag,'SURVIVOR',14).toUpperCase();
    ['skin','outfit','accent'].forEach(k=>{if(!/^#[0-9a-fA-F]{6}$/.test(profile[k])) profile[k]=DEFAULT[k];});
    localStorage.setItem(KEY,JSON.stringify(profile));
    profileSignature=JSON.stringify(profile);
    applyLocal();
  }

  function css(){
    const s=document.createElement('style'); s.id='profile-style'; s.textContent=`
      #profile-btn{width:auto!important;min-width:120px!important}
      #profile-modal{position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.82);backdrop-filter:blur(7px);font-family:'Courier New',monospace;color:#eee}
      #profile-card{width:min(620px,94vw);max-height:88vh;overflow:auto;padding:24px;border:1px solid rgba(255,220,120,.22);background:rgba(12,12,11,.96);box-shadow:0 24px 100px rgba(0,0,0,.8)}
      #profile-card h2{margin:0;color:#f2e7ba;letter-spacing:3px}#profile-card small{color:#777}
      .profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.profile-field{display:flex;flex-direction:column;gap:6px}.profile-field.full{grid-column:1/-1}.profile-field label{font-size:10px;letter-spacing:1px;color:#aaa}.profile-field input{width:100%!important;background:#111!important;color:#eee!important;border:1px solid rgba(255,255,255,.18)!important}
      .profile-preview{display:flex;align-items:center;gap:14px;margin-top:18px;padding:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09)}
      #profile-avatar{width:58px;height:58px;border-radius:50%;border:3px solid #d4af37;box-shadow:0 0 22px rgba(212,175,55,.2)}
      #profile-name-preview{font-weight:bold;color:#fff}.profile-tag-preview{color:#9f9f9f;font-size:10px;letter-spacing:2px;margin-top:3px}
      .profile-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.profile-actions button{width:auto!important;min-width:130px!important}
      @media(max-width:620px){.profile-grid{grid-template-columns:1fr}.profile-field.full{grid-column:auto}}
      .rm-nameplate{display:flex;flex-direction:column;align-items:center;justify-content:center;white-space:nowrap;text-align:center;padding:5px 9px;border-radius:6px;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.16);font:700 15px Arial,sans-serif;letter-spacing:.4px;text-shadow:0 2px 6px #000}
      .rm-nameplate span{font:700 9px 'Courier New',monospace;letter-spacing:1.6px;color:#aaa;margin-top:2px}
    `; document.head.appendChild(s);
  }

  function dom(){
    if(q('profile-modal')) return;
    const modal=document.createElement('div'); modal.id='profile-modal'; modal.innerHTML=`
      <div id="profile-card">
        <h2>PLAYER PROFILE</h2><small>Your identity follows you into the Backrooms.</small>
        <div class="profile-grid">
          <div class="profile-field full"><label>DISPLAY NAME</label><input id="profile-name" maxlength="16"></div>
          <div class="profile-field full"><label>NAME TAG / ROLE</label><input id="profile-tag" maxlength="14"></div>
          <div class="profile-field"><label>SKIN</label><input id="profile-skin" type="color"></div>
          <div class="profile-field"><label>OUTFIT</label><input id="profile-outfit" type="color"></div>
          <div class="profile-field"><label>NAMEPLATE ACCENT</label><input id="profile-accent" type="color"></div>
        </div>
        <div class="profile-preview"><div id="profile-avatar"></div><div><div id="profile-name-preview"></div><div id="profile-tag-preview" class="profile-tag-preview"></div></div></div>
        <div class="profile-actions"><button id="profile-save">SAVE PROFILE</button><button id="profile-close" class="secondary">CLOSE</button></div>
      </div>`;
    document.body.appendChild(modal);
    ['name','tag','skin','outfit','accent'].forEach(k=>{const x=q('profile-'+k);x.value=profile[k];x.addEventListener(k==='name'||k==='tag'?'input':'change',preview);});
    q('profile-save').onclick=()=>{profile={...profile,name:q('profile-name').value,tag:q('profile-tag').value,skin:q('profile-skin').value,outfit:q('profile-outfit').value,accent:q('profile-accent').value};save();close();sendProfileSoon();};
    q('profile-close').onclick=close;
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    addMenuButton(); preview();
  }

  function addMenuButton(){
    const row=q('profile-row'); if(!row||q('profile-btn')) return;
    const b=document.createElement('button'); b.id='profile-btn';b.type='button';b.className='secondary';b.textContent='PROFILE';b.onclick=open;row.appendChild(b);
  }

  function preview(){
    const n=clean(q('profile-name')?.value||profile.name,'Player',16);
    const t=clean(q('profile-tag')?.value||profile.tag,'SURVIVOR',14).toUpperCase();
    const a=q('profile-avatar'); if(a){a.style.background=q('profile-outfit')?.value||profile.outfit;a.style.borderColor=q('profile-accent')?.value||profile.accent;}
    if(q('profile-name-preview'))q('profile-name-preview').textContent=n;
    if(q('profile-tag-preview'))q('profile-tag-preview').textContent=t;
  }

  function open(){
    panelOpen=true;
    q('profile-name').value=profile.name;q('profile-tag').value=profile.tag;q('profile-skin').value=profile.skin;q('profile-outfit').value=profile.outfit;q('profile-accent').value=profile.accent;
    preview();q('profile-modal').style.display='flex';
  }
  function close(){panelOpen=false;if(q('profile-modal'))q('profile-modal').style.display='none';}

  function makeCanvasLabel(name,tag,accent){
    const c=document.createElement('canvas');c.width=620;c.height=180;const x=c.getContext('2d');
    x.clearRect(0,0,c.width,c.height);x.textAlign='center';x.font='bold 46px Arial';x.fillStyle=accent||'#d4af37';x.shadowColor='#000';x.shadowBlur=8;x.fillText(name,c.width/2,70);x.shadowBlur=0;x.font='bold 24px Courier New';x.fillStyle='#aaa';x.fillText(tag,c.width/2,113);return c;
  }
  function updateSprite(group,name,tag,accent,local){
    if(!group)return;
    let sp=group.getObjectByName(local?'localName':'profileNameplate');
    const texture=new THREE.CanvasTexture(makeCanvasLabel(name,tag,accent));
    if(!sp){sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sp.name=local?'localName':'profileNameplate';sp.scale.set(local?3.05:2.9,.82,1);sp.position.y=3.05;group.add(sp);}else{if(sp.material.map)sp.material.map.dispose();sp.material.map=texture;sp.material.needsUpdate=true;}
  }

  function recolorAvatar(group,skin,outfit,accent){
    if(!group)return;
    const mats=[];
    group.traverse(o=>{if(o.material)mats.push(o.material);});
    mats.forEach((m,i)=>{if(!m.color)return;const hex=i===0||i===1?skin:outfit;safe(()=>m.color.set(hex));});
    group.userData.__profileAccent=accent;
  }

  function applyLocal(){
    try{
      const av=window.__localAvatar; if(av){recolorAvatar(av,profile.skin,profile.outfit,profile.accent);updateSprite(av,profile.name,profile.tag,profile.accent,true);}
      const input=q('username-input'); if(input && document.activeElement!==input) input.value=profile.name;
    }catch(e){}
  }

  function profilePacket(){return {type:'profile',profile:{name:profile.name,tag:profile.tag,skin:profile.skin,outfit:profile.outfit,accent:profile.accent}};}

  function attachConn(conn){
    if(!conn||wiredConnections.has(conn))return;wiredConnections.add(conn);
    const originalOnData=conn.onData;
    conn.on('data',data=>{
      if(!data||data.type!=='profile')return;
      const incoming=Object.assign({},DEFAULT,data.profile||{});
      if(!conn._profile)conn._profile=incoming;else conn._profile=Object.assign(conn._profile,incoming);
      try{
        const remote=remotePlayers.get(conn.peer);
        if(remote)applyRemote(remote,conn._profile);
      }catch(e){}
    });
    const originalSend=conn.send.bind(conn);
    conn._profileSend=function(){safe(()=>originalSend(profilePacket()));};
    safe(()=>conn._profileSend());
  }

  function applyRemote(remote,p){
    const x=Object.assign(DEFAULT,p||{});
    recolorAvatar(remote,x.skin,x.outfit,x.accent);updateSprite(remote,x.name,x.tag,x.accent,false);
  }

  function syncConnections(){
    safe(()=>{for(const conn of connections.values())attachConn(conn);});
    safe(()=>{if(hostConnection)attachConn(hostConnection);});
    if(hostConnection && !hostConnection._profileLoop){hostConnection._profileLoop=setInterval(()=>safe(()=>hostConnection._profileSend&&hostConnection._profileSend()),2500);}
    safe(()=>{for(const conn of connections.values()){if(!conn._profileLoop)conn._profileLoop=setInterval(()=>safe(()=>conn._profileSend&&conn._profileSend()),2500);}});
  }

  function hydrateRemotes(){
    safe(()=>{for(const [id,remote] of remotePlayers){const conn=connections.get(id);const p=conn&&conn._profile;if(p)applyRemote(remote,p);}});
  }

  function localBroadcast(){
    if(profileSignature===JSON.stringify(profile))return;
    profileSignature=JSON.stringify(profile);syncConnections();
  }

  function loop(){
    addMenuButton();applyLocal();syncConnections();hydrateRemotes();localBroadcast();requestAnimationFrame(loop);
  }

  function init(){
    css();dom();profileSignature=JSON.stringify(profile);applyLocal();loop();
    document.addEventListener('keydown',e=>{if(e.code==='Escape'&&panelOpen)close();});
    window.BackroomsProfile={get:()=>({...profile}),open,save};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
