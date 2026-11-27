// Subscribe before the initial async load so activation during startup cannot be lost.
export function watchLocalState(storage, onChange, onError) {
  let ready=false,pending=false,running=false;
  async function flush(){
    if(!ready||running)return;
    running=true;
    try{while(pending){pending=false;try{await onChange();}catch(e){onError(e);}}}
    finally{running=false;}
  }
  storage.onChanged.addListener((changes,area)=>{
    if(area!=='local'||!Object.keys(changes).some(k=>['scope','format','markdownStyle','removeDuplicates','removeTracking','excludePinned','includeGroupName','entitlement','copyQuota','legacyOriginal'].includes(k)))return;
    pending=true;void flush();
  });
  return {ready(){ready=true;pending=true;return flush();}};
}
