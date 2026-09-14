/* Make the full implemented level roster visible even if another menu layer fails. */
(function(){
  'use strict';
  const LEVELS = [
    ['HOSTILE','Level 0 — The Yellow Rooms','Endless yellow corridors. Something is listening.'],
    ['NEUTRAL','Level 1 — Habitable Zone','Concrete service halls. Supplies are useful, but nothing feels safe.'],
    ['PEACEFUL','Level 37 — Poolrooms','Warm tile, still water, and a silence that feels too perfect.'],
    ['HOSTILE','Level 6 — Terror Hotel','A decaying hotel. Restore power and find the service elevator.'],
    ['HOSTILE','Level 14 — Flooded Offices','Abandoned offices under rising water. Find the emergency override.'],
    ['NEUTRAL','Level 9 — Service Tunnels','Industrial tunnels. Route power through three substations.'],
    ['NEUTRAL','Level 21 — Endless Archive','A silent library where the lights never reach the stacks.'],
    ['PEACEFUL','Level 3999 — Quiet Garden','An impossible indoor garden. Find the maintenance gate home.'],
    ['PEACEFUL','Level 37B — Deep Pools','Deeper water, blue service lights, and no visible exit.']
  ];

  function apply(){
    const sel=document.getElementById('level-select');
    if(!sel)return;
    sel.innerHTML='';
    let current='0';
    const groups={};
    LEVELS.forEach(([cls,name,desc])=>{
      const key=cls+'|'+({HOSTILE:'Hostile — danger is expected',NEUTRAL:'Neutral — exploration and survival',PEACEFUL:'Peaceful — atmosphere and discovery'}[cls]);
      (groups[key] ||= []).push({cls,name,desc});
    });
    Object.entries(groups).forEach(([key,items])=>{
      const og=document.createElement('optgroup');
      og.label=key.split('|')[1];
      items.forEach(({name})=>{ const o=document.createElement('option'); o.value = LEVELS.find(x=>x[1]===name)[0]==='Level 0 — The Yellow Rooms'?'0':({'Level 1 — Habitable Zone':'1','Level 37 — Poolrooms':'2','Level 6 — Terror Hotel':'x6','Level 14 — Flooded Offices':'x14','Level 9 — Service Tunnels':'x9','Level 21 — Endless Archive':'x21','Level 3999 — Quiet Garden':'x3999','Level 37B — Deep Pools':'x37b'}[name]||'0'); o.textContent=name; og.appendChild(o); });
      sel.appendChild(og);
    });
    const saved=window.__backroomsSelectedLevel;
    sel.value=saved || '0';
    sel.dispatchEvent(new Event('change',{bubbles:true}));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
  window.addEventListener('load',apply,{once:true});
})();
