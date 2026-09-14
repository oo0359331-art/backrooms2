/* Backrooms Remastered — curated 8-level selector grouped by danger class. */
(function(){
  'use strict';
  const LEVELS = [
    {id:'x6',   cls:'HOSTILE',  name:'Level 6 — Terror Hotel',       desc:'A decaying hotel. Restore power and find the service elevator.'},
    {id:'x14',  cls:'HOSTILE',  name:'Level 14 — Flooded Offices',   desc:'Abandoned offices under rising water. Find the emergency override.'},
    {id:'1',    cls:'NEUTRAL',  name:'Level 1 — Habitable Zone',     desc:'Concrete service halls. Supplies are useful, but nothing feels safe.'},
    {id:'x9',   cls:'NEUTRAL',  name:'Level 9 — Service Tunnels',    desc:'Industrial tunnels. Route power through three substations.'},
    {id:'x21',  cls:'NEUTRAL',  name:'Level 21 — Endless Archive',   desc:'A silent library where the lights never reach the stacks.'},
    {id:'2',    cls:'PEACEFUL', name:'Level 37 — Poolrooms',         desc:'Warm tile, still water, and a silence that feels too perfect.'},
    {id:'x37b', cls:'PEACEFUL', name:'Level 37B — Deep Pools',       desc:'Deeper water, blue service lights, and no visible exit.'},
    {id:'x3999',cls:'PEACEFUL', name:'Level 3999 — Quiet Garden',    desc:'An impossible indoor garden. Find the maintenance gate home.'}
  ];
  const labels = {
    HOSTILE:'HOSTILE — danger is expected',
    NEUTRAL:'NEUTRAL — exploration & survival',
    PEACEFUL:'PEACEFUL — atmosphere & discovery'
  };

  function apply(){
    const sel=document.getElementById('level-select');
    if(!sel)return;
    const previous=sel.value;
    sel.innerHTML='';
    for(const cls of ['HOSTILE','NEUTRAL','PEACEFUL']){
      const og=document.createElement('optgroup');
      og.label=labels[cls];
      LEVELS.filter(x=>x.cls===cls).forEach(x=>{
        const o=document.createElement('option');
        o.value=x.id;
        o.textContent=x.name;
        o.dataset.class=x.cls;
        o.dataset.description=x.desc;
        og.appendChild(o);
      });
      sel.appendChild(og);
    }
    const keep=LEVELS.some(x=>x.id===previous)?previous:'1';
    sel.value=keep;
    window.__backroomsLevelRoster=LEVELS.map(x=>({...x}));
    sel.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function css(){
    if(document.getElementById('curated-level-style'))return;
    const s=document.createElement('style');
    s.id='curated-level-style';
    s.textContent=`
      #level-select{background:#090909;color:#eee;border-color:#8e7d55}
      #level-select optgroup{font-weight:700;padding:6px;color:#d6b86a}
      #level-select option{background:#101010;color:#eee;padding:8px}
    `;
    document.head.appendChild(s);
  }

  function init(){css();apply();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  window.addEventListener('load',apply,{once:true});
})();
