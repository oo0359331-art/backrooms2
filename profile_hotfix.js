/* Profile save hotfix: broadcast the new profile immediately after saving. */
(function(){
  'use strict';
  window.sendProfileSoon=function(){
    try{
      if(typeof hostConnection!=='undefined' && hostConnection && typeof hostConnection._profileSend==='function') hostConnection._profileSend();
      if(typeof connections!=='undefined') for(const conn of connections.values()) if(conn && typeof conn._profileSend==='function') conn._profileSend();
    }catch(e){}
  };
})();
