import { effectiveSettings, outputModel, usableUrl } from './extension/core.mjs';
import { label } from './extension/labels.mjs';
import { send, permission, bindDialogs } from './extension/client.mjs';

document.addEventListener('DOMContentLoaded', async () => {
  const $=id=>document.getElementById(id),t=(k,...v)=>TabCopierI18n.t(k,v),track=(e,p={})=>TabCopierAnalytics.track(e,{...p,surface:'popup'});
  let state,settings,tabs=[],selected=new Set(),anchor,groupName='',request=0,copying=false;
  const toast=(text,error=false)=>{$('toast').textContent=text;$('toast').style.color=error?'#a43a24':'#188038';$('toast').classList.remove('hidden');};
  const dialogs=bindDialogs(async()=>{await sync();await loadTabs();});
  function setLabels(){
    $('formatLabel').textContent=t('format');$('scopeLabel').textContent=label('scope');$('markdownStyleLabel').textContent=t('markdownStyle');
    for(const value of ['window','tab','group','all'])$('scopeSelect').querySelector(`[value="${value}"]`).textContent=label(value)+(value==='group'?' · Pro':'');
    for(const [value,key] of Object.entries({markdown:'formatMarkdown',urls:'formatUrls',titleUrl:'formatTitleUrl',html:'formatHtml'}))$('formatSelect').querySelector(`[value="${value}"]`).textContent=t(key);
    for(const [value,key] of Object.entries({plain:'plain',bullet:'markdownStyleBullet',ordered:'markdownStyleOrdered',task:'markdownStyleTask'}))$('markdownStyleSelect').querySelector(`[value="${value}"]`).textContent=(value==='plain'?label(key):t(key))+(value==='plain'?'':' · Pro');
    $('dedupLabel').textContent=t('removeDuplicates');$('dedupHelp').textContent=label('duplicateHelp');$('includeGroupLabel').textContent=label('includeGroup');
    $('filterInput').placeholder=t('filterTabs');$('filterInput').setAttribute('aria-label',t('filterTabs'));$('previewHeading').textContent=t('preview');$('refreshPreviewBtn').textContent=t('refreshPreview');$('settingsLink').textContent=t('settings');
    $('upgradeBtn').textContent=label('upgrade');$('contactBtn').textContent=label('contact');$('checkPurchaseBtn').textContent=label('check');
  }
  async function sync(){
    state=await send('state');settings=effectiveSettings(state.settings,state.access);
    if(settings.scope==='group'&&anchor?.groupId===-1)settings.scope='window';
    $('scopeSelect').value=settings.scope;$('formatSelect').value=settings.format;$('markdownStyleSelect').value=settings.markdownStyle;
    $('dedupToggle').checked=settings.removeDuplicates;$('includeGroupName').checked=settings.includeGroupName;
    $('quotaLabel').textContent=state.claims?label('pro'):state.access.unlimited?label('legacy'):label('free',state.remaining);
    if(state.networkIssue)toast(label('serviceError'),true);
  }
  async function loadTabs(){
    const seq=++request;let result=[];groupName='';const scope=settings.scope;
    if(scope==='tab')result=[await chrome.tabs.get(anchor.id)];
    else if(scope==='group'&&anchor.groupId!==-1){result=await chrome.tabs.query({windowId:anchor.windowId,groupId:anchor.groupId});const group=await chrome.tabGroups.get(anchor.groupId);groupName=group.title||label('group');}
    else result=await chrome.tabs.query(scope==='all'?{}:{windowId:anchor.windowId});
    if(seq!==request)return;
    tabs=result.filter(tab=>usableUrl(tab.url)&&!(settings.excludePinned&&tab.pinned)).sort((a,b)=>a.windowId-b.windowId||a.index-b.index);
    selected=new Set(tabs.map(tab=>tab.id));render();
  }
  function visible(){const q=$('filterInput').value.trim().toLowerCase();return tabs.filter(tab=>`${tab.title} ${tab.url}`.toLowerCase().includes(q));}
  function model(){return outputModel(visible().filter(tab=>selected.has(tab.id)).map(tab=>({...tab,title:tab.title||t('untitled')})),settings,state.access,groupName);}
  function render(){
    const v=visible(),list=$('tabList');list.replaceChildren();
    if(!v.length){const p=document.createElement('p');p.className='empty-state';p.textContent=t($('filterInput').value?'noMatchingTabs':'noTabs');list.append(p);}
    for(const tab of v){const row=document.createElement('label');row.className='tab-item';const check=document.createElement('input');check.type='checkbox';check.checked=selected.has(tab.id);check.disabled=copying;check.onchange=()=>{check.checked?selected.add(tab.id):selected.delete(tab.id);track('Tab Selection Changed',{is_selected:check.checked,selected_count:selected.size});render();};const icon=document.createElement('img');icon.className='favicon';icon.src='icons/icon16.png';icon.alt='';const title=document.createElement('span');title.className='tab-title';title.textContent=tab.title||t('untitled');title.title=tab.title||'';row.append(check,icon,title);list.append(row);}
    const count=v.filter(tab=>selected.has(tab.id)).length;$('countLabel').textContent=t('selectedCount',String(count));$('selectAllBtn').textContent=t(count===v.length?'deselectAll':'selectAll');
    $('markdownStyleRow').hidden=settings.format!=='markdown';$('groupTitleRow').hidden=settings.scope!=='group';$('groupHint').hidden=anchor.groupId!==-1;$('groupHint').textContent=label('noGroup');
    const m=model(),preview=$('previewText');preview.replaceChildren();preview.classList.toggle('raw',settings.format!=='markdown');
    if(!m.items.length)preview.textContent=t('previewEmpty');
    else if(settings.format!=='markdown')preview.textContent=m.text;
    else {if(m.group){const h=document.createElement('strong');h.textContent=m.group;preview.append(h);}const style=m.settings.markdownStyle;const container=document.createElement(style==='ordered'?'ol':style==='plain'?'div':'ul');if(style==='task')container.className='task-list';for(const item of m.items){const row=document.createElement(style==='plain'?'p':'li');if(style==='task'){row.className='task-item';const check=document.createElement('input');check.type='checkbox';check.disabled=true;check.className='task-box';row.append(check);}const link=document.createElement('span');link.className='markdown-link';link.textContent=item.title||t('untitled');link.title=item.url;row.append(link);container.append(row);}preview.append(container);}
    $('dedupSummary').textContent=settings.removeDuplicates?label('removed',m.removed,m.items.length):'';$('copyBtn').disabled=copying||!m.items.length;$('copyBtnText').textContent=!state.access.unlimited&&state.remaining===0?label('quota'):t('copySelected');
    for(const id of ['scopeSelect','formatSelect','markdownStyleSelect','filterInput','dedupToggle','includeGroupName','selectAllBtn'])$(id).disabled=copying;
  }
  function gate(){if(state.networkIssue)toast(label('serviceError'),true);else dialogs.upgrade();}
  async function save(values){await chrome.storage.local.set(values);settings=effectiveSettings({...settings,...values},state.access);render();}
  try{[anchor]=await chrome.tabs.query({active:true,currentWindow:true});if(!anchor)throw new Error('NO_ACTIVE_TAB');setLabels();try{const userSettings=await chrome.action.getUserSettings();if(!userSettings.isOnToolbar){$('pinHint').hidden=false;$('pinHint').textContent=chrome.i18n.getUILanguage().startsWith('zh')?'点击 Chrome 拼图图标，找到 Tab Copier 并点击固定。':'Open Chrome’s extensions menu and pin Tab Copier for easy access.';}}catch{}$('scopeSelect').querySelector('[value="group"]').disabled=anchor.groupId===-1;await sync();await loadTabs();track('Popup Opened',{scope:settings.scope,format:settings.format});}
  catch{toast(label('serviceError'),true);$('copyBtn').disabled=true;return;}
  $('scopeSelect').onchange=async()=>{const scope=$('scopeSelect').value;if(scope==='group'&&!state.access.groups){$('scopeSelect').value=settings.scope;return gate();}try{await save({scope});await loadTabs();track('Window Scope Changed',{scope});}catch{toast(label('serviceError'),true);}};
  $('formatSelect').onchange=async()=>{await save({format:$('formatSelect').value});track('Format Changed',{format:settings.format});};
  $('markdownStyleSelect').onchange=async()=>{const value=$('markdownStyleSelect').value;if(value!=='plain'&&!state.access.lists){$('markdownStyleSelect').value=settings.markdownStyle;return gate();}await save({markdownStyle:value});track('Markdown Style Changed',{markdown_style:value});};
  $('dedupToggle').onchange=async()=>{const enabled=$('dedupToggle').checked;if(enabled&&!state.access.dedup){$('dedupToggle').checked=false;return gate();}await save({removeDuplicates:enabled});track('Deduplication Changed',{enabled});};
  $('includeGroupName').onchange=()=>save({includeGroupName:$('includeGroupName').checked});
  $('filterInput').oninput=render;$('refreshPreviewBtn').onclick=()=>{render();track('Preview Refresh Clicked');};
  $('selectAllBtn').onclick=()=>{const v=visible(),all=v.every(tab=>selected.has(tab.id));v.forEach(tab=>all?selected.delete(tab.id):selected.add(tab.id));render();track('Tab Selection Bulk Changed',{action:all?'deselect_all':'select_all'});};
  $('upgradeBtn').onclick=dialogs.upgrade;$('contactBtn').onclick=dialogs.contact;
  $('checkPurchaseBtn').onclick=async()=>{try{await permission();const result=await send('checkPurchase');await sync();render();toast(label(result.status==='active'?'active':'pending'));}catch{toast(label('serviceError'),true);}};
  $('coffeeLink').onclick=()=>track('Coffee Link Clicked',{destination:'ko-fi'});
  $('copyBtn').onclick=async()=>{
    copying=true;render();let prepared,written=false;
    try{prepared=await send('prepareCopy',{tabs:visible().filter(tab=>selected.has(tab.id)).map(tab=>({id:tab.id,title:tab.title||t('untitled'),url:tab.url})),scope:settings.scope,groupName});if(prepared.text!==model().text)throw new Error('PREVIEW_CHANGED');await navigator.clipboard.writeText(prepared.text);written=true;if(prepared.limited)await send('commitCopy',{operation:prepared.operation});toast(t('copiedCount',String(prepared.count)));track('Tabs Copied',{success:true,scope:settings.scope,format:settings.format,selected_count:prepared.count});}
    catch(e){if(prepared?.limited&&!written)await send('releaseCopy',{operation:prepared.operation}).catch(()=>{});if(e.message==='QUOTA_EXHAUSTED')dialogs.upgrade();else toast(written?label('copyUnrecorded'):t('copyFailed'),true);track('Tabs Copied',{success:written});}
    finally{copying=false;try{await sync();}catch{toast(label('serviceError'),true);}render();}
  };
  chrome.storage.onChanged.addListener(async(changes,area)=>{if(area!=='local'||!Object.keys(changes).some(k=>['scope','format','markdownStyle','removeDuplicates','removeTracking','excludePinned','includeGroupName','entitlement'].includes(k)))return;try{const previous=settings.scope,pinned=settings.excludePinned;await sync();if(previous!==settings.scope||pinned!==settings.excludePinned)await loadTabs();else render();}catch{toast(label('serviceError'),true);}});
});
