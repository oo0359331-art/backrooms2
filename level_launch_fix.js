/* Backrooms Remastered — authoritative level selector / launch handoff. */
(function(){
  'use strict';
  const LEVELS=[
    {id:'0',cls:'HOSTILE',name:'Level 0 — The Yellow Rooms'},
    {id:'x6',cls:'HOSTILE',name:'Level 6 — Terror Hotel'},
    {id:'x14',cls:'HOSTILE',name:'Level 14 — Flooded Offices'},
    {id:'1',cls:'NEUTRAL',name:'Level 1 — Habitable Zone'},
    {id:'x9',cls:'NEUTRAL',name:'Level 9 — Service Tunnels'},
    {id:'x21',cls:'NEUTRAL',name:'Level 21 — Endless Archive'},
    {id:'2',cls:'PEACEFUL',name:'Level 37 — Poolrooms'},
    {id:'x37b',cls:'PEACEFUL',name:'Level 37B — Deep Pools'},
    {id:'x3999',cls:'PEACEFUL',name:'Level 3999 — Quiet Garden'}
  ];
  const GROUPS={HOSTILE:'HOSTILE — danger is expected',NEUTRAL:'NEUTRAL — exploration & survival',PEACEFUL:'PEACEFUL — atmosphere & discovery'};
  function q(id){return document.getElementById(id)}
  function fill(sel){
    if(!sel)return;
    const wanted=window.__backroomsSelectedLevel||sel.value||'1';
    sel.innerHTML='';
    for(const cls of ['HOSTILE','NEUTRAL','PEACEFUL']){
      const g=document.createElement('optgroup');g.label=GROUPS[cls];
      LEVELS.filter(x=>x.cls===cls).forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.name;g.appendChild(o)});
      sel.appendChild(g);
    }
    sel.value=LEVELS.some(x=>x.id===wanted)?wanted:'1';
  }
  function sync(v){
    const hidden=q('level-select');
    if(hidden){hidden.value=String(v);hidden.dispatchEvent(new Event('change',{bubbles:true}));}
    window.__backroomsSelectedLevel=String(v);
  }
  function install(){
    const hidden=q('level-select'), visible=q('br-level');
    if(!hidden||!visible)return false;
    fill(hidden);
    fill(visible);
    if(!visible.dataset.launchFixed){
      visible.dataset.launchFixed='1';
      visible.addEventListener('change',()=>sync(visible.value));
    }
    visible.value=hidden.value||window.__backroomsSelectedLevel||'1';
    sync(visible.value);

    for(const id of ['br-solo','br-create','br-join','br-continue']){
      const b=q(id); if(!b||b.dataset.launchWrapped==='1')continue;
      b.dataset.launchWrapped='1';
      if(id==='br-solo'||id==='br-create'){
        b.addEventListener('pointerdown',()=>sync(visible.value),{capture:true});
        b.addEventListener('click',()=>sync(visible.value),{capture:true});
      } else {
        b.addEventListener('pointerdown',()=>sync(visible.value),{capture:true});
        b.addEventListener('click',()=>sync(visible.value),{capture:true});
      }
    }
    return true;
  }
  function boot(){
    if(!install()) return setTimeout(boot,120);
    const timer=setInterval(()=>install(),500);
    setTimeout(()=>clearInterval(timer),10000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
