/* Backrooms Remastered — multiplayer level progression + per-level Hollow Purple reward. */
(function(){
  'use strict';

  const NEXT_LEVEL = { '0':'1', '1':'2' };
  const LEVEL_NAMES = {
    '0':'LEVEL 0 // THE YELLOW ROOMS',
    '1':'LEVEL 1 // THE HABITABLE ZONE',
    '2':'LEVEL 37 // THE POOLROOMS'
  };
  const REWARD_KEY = 'backrooms_hollow_purple_unlocked';
  const q = id => document.getElementById(id);
  let transitionBusy = false;
  let originalSendTo = null;

  function clearLevelReward(){
    try { localStorage.removeItem(REWARD_KEY); } catch(_) {}
  }

  function isSolo(){
    return typeof isHost !== 'undefined' && !isHost &&
      typeof hostConnection !== 'undefined' && !hostConnection &&
      typeof roomId !== 'undefined' && !roomId;
  }

  function broadcast(type, payload){
    if(typeof connections === 'undefined' || !connections || !originalSendTo) return;
    for(const conn of connections.values()) originalSendTo(conn, Object.assign({type}, payload || {}));
  }

  function showEscapePopup(levelId, nextId){
    const screen = q('win-screen');
    const text = q('win-text');
    if(!screen || !text) return;
    const name = LEVEL_NAMES[String(levelId)] || ('LEVEL ' + levelId);
    const nextName = nextId ? (LEVEL_NAMES[String(nextId)] || ('LEVEL ' + nextId)) : 'THE NEXT HELL';
    text.innerHTML = nextId
      ? `<strong>YOU ESCAPED</strong><br>${name}<br><strong>HELL IS COMING: ${nextName}</strong>`
      : `<strong>YOU ESCAPED</strong><br>${name}<br><strong>THE NEXT HELL IS COMING.</strong>`;
    screen.style.display = 'flex';
  }

  function resetForNextLevel(nextId){
    clearLevelReward();
    transitionBusy = false;
    if(typeof currentLevel !== 'undefined') currentLevel = String(nextId);
    if(typeof inventory !== 'undefined') inventory = [];
    if(typeof updateInventoryUI === 'function') updateInventoryUI();
    if(typeof exitOpen !== 'undefined') exitOpen = false;
    if(typeof buildLevel === 'function') buildLevel(String(nextId));
    if(typeof initializeWorldItems === 'function') initializeWorldItems();
    if(typeof stamina !== 'undefined') stamina = 100;
    if(typeof updateStamina === 'function') updateStamina(0);
    if(typeof camera !== 'undefined' && camera) camera.position.set(0,1.6,0);
    if(typeof entityActive !== 'undefined') entityActive = true;
    if(typeof gameActive !== 'undefined') gameActive = true;
    const screen = q('win-screen'); if(screen) screen.style.display='none';
    if(typeof setNetworkStatus === 'function' && typeof isHost !== 'undefined')
      setNetworkStatus(isHost ? 'HOST • LEVEL '+nextId : 'LEVEL '+nextId);
    if(typeof controls !== 'undefined' && controls && typeof isMobileMode !== 'undefined' && !isMobileMode){
      try { controls.lock(); } catch(_) {}
    }
    try { if(typeof updateInfiniteWorld === 'function') updateInfiniteWorld(true); } catch(_) {}
  }

  function scheduleNextLevel(completedId){
    if(transitionBusy) return;
    const nextId = NEXT_LEVEL[String(completedId)] || null;
    showEscapePopup(completedId, nextId);

    // Guests wait for the host's level message. Solo and host players advance locally.
    if(!isSolo() && !(typeof isHost !== 'undefined' && isHost)){
      transitionBusy = true;
      window.__levelProgressWaitingForHost = true;
      return;
    }

    transitionBusy = true;
    if(!nextId){
      setTimeout(()=>{ transitionBusy=false; }, 3500);
      return;
    }

    setTimeout(()=>{
      if(typeof isHost !== 'undefined' && isHost){
        broadcast('level', { level:String(nextId) });
      }
      resetForNextLevel(nextId);
    }, 3400);
  }

  function wrapWinGame(){
    if(typeof window.winGame !== 'function' || window.__levelProgressWinWrapped) return !!window.__levelProgressWinWrapped;
    const oldWin = window.winGame;
    window.winGame = winGame = function(){
      if(transitionBusy && !window.__levelProgressBroadcastingWin) return;
      const completedId = (typeof currentLevel !== 'undefined') ? String(currentLevel) : '0';
      oldWin.apply(this, arguments);
      // The existing playability layer grants Hollow Purple here. It is cleared when the next level starts.
      showEscapePopup(completedId, NEXT_LEVEL[completedId] || null);
      if(typeof isHost !== 'undefined' && isHost && !window.__levelProgressBroadcastingWin){
        // Make the whole multiplayer room escape together.
        broadcast('win', {});
      }
      scheduleNextLevel(completedId);
    };
    window.__levelProgressWinWrapped = true;
    return true;
  }

  function wrapBuildLevel(){
    if(typeof window.buildLevel !== 'function' || window.__levelProgressBuildWrapped) return !!window.__levelProgressBuildWrapped;
    const oldBuild = window.buildLevel;
    window.buildLevel = buildLevel = function(level){
      const id = String(level);
      if(typeof window.__levelProgressLastBuilt !== 'undefined' && window.__levelProgressLastBuilt !== id){
        clearLevelReward();
        transitionBusy = false;
        window.__levelProgressWaitingForHost = false;
      }
      window.__levelProgressLastBuilt = id;
      return oldBuild.apply(this, arguments);
    };
    window.__levelProgressBuildWrapped = true;
    return true;
  }

  function wrapSendTo(){
    if(typeof window.sendTo !== 'function' || window.__levelProgressSendWrapped) return !!window.__levelProgressSendWrapped;
    originalSendTo = window.sendTo;
    window.sendTo = sendTo = function(conn, data){
      if(data && data.type === 'win' && typeof isHost !== 'undefined' && isHost && !window.__levelProgressBroadcastingWin){
        // A guest reached the exit: convert it into a room-wide victory.
        window.__levelProgressBroadcastingWin = true;
        try { if(typeof winGame === 'function') winGame(); } catch(_) {}
        window.__levelProgressBroadcastingWin = false;
        return;
      }
      return originalSendTo(conn, data);
    };
    window.__levelProgressSendWrapped = true;
    return true;
  }

  function boot(){
    if(!wrapBuildLevel() || !wrapWinGame()) return setTimeout(boot, 150);
    if(!wrapSendTo()) return setTimeout(boot, 150);
    clearLevelReward();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
