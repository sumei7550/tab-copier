import { effectiveSettings } from './extension/core.mjs';
import { label } from './extension/labels.mjs';
import { send, bindDialogs } from './extension/client.mjs';
document.addEventListener('DOMContentLoaded',async()=>{
  const $=id=>document.getElementById(id),t=k=>TabCopierI18n.t(k);let state,settings;
  const dialogs=bindDialogs(sync);
  async function sync(){state=await send('state');settings=effectiveSettings(state.settings,state.access);$('defaultScope').value=settings.scope;$('defaultFormat').value=settings.format;for(const key of ['excludePinned','removeDuplicates','removeTracking'])$(key).checked=settings[key];$('licenseState').textContent=state.claims?label('pro'):state.access.unlimited?label('legacy'):label('free',state.remaining);}
  for(const [id,key] of Object.entries({pageTitle:'settingsTitle',pageIntro:'settingsIntro',copyDefaultsHeading:'copyDefaults',defaultFormatLabel:'defaultFormat',excludePinnedLabel:'excludePinned',removeTrackingLabel:'removeTracking',shortcutHeading:'keyboardShortcut',shortcutText:'shortcutDescription',shortcutLink:'manageShortcuts'}))$(id).textContent=t(key);
  $('defaultScopeLabel').textContent=label('defaultScope');$('removeDuplicatesLabel').textContent=label('defaultDedup');$('upgradeBtn').textContent=label('upgrade');$('contactBtn').textContent=label('contact');
  for(const v of ['window','tab','group','all'])$('defaultScope').querySelector(`[value="${v}"]`).textContent=label(v)+(v==='group'?' · Pro':'');
  for(const [value,key] of Object.entries({markdown:'formatMarkdown',urls:'formatUrls',titleUrl:'formatTitleUrl',html:'formatHtml'}))$('defaultFormat').querySelector(`[value="${value}"]`).textContent=t(key);
  try{await sync();}catch{$('savedMessage').textContent=label('serviceError');return;}
  $('upgradeBtn').onclick=dialogs.upgrade;$('contactBtn').onclick=dialogs.contact;
  for(const id of ['defaultScope','defaultFormat','excludePinned','removeDuplicates','removeTracking'])$(id).onchange=async()=>{
    if((id==='removeDuplicates'&&$(id).checked&&!state.access.dedup)||(id==='defaultScope'&&$(id).value==='group'&&!state.access.groups)){
      await sync();if(state.networkIssue)$('savedMessage').textContent=label('serviceError');else dialogs.upgrade();return;
    }
    const key={defaultScope:'scope',defaultFormat:'format'}[id]||id;
    try{const value=['defaultScope','defaultFormat'].includes(id)?$(id).value:$(id).checked;await chrome.storage.local.set({[key]:value});$('savedMessage').textContent=t('saved');TabCopierAnalytics.track('Settings Saved',{[key]:value,surface:'options'});}catch{$('savedMessage').textContent=label('serviceError');}
  };
  chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&Object.keys(changes).some(k=>['scope','format','excludePinned','removeDuplicates','removeTracking','entitlement'].includes(k)))sync().catch(()=>{$('savedMessage').textContent=label('serviceError');});});
  TabCopierAnalytics.track('Settings Opened');
});
