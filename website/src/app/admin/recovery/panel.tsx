'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {plans,type Plan} from '@/lib/plans';

type Review={supportId:string;captureId:string;plan:Plan;purchaseEmail:string|null;paidAt:string|null;expiresAt:string|null;previewToken:string};
type Issued={recoveryUrl:string;expiresAt:string};
const errors:Record<string,string>={
  ADMIN_UNAUTHORIZED:'管理员密码不正确，或登录已过期，请重新登录。',
  SERVER_NOT_CONFIGURED:'管理功能尚未配置。请按项目文档设置管理员密码哈希后重新部署。',
  ADMIN_NOT_CONFIGURED:'管理员配置无效，请重新生成密码哈希后部署。',
  RATE_LIMITED:'操作过于频繁，请稍等一分钟后重试。',
  INVALID_RECOVERY_INPUT:'请检查参考编号和收款交易号。参考编号应为邮件中的 TC- 开头编号。',
  RECOVERY_REQUEST_NOT_FOUND:'没有找到有效的恢复申请。请让用户在当前插件点击“恢复购买”，再发送最新邮件模板。',
  ORDER_NOT_FOUND:'没有找到对应的沙盒收款订单。请使用订单的 PayPal 收款交易号（provider_capture_id）。',
  NOT_PAID:'订单未处于已付款状态，不能签发恢复链接。',
  REVOKED:'授权已撤销或订单不可恢复。',EXPIRED:'申请或套餐已到期，不能延长原有授权。',
  RECOVERY_USED:'这次申请已经完成恢复。请让用户检查插件，不要重复签发。',
  PREVIEW_EXPIRED:'核查结果已过期或申请发生变化，请重新核查订单。',
  PAYMENT_MISMATCH:'PayPal 交易与本地订单不匹配，未生成恢复链接。',
  OWNERSHIP_CHECK_REQUIRED:'请先确认购买归属，并填写至少 8 个字符的核查备注。',
  STORAGE_UNAVAILABLE:'数据库暂不可用。请确认已执行 004 迁移，稍后重试。',
  PAYPAL_AUTH_UNAVAILABLE:'PayPal 身份验证暂不可用，请检查 Vercel 的沙盒应用配置。',
  PAYPAL_REQUEST_FAILED:'暂时无法向 PayPal 核实交易，请稍后重试。',
  LIVE_DISABLED:'此管理页面当前仅支持沙盒环境。'
};
const date=(value:string|null)=>value?new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'无套餐到期时间';
export default function RecoveryAdmin(){
  const [authenticated,setAuthenticated]=useState(false),[initializing,setInitializing]=useState(true),[busy,setBusy]=useState(false);
  const [password,setPassword]=useState(''),[supportId,setSupportId]=useState(''),[captureId,setCaptureId]=useState('');
  const [review,setReview]=useState<Review|null>(null),[issued,setIssued]=useState<Issued|null>(null);
  const [verified,setVerified]=useState(false),[note,setNote]=useState(''),[message,setMessage]=useState(''),[failure,setFailure]=useState(false);
  const resultHeading=useRef<HTMLHeadingElement>(null);
  function status(text:string,error=false){setMessage(text);setFailure(error);}
  function resetReview(){setReview(null);setIssued(null);setVerified(false);setNote('');status('');}
  async function api(path:string,method='GET',data?:unknown){
    const response=await fetch('/api/admin/'+path,{method,cache:'no-store',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(45_000)});
    const result=await response.json();
    if(response.status===401){setAuthenticated(false);setReview(null);setIssued(null);}
    if(!response.ok)throw Error(errors[result.error]||`操作未完成（${result.error||response.status}），请稍后重试。`);
    return result;
  }
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/admin/session',{cache:'no-store',signal:controller.signal}).then(async r=>{
      if(r.ok)setAuthenticated(true);
      else if(r.status!==401){const result=await r.json();status(errors[result.error]||'无法检查管理员登录，请稍后重试。',true);}
    }).catch(()=>{if(!controller.signal.aborted)status('无法连接管理服务，请刷新重试。',true);}).finally(()=>{if(!controller.signal.aborted)setInitializing(false);});
    return()=>controller.abort();
  },[]);
  async function login(event:FormEvent){
    event.preventDefault();setBusy(true);status('正在验证管理员身份…');
    try{await api('session','POST',{password});setPassword('');setAuthenticated(true);status('');}
    catch(e){status(e instanceof Error?e.message:'登录失败，请重试。',true);}
    finally{setBusy(false);}
  }
  async function logout(){
    setBusy(true);try{await api('session','DELETE');setAuthenticated(false);resetReview();setSupportId('');setCaptureId('');}
    catch{status('退出未完成，请重试。',true);}finally{setBusy(false);}
  }
  async function preview(event:FormEvent){
    event.preventDefault();setBusy(true);resetReview();status('正在核对恢复申请、授权和 PayPal 收款记录…');
    try{const data=await api('recovery/preview','POST',{supportId,captureId});setReview(data);status('收款与授权核查通过。请继续核实购买归属。');}
    catch(e){status(e instanceof Error?e.message:'核查失败，请重试。',true);}
    finally{setBusy(false);}
  }
  async function issue(event:FormEvent){
    event.preventDefault();if(!review)return;setBusy(true);status('正在重新核实交易并生成恢复链接…');
    try{
      const data=await api('recovery/issue','POST',{supportId:review.supportId,captureId:review.captureId,previewToken:review.previewToken,ownershipVerified:verified,note});
      setIssued(data);setReview(null);status('恢复链接已生成。请只回复给已核实的购买者。');
      setTimeout(()=>resultHeading.current?.focus(),0);
    }catch(e){status(e instanceof Error?e.message:'未取得恢复链接，请重新核查后重试。',true);}
    finally{setBusy(false);}
  }
  async function copy(template=false){
    if(!issued)return;
    const content=template?`您好，已核实您的购买，恢复链接如下：\n\n${issued.recoveryUrl}\n\n请在 ${date(issued.expiresAt)}（北京时间）前打开链接并点击“确认恢复”，然后回到发起申请的插件，在“联系客服”中再次点击“恢复购买”。\n\n原套餐到期时间保持不变，恢复期间请勿再次卸载插件。`:issued.recoveryUrl;
    try{await navigator.clipboard.writeText(content);status(template?'回复内容已复制，请粘贴到用户邮件中发送。':'恢复链接已复制。');}
    catch{status('无法访问剪贴板，请手动选中下面的链接复制。',true);}
  }
  return <div className="recovery-admin">
    <div className="admin-heading"><div><span className="admin-eyebrow">TAB COPIER · 管理员</span><h1>恢复购买</h1><p>核实原订单，将权益恢复到用户当前的插件安装。</p></div>{authenticated&&<button className="admin-secondary" disabled={busy} onClick={logout}>退出登录</button>}</div>
    <p className={'admin-feedback'+(failure?' admin-error':'')} role={failure?'alert':'status'} aria-live="polite">{message|| (initializing?'正在检查管理员登录…':'')}</p>
    {!initializing&&!authenticated&&<section className="panel admin-login"><h2>管理员登录</h2><p>登录后可核查订单并签发恢复链接。会话有效期为 1 小时。</p><form onSubmit={login}><label htmlFor="admin-password">管理员密码</label><input id="admin-password" type="password" autoComplete="current-password" minLength={16} maxLength={128} required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/><button disabled={busy}>{busy?'正在验证…':'登录管理页面'}</button></form></section>}
    {authenticated&&<>
      <section className="panel admin-request"><div className="admin-step">1 · 核查订单</div><h2>填写用户的恢复申请</h2><form onSubmit={preview}><fieldset disabled={busy}><div className="admin-fields"><div><label htmlFor="support-id">邮件中的参考编号</label><input id="support-id" autoComplete="off" placeholder="TC-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required maxLength={39} value={supportId} onChange={e=>{setSupportId(e.target.value);resetReview();}}/><small>来自用户最近发送的邮件模板。</small></div><div><label htmlFor="capture-id">PayPal 收款交易号</label><input id="capture-id" autoComplete="off" placeholder="provider_capture_id" required maxLength={64} value={captureId} onChange={e=>{setCaptureId(e.target.value);resetReview();}}/><small>使用已付款订单的收款交易号，不是订单编号。</small></div></div><button>{busy?'正在处理…':'核查订单'}</button></fieldset></form></section>
      {review&&<section className="panel admin-review"><div className="admin-step">2 · 确认购买归属</div><h2>订单可恢复</h2><dl className="admin-details"><div><dt>套餐</dt><dd>{plans[review.plan]?.name||review.plan}</dd></div><div><dt>购买联系邮箱</dt><dd>{review.purchaseEmail||'历史订单未提供邮箱'} <small>（未验证）</small></dd></div><div><dt>付款时间</dt><dd>{review.paidAt?date(review.paidAt):'未记录'}</dd></div><div><dt>原套餐到期</dt><dd>{date(review.expiresAt)}</dd></div><div><dt>恢复目标</dt><dd>{review.supportId}</dd></div></dl><p className="admin-notice">邮箱匹配不代表购买归属已验证。请独立核实付款归属；用户兑换后会撤销旧安装的授权，原到期时间不变。</p><form onSubmit={issue}><fieldset disabled={busy}><label className="admin-check"><input type="checkbox" checked={verified} required onChange={e=>setVerified(e.target.checked)}/><span>我已核实购买归属，并确认恢复到此次申请的插件。</span></label><label htmlFor="review-note">核查备注</label><textarea id="review-note" required minLength={8} maxLength={300} value={note} onChange={e=>setNote(e.target.value)} placeholder="记录核查方式，不要填写密码、银行卡或其他敏感信息。"/><small>备注将保存在恢复记录中。核查结果 5 分钟内有效。</small><button disabled={!verified||note.trim().length<8}>{busy?'正在生成…':'生成恢复链接'}</button></fieldset></form></section>}
      {issued&&<section className="panel admin-issued"><div className="admin-step">3 · 回复用户邮件</div><h2 tabIndex={-1} ref={resultHeading}>恢复链接已准备好</h2><p>有效至 {date(issued.expiresAt)}（北京时间）。请先复制保存，再离开此页；页面不会自动发送邮件。</p><label htmlFor="recovery-link">用户恢复链接</label><textarea id="recovery-link" readOnly value={issued.recoveryUrl} onFocus={e=>e.target.select()}/><div className="admin-actions"><button onClick={()=>copy(true)}>复制邮件回复</button><button className="admin-secondary" onClick={()=>copy()}>只复制链接</button></div><p>用户打开链接并确认后，回到发起申请的插件再次点击“恢复购买”即可。请勿将链接发到公开渠道。</p></section>}
    </>}
  </div>;
}
