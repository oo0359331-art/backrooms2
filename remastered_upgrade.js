/* Backrooms Remastered layer — cinematic flow, atmosphere, feedback and replay systems. */
(function(){
  'use strict';

  const state = {
    introOpen: false,
    bypass: false,
    startedAt: 0,
    lastStepAt: 0,
    stepFlip: false,
    sway: 0,
    targetSway: 0,
    lastLevel: null,
    loreOpen: false,
    reducedMotion: false
  };

  const safe = (fn) => { try { return fn(); } catch (_) {} };
  const el = (id) => document.getElementById(id);

  function injectStyle(){
    const css = `
      #rm-grade{position:fixed;inset:0;z-index:18;pointer-events:none;mix-blend-mode:screen;opacity:.42;background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.28) 78%,rgba(0,0,0,.72));transition:opacity .3s}
      #rm-grain{position:fixed;inset:-20%;z-index:19;pointer-events:none;opacity:.12;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E");animation:rmGrain .22s steps(2) infinite}
      @keyframes rmGrain{0%{transform:translate(0,0)}25%{transform:translate(2%, -1%)}50%{transform:translate(-1%,2%)}75%{transform:translate(1%,-2%)}100%{transform:translate(-2%,1%)}}
      #rm-status{position:fixed;top:16px;left:16px;z-index:31;display:none;pointer-events:none;color:#f3e6b4;font:600 11px/1.5 'Courier New',monospace;letter-spacing:1.4px;text-shadow:0 2px 8px #000;max-width:min(420px,70vw)}
      #rm-status .line{opacity:.78}.rm-accent{color:#fff1a6}.rm-danger{color:#ff8c79}.rm-good{color:#86ffd5}
      #rm-intro{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:#020202;color:#eee;font-family:'Courier New',monospace}
      #rm-intro::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,rgba(214,176,45,.18),transparent 34%),linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.9));}
      #rm-intro-card{position:relative;width:min(840px,92vw);min-height:min(520px,82vh);padding:34px 30px 28px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid rgba(255,221,120,.22);background:rgba(6,6,5,.64);box-shadow:0 25px 100px rgba(0,0,0,.75),inset 0 0 80px rgba(255,210,80,.035);overflow:hidden}
      #rm-intro-card::after{content:'';position:absolute;inset:0;background:linear-gradient(transparent 48%,rgba(255,255,255,.035) 49%,transparent 50%);background-size:100% 6px;pointer-events:none;opacity:.28}
      #rm-kicker{color:#d8b748;letter-spacing:4px;font-size:12px;text-transform:uppercase}.rm-title{font-size:clamp(34px,8vw,72px);line-height:.95;letter-spacing:5px;margin:14px 0 10px;color:#fff7d0;text-shadow:0 0 25px rgba(255,214,90,.35)}
      #rm-copy{max-width:700px;color:#c5c5c5;line-height:1.75;font-size:clamp(13px,2vw,17px);min-height:104px}.rm-meta{display:flex;gap:18px;flex-wrap:wrap;color:#828282;font-size:11px;letter-spacing:1.1px}.rm-meta b{color:#ded2a9}
      #rm-intro-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}#rm-intro-actions button,#rm-lore button{width:auto;min-width:150px}
      #rm-progress{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.08)}#rm-progress i{display:block;height:100%;width:0;background:#d6b64f;box-shadow:0 0 12px rgba(214,182,79,.7);transition:width .18s linear}
      #rm-lore{position:fixed;inset:0;z-index:995;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.84);backdrop-filter:blur(8px);color:#ddd;font-family:'Courier New',monospace}
      #rm-lore-card{width:min(760px,92vw);max-height:82vh;overflow:auto;padding:26px;border:1px solid rgba(255,255,255,.16);background:rgba(12,12,12,.92);box-shadow:0 20px 90px rgba(0,0,0,.7)}
      #rm-lore h2{margin:0 0 6px;color:#f2e7ba;letter-spacing:3px}#rm-lore small{color:#7f7f7f}#rm-lore p{line-height:1.75;color:#bcbcbc}#rm-lore .entry{padding:14px 0;border-top:1px solid rgba(255,255,255,.08)}
      #rm-lore-btn{font-size:.86rem!important;letter-spacing:1px}
      #rm-sanity{position:fixed;right:18px;top:16px;z-index:31;display:none;color:#d8d1b4;font:10px 'Courier New',monospace;letter-spacing:1px;text-shadow:0 2px 6px #000;text-align:right}
      #rm-sanity-bar{margin-top:4px;width:96px;height:4px;background:rgba(255,255,255,.12);overflow:hidden}#rm-sanity-fill{height:100%;width:100%;background:#d2c17b;transition:width .25s}
      #rm-flash{position:fixed;inset:0;z-index:210;pointer-events:none;opacity:0;background:#fff;transition:opacity .12s}
      #start-screen.rm-remastered{background:radial-gradient(circle at 50% 44%,rgba(113,92,27,.24),rgba(0,0,0,.985) 72%),repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 4px)}
      #start-screen.rm-remastered h1{font-size:clamp(2.4rem,7vw,4.4rem);letter-spacing:5px;color:#f7e6a0;text-shadow:0 0 8px rgba(255,214,83,.35),0 0 30px rgba(255,187,0,.18)}
      #start-screen.rm-remastered p{color:#888;letter-spacing:1px}
      .rm-menu-badge{font-size:10px;letter-spacing:3px;color:#806f38;margin-bottom:-4px}.rm-menu-note{font-size:11px;color:#686868!important;margin-top:4px!important}
      @media (prefers-reduced-motion: reduce){#rm-grain{animation:none}}
      @media (max-width:650px){#rm-intro-card{padding:24px 18px 20px;min-height:78vh}.rm-title{letter-spacing:2px}.rm-meta{gap:9px}#rm-status{top:10px;left:10px;font-size:9px}#rm-sanity{top:10px;right:10px}}
    `;
    const style=document.createElement('style'); style.id='rm-style'; style.textContent=css; document.head.appendChild(style);
  }

  function injectDom(){
    if(el('rm-grade')) return;
    const grade=document.createElement('div'); grade.id='rm-grade'; document.body.appendChild(grade);
    const grain=document.createElement('div'); grain.id='rm-grain'; document.body.appendChild(grain);
    const status=document.createElement('div'); status.id='rm-status'; status.innerHTML='<div class="line rm-accent">BACKROOMS // REMASTERED</div><div class="line" id="rm-status-level">LEVEL 0 // THE YELLOW ROOMS</div><div class="line" id="rm-status-objective">Find a way deeper.</div>'; document.body.appendChild(status);
    const sanity=document.createElement('div'); sanity.id='rm-sanity'; sanity.innerHTML='<div>FOCUS</div><div id="rm-sanity-bar"><div id="rm-sanity-fill"></div></div>'; document.body.appendChild(sanity);
    const flash=document.createElement('div'); flash.id='rm-flash'; document.body.appendChild(flash);
    const intro=document.createElement('div'); intro.id='rm-intro'; intro.innerHTML=`<div id="rm-intro-card"><div><div id="rm-kicker">CASE FILE 000 • REMASTERED</div><div class="rm-title" id="rm-intro-title">YOU SHOULD NOT BE HERE.</div><div id="rm-copy"></div><div class="rm-meta"><span>STATUS: <b>UNACCOUNTED</b></span><span>LOCATION: <b id="rm-intro-location">UNKNOWN</b></span><span>TIME: <b>NO DATA</b></span></div></div><div><div id="rm-intro-actions"><button id="rm-next">CONTINUE</button><button id="rm-skip" class="secondary">SKIP INTRO</button></div></div><div id="rm-progress"><i id="rm-progress-fill"></i></div></div>`; document.body.appendChild(intro);
    const lore=document.createElement('div'); lore.id='rm-lore'; lore.innerHTML=`<div id="rm-lore-card"><h2>LORE ARCHIVE</h2><small>Fragments recovered from previous runs.</small><div class="entry"><b>LEVEL 0 — THE YELLOW ROOMS</b><p>Fluorescent lights hum above damp carpet and walls that do not agree with geometry. The longer you stay, the less certain the route back becomes.</p></div><div class="entry"><b>FIELD NOTE 01</b><p>Rooms repeat, but never perfectly. Watch for changes in light, sound, and objects. The Backrooms remembers where you look.</p></div><div class="entry"><b>FIELD NOTE 02</b><p>Something here is learning your habits. Running is loud. Silence is not always safer.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="rm-lore-close">CLOSE</button></div></div>`; document.body.appendChild(lore);

    const start=el('start-screen');
    if(start){
      start.classList.add('rm-remastered');
      const menu=document.querySelector('#start-screen .menu-container');
      if(menu && !el('rm-menu-badge')){
        const badge=document.createElement('div'); badge.id='rm-menu-badge'; badge.className='rm-menu-badge'; badge.textContent='REMSTERED BUILD // 01'; menu.insertBefore(badge, menu.firstChild);
        const loreBtn=document.createElement('button'); loreBtn.id='rm-lore-btn'; loreBtn.className='secondary'; loreBtn.type='button'; loreBtn.textContent='LORE ARCHIVE'; menu.appendChild(loreBtn);
        const note=document.createElement('p'); note.className='rm-menu-note'; note.textContent='Cinematic intro • reactive atmosphere • story framework • multiplayer-ready'; menu.appendChild(note);
      }
    }
  }

  const chapters = [
    {title:'YOU SHOULD NOT BE HERE.',copy:'You remember a wall. A yellow corridor. Then the floor gave way without making a sound. There was no impact. No doorway. Only fluorescent light.',loc:'UNKNOWN'},
    {title:'THE ROOMS REPEAT.',copy:'The wallpaper is familiar, but never identical. Count the lights. Listen for footsteps that are not yours. Mark doors when you can.',loc:'LEVEL 0'},
    {title:'SOMETHING HEARD YOU.',copy:'A distant electrical buzz drops out. The silence lasts two seconds too long. When the lights return, one of the rooms is different.',loc:'LEVEL 0 // SECTOR ?'},
    {title:'DON’T WASTE YOUR RUN.',copy:'You need an exit. You need a route. And if you find another person, do not assume the Backrooms brought them here for your benefit.',loc:'LEVEL 0 // ACTIVE'},
    {title:'ENTER.',copy:'Your first goal is simple: move. Your second is harder: understand why the rooms are changing.',loc:'LEVEL 0 // THE YELLOW ROOMS'}
  ];

  let chapterIndex=0;
  function renderChapter(){
    const c=chapters[chapterIndex];
    el('rm-intro-title').textContent=c.title; el('rm-copy').textContent=c.copy; el('rm-intro-location').textContent=c.loc;
    el('rm-progress-fill').style.width=((chapterIndex)/(chapters.length-1)*100)+'%';
    el('rm-next').textContent=chapterIndex===chapters.length-1?'ENTER LEVEL 0':'CONTINUE';
    safe(()=>{ el('rm-flash').style.opacity='0.28'; setTimeout(()=>{if(el('rm-flash'))el('rm-flash').style.opacity='0';},90); });
  }

  function releaseStart(btn){
    if(!btn) return;
    state.bypass=true;
    try{ btn.click(); }finally{ setTimeout(()=>{state.bypass=false;},120); }
  }

  function openIntro(btn){
    if(state.introOpen) return;
    state.introOpen=true; chapterIndex=0; renderChapter();
    const intro=el('rm-intro'); intro.style.display='flex';
    safe(()=>{ document.exitPointerLock?.(); });
    const start=el('start-screen'); if(start) start.style.visibility='hidden';
    intro.dataset.pending=btn.id;
  }

  function closeIntro(startGame){
    const intro=el('rm-intro'); if(intro) intro.style.display='none';
    const start=el('start-screen'); if(start) start.style.visibility='visible';
    const pending=intro && intro.dataset.pending ? el(intro.dataset.pending) : null;
    state.introOpen=false;
    if(startGame && pending) releaseStart(pending);
  }

  function wireMenu(){
    ['solo-btn','host-btn','join-btn'].forEach(id=>{
      const b=el(id); if(!b || b.dataset.rmWired) return; b.dataset.rmWired='1';
      b.addEventListener('click',function(e){ if(state.bypass) return; if(state.introOpen) return; e.preventDefault(); e.stopImmediatePropagation(); openIntro(b); },true);
    });
    const lore=el('rm-lore-btn'); if(lore) lore.onclick=()=>{el('rm-lore').style.display='flex';state.loreOpen=true;};
    const lc=el('rm-lore-close'); if(lc) lc.onclick=()=>{el('rm-lore').style.display='none';state.loreOpen=false;};
    const next=el('rm-next'); if(next) next.onclick=()=>{ if(chapterIndex < chapters.length-1){chapterIndex++;renderChapter();}else closeIntro(true); };
    const skip=el('rm-skip'); if(skip) skip.onclick=()=>closeIntro(true);
  }

  function levelName(){
    try{
      const id=String(window.currentLevel ?? document.getElementById('level-select')?.value ?? '0');
      const map={'0':'LEVEL 0 // THE YELLOW ROOMS','1':'LEVEL 1 // HABITABLE ZONE','2':'LEVEL 37 // THE POOLROOMS'};
      return [id,map[id]||('LEVEL '+id),id];
    }catch(_){return ['0','LEVEL 0 // THE YELLOW ROOMS','0'];}
  }

  function updateRuntimeUi(){
    const [id,name]=levelName();
    const status=el('rm-status'); if(!status) return;
    status.style.display=(typeof gameActive!=='undefined' && gameActive)?'block':'none';
    el('rm-status-level').textContent=name;
    const objective=el('rm-status-objective');
    if(objective){
      objective.textContent=id==='2'?'Locate the deep-water route and the exit signal.':(id==='1'?'Follow the signs. Conserve stamina.':'Find a way deeper. Stay alert.');
    }
    const sanity=el('rm-sanity'); sanity.style.display=(typeof gameActive!=='undefined' && gameActive)?'block':'none';
  }

  function audioContext(){
    if(typeof ambientAudioCtx!=='undefined' && ambientAudioCtx) return ambientAudioCtx;
    try{ if(window.AudioContext) return new AudioContext(); }catch(_){ return null; }
    return null;
  }

  function footstep(){
    if(Date.now()-state.lastStepAt<260) return;
    state.lastStepAt=Date.now();
    const ctx=audioContext(); if(!ctx) return;
    try{
      const now=ctx.currentTime; const o=ctx.createOscillator(); const g=ctx.createGain();
      o.type='triangle'; o.frequency.setValueAtTime(state.stepFlip?92:72,now); o.frequency.exponentialRampToValueAtTime(45,now+.08);
      g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.045,now+.012); g.gain.exponentialRampToValueAtTime(.0001,now+.12);
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now+.13); state.stepFlip=!state.stepFlip;
    }catch(_){ }
  }

  function screenFlash(strength=0.45){
    const f=el('rm-flash'); if(!f) return; f.style.background='#fff6cf'; f.style.opacity=String(strength); setTimeout(()=>{f.style.opacity='0';},100);
  }

  function runtimeAtmosphere(){
    updateRuntimeUi();
    try{
      if(typeof controls!=='undefined' && controls && typeof gameActive!=='undefined' && gameActive){
        const obj=controls.getObject();
        const moving = !!(moveForward||moveBackward||moveLeft||moveRight);
        const sprinting = !!isSprinting;
        if(moving) footstep();
        const t=performance.now()*0.001;
        const target=(moving?Math.sin(t*(sprinting?10:6))*0.012:0);
        state.targetSway=target;
        state.sway += (state.targetSway-state.sway)*.12;
        if(camera && !state.reducedMotion){
          camera.rotation.z = state.sway;
          camera.rotation.x += (moving?Math.sin(t*7)*0.0012:0);
        }
      }
    }catch(_){ }
  }

  function onVisibility(){
    if(document.hidden){
      const f=el('rm-flash'); if(f) f.style.opacity='.18';
    }
  }

  function boot(){
    injectStyle(); injectDom(); wireMenu(); updateRuntimeUi();
    document.addEventListener('visibilitychange',onVisibility);
    document.addEventListener('keydown',(e)=>{
      if(e.code==='KeyL' && typeof gameActive!=='undefined' && gameActive && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
        e.preventDefault(); el('rm-lore').style.display='flex'; state.loreOpen=true;
      }
      if(e.code==='Escape' && state.loreOpen){el('rm-lore').style.display='none';state.loreOpen=false;}
    });
    setInterval(runtimeAtmosphere,80);
    setInterval(()=>{
      const fill=el('rm-sanity-fill'); if(!fill || typeof gameActive==='undefined' || !gameActive) return;
      const [id]=levelName();
      const stress=id==='0' ? 0.04 : id==='1' ? 0.075 : 0.02;
      const wobble=(Math.sin(performance.now()/2200)+1)*stress;
      fill.style.width=Math.max(48,100-wobble*100)+'%';
    },250);
    window.BackroomsRemastered={
      openIntro:()=>{const b=el('solo-btn'); if(b) openIntro(b);},
      showLore:()=>{el('rm-lore').style.display='flex';state.loreOpen=true;},
      flash:screenFlash,
      version:'0.1-remastered'
    };
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
