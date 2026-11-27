import { config } from './config.mjs';
import { label } from './labels.mjs';
export async function send(type,data={}) { const r=await chrome.runtime.sendMessage({type,...data});if(!r?.ok)throw new Error(r?.error||'SERVICE_UNAVAILABLE');return r.result; }
export async function permission() { const origin=new URL(config.apiBase).origin+'/*';if(await chrome.permissions.contains({origins:[origin]}))return; if(!await chrome.permissions.request({origins:[origin]}))throw new Error('PERMISSION_DENIED'); }
export function bindDialogs(onChange=()=>{}) {
  const $=id=>document.getElementById(id), result=t=>{$('supportStatus').textContent=t;};
  const track=(event,properties={})=>{if(typeof TabCopierAnalytics!=='undefined')void TabCopierAnalytics.track(event,properties);};
  const pro=$('proDialog'),support=$('supportDialog');
  let active=false;
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
  async function template(){const s=await send('state');const zh=chrome.i18n.getUILanguage().startsWith('zh');return zh?'问题描述：\n\n参考编号：'+s.supportId+'\n\n仅付款或恢复问题需补充：\n购买联系邮箱：\nPayPal 付款邮箱（选填）：\nPayPal 交易号（如有）：\n\n请勿提供密码或授权凭证。':'Describe your issue:\n\nReference: '+s.supportId+'\n\nFor payment or recovery only:\nPurchase contact email:\nPayPal payer email (optional):\nPayPal transaction ID (if available):\n\nDo not include passwords or authorization tokens.';}
  $('mailBtn').textContent=label('email');$('mailBtn').onclick=safe(async()=>{const body=await template();await chrome.tabs.create({url:'mailto:sumei7550@outlook.com?subject='+encodeURIComponent('Tab Copier Support')+'&body='+encodeURIComponent(body)});result(label('mailHint'));});
  $('copyEmailBtn').textContent=label('copyEmail');$('copyEmailBtn').onclick=safe(async()=>{await navigator.clipboard.writeText('sumei7550@outlook.com');result(label('copied'));});
  $('copyTemplateBtn').textContent=label('copyTemplate');$('copyTemplateBtn').onclick=safe(async()=>{await navigator.clipboard.writeText(await template());result(label('copied'));});
  async function restore(){
    if($('restoreBtn').disabled)return;
    if(pro.open)pro.close();if(!support.open)support.showModal();
    const buttons=[$('restoreBtn'),$('restorePurchaseBtn')];
    const zh=chrome.i18n.getUILanguage().startsWith('zh');
    for(const button of buttons){button.disabled=true;button.textContent=zh?'正在恢复…':'Restoring…';}
    result(zh?'正在检查付款凭证和恢复申请…':'Checking purchase credentials and recovery request…');
    try{
      track('Restore Purchase Clicked');if(!config.publicKey)throw new Error('PAYMENT_NOT_CONFIGURED');await permission();
      const r=await send('restore');track('Restore Purchase Result',{status:r.status});
      result(r.status==='active'?label('active'):(zh?'恢复申请已准备好。请使用上方邮件模板联系客服，收到恢复链接后打开并确认，再点击此处完成恢复。':'Recovery request is ready. Contact support using the email template above. Open and confirm the recovery link you receive, then click Restore purchase again.'));
      await onChange();
    }catch(e){result(label(e.message==='PAYMENT_NOT_CONFIGURED'?'notConfigured':'serviceError'));}
    finally{for(const button of buttons){button.disabled=false;button.textContent=label('restore');}}
  }
  $('restoreBtn').textContent=label('restore');$('restoreBtn').onclick=restore;
  $('restorePurchaseBtn').textContent=label('restore');$('restorePurchaseBtn').onclick=restore;
  return {
    update(state){active=!!state.claims;$('upgradeBtn').hidden=active;$('restorePurchaseBtn').hidden=active;$('restoreBtn').hidden=active;$('recoveryHint').hidden=active;if(active&&pro.open)pro.close();},
    upgrade(){if(active)return;track('Upgrade Viewed');if(support.open)support.close();$('proDescription').textContent=label('proRequired');if(!pro.open)pro.showModal();},
    contact(){track('Support Opened');result('');if(!support.open)support.showModal();}
  };
}
