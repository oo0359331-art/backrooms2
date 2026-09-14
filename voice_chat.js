/* Backrooms Remastered voice chat — opt-in WebRTC microphone audio with push-to-talk. */
(function(){
  'use strict';

  const V={stream:null,enabled:false,muted:true,ptt:false,pressed:false,audio:new Map(),wired:new WeakSet(),lastError:''};
  const q=id=>document.getElementById(id);
  const safe=fn=>{try{return fn();}catch(e){}};

  function css(){
    if(q('voice-style'))return;
    const s=document.createElement('style');s.id='voice-style';s.textContent=`
      #voice-panel{position:fixed;right:18px;top:18px;z-index:80;display:none;gap:7px;align-items:center;padding:8px 10px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:rgba(0,0,0,.62);backdrop-filter:blur(7px);font:10px 'Courier New',monospace;letter-spacing:1px;color:#ddd;box-shadow:0 8px 30px rgba(0,0,0,.35)}
      #voice-panel button{width:auto!important;padding:7px 9px!important;font:700 10px 'Courier New',monospace;letter-spacing:1px}
      #voice-dot{width:8px;height:8px;border-radius:50%;background:#666;box-shadow:0 0 8px rgba(255,255,255,.1)}
      #voice-dot.live{background:#5dffbf;box-shadow:0 0 10px rgba(93,255,191,.7)}
      #voice-dot.talk{background:#ffcf59;box-shadow:0 0 12px rgba(255,207,89,.75)}
      #voice-status{min-width:74px}
      @media(max-width:650px){#voice-panel{right:10px;top:10px;padding:6px 7px}#voice-panel button{font-size:9px!important;padding:6px 8px!important}}
    `;document.head.appendChild(s);
  }

  function dom(){
    if(q('voice-panel'))return;
    const p=document.createElement('div');p.id='voice-panel';p.innerHTML='<span id="voice-dot"></span><span id="voice-status">VOICE OFF</span><button id="voice-enable" type="button">MIC</button><button id="voice-mute" type="button" class="secondary">MUTE</button>';document.body.appendChild(p);
    q('voice-enable').onclick=enable;
    q('voice-mute').onclick=toggleMute;
  }

  function ui(show=true){const p=q('voice-panel');if(p)p.style.display=show?'flex':'none';refresh();}
  function refresh(){
    const st=q('voice-status'),dot=q('voice-dot'),m=q('voice-mute'),e=q('voice-enable');if(!st)return;
    if(!V.stream){st.textContent='VOICE OFF';dot.className='';m.textContent='MUTE';e.textContent='MIC';return;}
    const transmitting=V.enabled&&!V.muted&&(V.ptt?!V.pressed:true);
    st.textContent=V.muted?'MIC MUTED':(V.ptt?(V.pressed?'TRANSMITTING':'PUSH TO TALK'):'VOICE LIVE');
    dot.className=transmitting?'talk':'live';m.textContent=V.muted?'UNMUTE':'MUTE';e.textContent='MIC ON';
  }

  function attachAudio(call,id){
    safe(()=>{
      call.on('stream',stream=>{
        let a=V.audio.get(id);if(!a){a=document.createElement('audio');a.autoplay=true;a.playsInline=true;a.dataset.peer=id;document.body.appendChild(a);V.audio.set(id,a);}a.srcObject=stream;const p=a.play();if(p&&p.catch)p.catch(()=>{});
      });
      call.on('close',()=>removeAudio(id));
      call.on('error',()=>removeAudio(id));
    });
  }
  function removeAudio(id){const a=V.audio.get(id);if(!a)return;safe(()=>a.pause());safe(()=>a.srcObject=null);safe(()=>a.remove());V.audio.delete(id);}

  function answerIncoming(call){
    safe(()=>{
      if(V.stream)call.answer(V.stream); else call.answer();
      attachAudio(call,call.peer);
    });
  }

  function callPeer(id){if(!V.stream||!window.peer||!id)return;safe(()=>{const c=window.peer.call(id,V.stream,{metadata:{kind:'backrooms-voice'}});if(c)attachAudio(c,id);});}

  function hookPeer(){
    const p=window.peer;if(!p||p===hookPeer.last)return;if(!p.on)return;hookPeer.last=p;safe(()=>p.on('call',answerIncoming));
  }

  async function enable(){
    if(V.stream)return;
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){V.lastError='Microphone APIs unavailable';refresh();return;}
    try{
      V.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      V.enabled=true;V.muted=true;
      for(const t of V.stream.getAudioTracks())t.enabled=false;
      hookPeer();connectCurrentPeers();refresh();
      if(typeof showToast==='function')showToast('VOICE READY • MICROPHONE MUTED',1800);
    }catch(e){V.lastError=e&&e.name?e.name:'Microphone denied';refresh();if(typeof showToast==='function')showToast('MICROPHONE NOT AVAILABLE',2200);}
  }

  function setMuted(m){
    V.muted=!!m;
    if(V.stream)for(const t of V.stream.getAudioTracks())t.enabled=!V.muted;
    refresh();
  }
  function toggleMute(){if(!V.stream){enable();return;}setMuted(!V.muted);}
  function connectCurrentPeers(){
    hookPeer();
    safe(()=>{if(typeof connections!=='undefined'){for(const c of connections.values())if(c&&c.open)callPeer(c.peer);}});
    safe(()=>{if(typeof hostConnection!=='undefined'&&hostConnection&&hostConnection.open)callPeer(hostConnection.peer);});
  }

  function bindConnection(c){
    if(!c||V.wired?.has?.(c))return;
    try{if(!V.wired)V.wired=new WeakSet();if(V.wired.has(c))return;V.wired.add(c);}catch(e){}
    c.on('open',()=>{if(V.stream)callPeer(c.peer);});
    c.on('close',()=>removeAudio(c.peer));
  }

  function pump(){
    hookPeer();ui(typeof gameActive!=='undefined'&&gameActive);
    safe(()=>{if(typeof connections!=='undefined')for(const c of connections.values())bindConnection(c);});
    safe(()=>{if(typeof hostConnection!=='undefined')bindConnection(hostConnection);});
    if(typeof gameActive!=='undefined'&&gameActive&&V.stream&&V.enabled)connectCurrentPeers();
    const transmitting=V.stream&&V.enabled&&!V.muted&&(V.ptt?!V.pressed:true);
    if(V.stream)for(const t of V.stream.getAudioTracks())t.enabled=!!transmitting;
    refresh();requestAnimationFrame(pump);
  }

  function keys(){
    document.addEventListener('keydown',e=>{
      if(e.code==='KeyV'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();V.ptt=true;V.pressed=true;refresh();}
    });
    document.addEventListener('keyup',e=>{if(e.code==='KeyV'){V.pressed=false;refresh();}});
    window.addEventListener('blur',()=>{V.pressed=false;refresh();});
  }

  function init(){css();dom();keys();V.ptt=true;pump();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.BackroomsVoice={enable,toggleMute,setPushToTalk:on=>{V.ptt=!!on;refresh();},state:()=>({enabled:V.enabled,muted:V.muted,ptt:V.ptt,lastError:V.lastError})};
})();
