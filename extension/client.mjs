import { config } from './config.mjs';
import { label } from './labels.mjs';
export async function send(type,data={}) { const r=await chrome.runtime.sendMessage({type,...data});if(!r?.ok)throw new Error(r?.error||'SERVICE_UNAVAILABLE');return r.result; }
export async function permission() { const origin=new URL(config.apiBase).origin+'/*';if(await chrome.permissions.contains({origins:[origin]}))return; if(!await chrome.permissions.request({origins:[origin]}))throw new Error('PERMISSION_DENIED'); }
export function bindDialogs(onChange=()=>{}) {
  const $=id=>document.getElementById(id), result=t=>{$('supportStatus').textContent=t;};
  const track=(event,properties={})=>{if(typeof TabCopierAnalytics!=='undefined')void TabCopierAnalytics.track(event,properties);};
  const pro=$('proDialog'),support=$('supportDialog');
  const safe=fn=>async()=>{try{await fn();}catch(e){result(label(e.message==='PAYMENT_NOT_CONFIGURED'?'notConfigured':'serviceError'));}};
  $('proTitle').textContent='Tab Copier Pro';$('proDescription').textContent=label('proRequired');$('plansBtn').textContent=label('viewPlans');$('proClose').textContent=label('cancel');
  $('proClose').onclick=()=>pro.close();$('supportTitle').textContent=label('contact');$('supportIntro').textContent=label('supportIntro');$('mailHint').textContent=label('mailHint');$('recoveryHint').textContent=label('recoveryHint');
  $('supportClose').textContent=label('close');$('supportClose').onclick=()=>support.close();
  $('plansBtn').onclick=async()=>{
    if($('plansBtn').disabled)return;
    $('plansBtn').disabled=true;$('plansBtn').textContent=chrome.i18n.getUILanguage().startsWith('zh')?'正在打开…':'Opening…';
    try{if(!config.publicKey)throw new Error('PAYMENT_NOT_CONFIGURED');await permission();const r=await send('buy');track('Checkout Opened');pro.close();await onChange();if(r.status==='active')result(label('active'));}
    catch(e){$('proDescription').textContent=label(e.message==='PAYMENT_NOT_CONFIGURED'?'notConfigured':'serviceError')+' ('+e.message+')';}
    finally{$('plansBtn').disabled=false;$('plansBtn').textContent=label('viewPlans');}
  };
  async function template(){const s=await send('state');const zh=chrome.i18n.getUILanguage().startsWith('zh');return zh?'问题描述：\n\n参考编号：'+s.supportId+'\n\n仅付款或恢复问题需补充：\n购买邮箱：\nPayPal 交易号：\n\n请勿提供密码或授权凭证。':'Describe your issue:\n\nReference: '+s.supportId+'\n\nFor payment or recovery only:\nPurchase email:\nPayPal transaction ID:\n\nDo not include passwords or authorization tokens.';}
  $('mailBtn').textContent=label('email');$('mailBtn').onclick=safe(async()=>{const body=await template();await chrome.tabs.create({url:'mailto:sumei7550@outlook.com?subject='+encodeURIComponent('Tab Copier Support')+'&body='+encodeURIComponent(body)});result(label('mailHint'));});
  $('copyEmailBtn').textContent=label('copyEmail');$('copyEmailBtn').onclick=safe(async()=>{await navigator.clipboard.writeText('sumei7550@outlook.com');result(label('copied'));});
  $('copyTemplateBtn').textContent=label('copyTemplate');$('copyTemplateBtn').onclick=safe(async()=>{await navigator.clipboard.writeText(await template());result(label('copied'));});
  $('restoreBtn').textContent=label('restore');$('restoreBtn').onclick=safe(async()=>{track('Restore Purchase Clicked');if(!config.publicKey)throw new Error('PAYMENT_NOT_CONFIGURED');await permission();const r=await send('restore');track('Restore Purchase Result',{status:r.status});result(label(r.status==='active'?'active':'contactRestore'));await onChange();});
  return { upgrade(){track('Upgrade Viewed');if(support.open)support.close();$('proDescription').textContent=label('proRequired');pro.showModal();}, contact(){track('Support Opened');result('');support.showModal();} };
}
