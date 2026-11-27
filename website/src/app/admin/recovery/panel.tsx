'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {plans,type Plan} from '@/lib/plans';

type Review={supportId:string;captureId:string;transactionId:string;matchMethod:string;plan:Plan;purchaseEmail:string|null;paypalPayerEmail:string|null;emailMatches:boolean|null;paypalEmailMatches:boolean|null;paidAt:string|null;expiresAt:string|null;previewToken:string;lookupInput:Record<string,unknown>};
type Issued={recoveryUrl:string;expiresAt:string};
type Candidate={id:string;plan:Plan;purchase_email:string|null;paypal_payer_email:string|null;paid_at:string|null;provider_capture_id:string};
const errors:Record<string,string>={
  ADMIN_UNAUTHORIZED:'管理员密码不正确，或登录已过期，请重新登录。',
  SERVER_NOT_CONFIGURED:'管理功能尚未配置。请按项目文档设置管理员密码哈希后重新部署。',
  ADMIN_NOT_CONFIGURED:'管理员配置无效，请重新生成密码哈希后部署。',
  RATE_LIMITED:'操作过于频繁，请稍等一分钟后重试。',
  INVALID_RECOVERY_INPUT:'请填写有效的 TC- 参考编号，并至少提供一个交易号或邮箱。',
  RECOVERY_REQUEST_NOT_FOUND:'没有找到有效的恢复申请。请让用户在当前插件点击“恢复购买”，再发送最新邮件模板。',
  ORDER_NOT_FOUND:'交易暂未关联本地订单，需要进一步人工核查；不代表没有付款。',
  TRANSACTION_MANUAL_REVIEW_REQUIRED:'该交易号需要人工核查，请先在卖家 PayPal 后台确认对应收款。',
  TRANSACTION_ALIAS_CONFLICT:'此交易号已关联其他订单，已停止处理。请核对两个编号是否确属同一笔交易。',
  INVALID_PROBE_PAIR:'接口验证需要同一笔交易的两个不同编号：买家号和卖家收款号。',
  INVALID_PAYMENT_DATE:'请填写有效付款日期，查询范围为近三年。',
  INVALID_PURCHASE_EMAIL:'辅助邮箱格式不正确；不清楚时可以留空。',
  ORDER_SELECTION_INVALID:'所选订单与邮箱或已匹配的交易号不一致，请重新查询。',
  NOT_PAID:'订单未处于已付款状态，不能签发恢复链接。',
  REVOKED:'授权已撤销或订单不可恢复。',EXPIRED:'申请或套餐已到期，不能延长原有授权。',
  RECOVERY_USED:'这次申请已经完成恢复。请让用户检查插件，不要重复签发。',
  PREVIEW_EXPIRED:'核查结果已过期或申请发生变化，请重新核查订单。',
  PAYMENT_MISMATCH:'PayPal 交易与本地订单不匹配，未生成恢复链接。',
  OWNERSHIP_CHECK_REQUIRED:'请先确认购买归属，并填写至少 8 个字符的核查备注。',
  STORAGE_UNAVAILABLE:'数据库暂不可用。请确认已执行 005 迁移，稍后重试。',
  PAYPAL_AUTH_UNAVAILABLE:'PayPal 身份验证暂不可用，请检查 Vercel 的沙盒应用配置。',
  PAYPAL_REQUEST_FAILED:'暂时无法向 PayPal 核实交易，请稍后重试。',
  LIVE_DISABLED:'此管理页面当前仅支持沙盒环境。'
};
const date=(value:string|null)=>value?new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'无套餐到期时间';
export default function RecoveryAdmin(){
  const [authenticated,setAuthenticated]=useState(false),[initializing,setInitializing]=useState(true),[busy,setBusy]=useState(false);
  const [password,setPassword]=useState(''),[supportId,setSupportId]=useState(''),[captureId,setCaptureId]=useState('');
  const [email,setEmail]=useState(''),[paypalEmail,setPaypalEmail]=useState(''),[paymentDate,setPaymentDate]=useState('');
  const [manualReason,setManualReason]=useState(''),[manualCaptureId,setManualCaptureId]=useState(''),[manualVerified,setManualVerified]=useState(false),[probeResult,setProbeResult]=useState('');
  const [review,setReview]=useState<Review|null>(null),[issued,setIssued]=useState<Issued|null>(null);
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [verified,setVerified]=useState(false),[note,setNote]=useState(''),[message,setMessage]=useState(''),[failure,setFailure]=useState(false);
  const resultHeading=useRef<HTMLHeadingElement>(null);
  function status(text:string,error=false){setMessage(text);setFailure(error);}
  function resetReview(){setReview(null);setIssued(null);setCandidates([]);setVerified(false);setNote('');status('');}
  function resetTarget(){resetReview();setManualReason('');setManualCaptureId('');setManualVerified(false);setProbeResult('');}
  async function api(path:string,method='GET',data?:unknown){
    const response=await fetch('/api/admin/'+path,{method,cache:'no-store',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(90_000)});
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
    setBusy(true);try{await api('session','DELETE');setAuthenticated(false);resetTarget();setSupportId('');setCaptureId('');setEmail('');setPaypalEmail('');}
    catch{status('退出未完成，请重试。',true);}finally{setBusy(false);}
  }
  async function preview(event:FormEvent|null,selectedOrderId?:string){
    event?.preventDefault();setBusy(true);resetReview();status('正在核对恢复申请、授权和 PayPal 收款记录…');
    try{
      const lookupInput={supportId,transactionId:captureId,email,paypalEmail,paymentDate,...(manualCaptureId?{manualCaptureId,manualVerified}:{}),...(selectedOrderId?{selectedOrderId}:{})};
      const data=await api('recovery/preview','POST',lookupInput);
      if(data.lookupStatus==='order_selection_required'){setManualReason('');setCandidates(data.candidates);status('已按邮箱找到候选订单。请选择用户对应的那一笔，再核实付款。');}
      else if(data.lookupStatus==='manual_review_required'){setManualReason(data.reason);status('未能自动关联订单，需要人工核查。这不代表没有付款。');}
      else{setManualReason('');setReview({...data,lookupInput});status('交易与授权核查通过。请继续核实购买归属。');}
    }
    catch(e){status(e instanceof Error?e.message:'核查失败，请重试。',true);}
    finally{setBusy(false);}
  }
  async function issue(event:FormEvent){
    event.preventDefault();if(!review)return;setBusy(true);status('正在重新核实交易并生成恢复链接…');
    try{
      const data=await api('recovery/issue','POST',{...review.lookupInput,previewToken:review.previewToken,ownershipVerified:verified,note});
      setIssued(data);setReview(null);status('恢复链接已生成。请只回复给已核实的购买者。');
      setTimeout(()=>resultHeading.current?.focus(),0);
    }catch(e){status(e instanceof Error?e.message:'未取得恢复链接，请重新核查后重试。',true);}
    finally{setBusy(false);}
  }
  async function probe(){
    setBusy(true);setProbeResult('正在使用当前 PayPal 沙盒配置分别查询买家号和卖家号…');
    try{
      const data=await api('paypal/probe','POST',{supportId,transactionId:captureId,manualCaptureId});
      const conclusion:Record<string,string>={buyer_match_observed:'本次查询观察到买家号与卖家号均可关联此订单。',buyer_not_matched_in_this_test:'卖家号查到对应订单，买家号本次未匹配；请使用人工核查关联。',reporting_permission_required:'当前 PayPal 应用缺少交易查询权限，本次无法判断买家号查询能力。',inconclusive:'本次结果不足以判断。新交易可能尚未进入报表，请稍后重试或人工核查。'};
      setProbeResult((conclusion[data.conclusion]||'需要人工核查。')+`\n买家号：${data.buyer.status}，返回 ${data.buyer.returnedCount} 条，关联订单：${data.buyer.relatedToOrder?'是':'否'}。\n卖家号：${data.seller.status}，返回 ${data.seller.returnedCount} 条，关联订单：${data.seller.relatedToOrder?'是':'否'}。`);
    }catch(e){setProbeResult(e instanceof Error?e.message:'接口验证失败，请稍后重试。');}finally{setBusy(false);}
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
      <section className="panel admin-request"><div className="admin-step">1 · 核查订单</div><h2>填写用户的恢复申请</h2><form onSubmit={preview}><fieldset disabled={busy}><div className="admin-fields">
        <div><label htmlFor="support-id">邮件中的参考编号</label><input id="support-id" autoComplete="off" placeholder="TC-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required maxLength={39} value={supportId} onChange={e=>{setSupportId(e.target.value);resetTarget();}}/><small>来自用户最近发送的邮件模板。</small></div>
        <div><label htmlFor="capture-id">PayPal 交易号（买家或卖家，选填）</label><input id="capture-id" autoComplete="off" maxLength={64} value={captureId} onChange={e=>{setCaptureId(e.target.value);resetTarget();}}/><small>提供时优先精确匹配；没有交易号时，可填写下方任一邮箱查找候选订单。</small></div>
        <div><label htmlFor="purchase-contact">购买联系邮箱（选填）</label><input id="purchase-contact" type="email" autoComplete="off" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);resetReview();}}/><small>用户付款前填写的联系邮箱，仅辅助核对。</small></div>
        <div><label htmlFor="paypal-email">PayPal 付款邮箱（选填）</label><input id="paypal-email" type="email" autoComplete="off" maxLength={254} value={paypalEmail} onChange={e=>{setPaypalEmail(e.target.value);resetReview();}}/><small>与 PayPal 交易返回的付款邮箱核对，不据此单独授权。</small></div>
        <div><label htmlFor="payment-date">付款日期（选填）</label><input id="payment-date" type="date" value={paymentDate} onChange={e=>{setPaymentDate(e.target.value);resetReview();}}/><small>用于 PayPal 接口检索；不填时查询最近 30 天。已保存的交易号匹配不受此日期限制。</small></div>
      </div><button>{busy?'正在处理…':'核查订单'}</button></fieldset></form></section>
      {candidates.length>0&&<section className="panel"><div className="admin-step">请选择对应订单</div><h2>邮箱匹配到 {candidates.length} 笔候选订单</h2><p>邮箱只用于找单，不会自动恢复。选择后系统会核实 PayPal 交易，无需复制卖家收款号。</p><div className="admin-candidates">{candidates.map(candidate=><article key={candidate.id}><h3>{plans[candidate.plan]?.name||candidate.plan}</h3><p>付款时间：{candidate.paid_at?date(candidate.paid_at):'未记录'}<br/>购买联系邮箱：{candidate.purchase_email||'未提供'}<br/>PayPal 付款邮箱：{candidate.paypal_payer_email||'尚未获取'}<br/>卖家收款号：{candidate.provider_capture_id}</p><button disabled={busy} onClick={()=>preview(null,candidate.id)}>核查这笔订单</button></article>)}</div><small>每个邮箱最多显示最近 20 笔已付款订单；历史订单可能尚未收集邮箱。</small></section>}
      {manualReason==='no_email_candidates'&&<section className="panel"><h2>需要进一步核对</h2><p>这两个邮箱下没有已保存的候选订单。历史订单可能没有收集邮箱，不能据此认定未付款。请补充买家或卖家交易号，或在卖家 PayPal 后台核查付款记录。</p></section>}
      {manualReason&&manualReason!=='no_email_candidates'&&<section className="panel admin-manual"><div className="admin-step">需要人工核查</div><h2>用买家交易号找到对应收款</h2><p>{manualReason==='reporting_permission_denied'?'当前 PayPal 应用无交易报表查询权限。':manualReason==='reporting_unavailable'?'PayPal 查询暂不可用。':manualReason==='ambiguous_match'?'接口返回了多个候选，无法唯一关联。':'接口未提供可验证的订单关联。'} 报表记录可能延迟最多 3 小时；查不到不代表没有付款。</p><ol><li>登录卖家 PayPal 的交易记录，用用户提供的买家交易号搜索。</li><li>确认同一笔付款后，把对应卖家收款交易号填在下面。</li></ol><form onSubmit={preview}><fieldset disabled={busy}><label htmlFor="manual-capture">已核实的对应卖家收款交易号</label><input id="manual-capture" required maxLength={64} value={manualCaptureId} onChange={e=>{setManualCaptureId(e.target.value);setManualVerified(false);resetReview();setProbeResult('');}}/><label className="admin-check" style={{marginTop:16}}><input type="checkbox" required checked={manualVerified} onChange={e=>setManualVerified(e.target.checked)}/><span>我已在卖家 PayPal 后台核实：上面两个交易号属于同一笔付款。</span></label><div className="admin-actions"><button disabled={!manualVerified||!manualCaptureId}>继续核查并关联</button><button type="button" className="admin-secondary" disabled={!manualCaptureId} onClick={probe}>对比 PayPal 接口查询</button></div><small>生成恢复链接时才保存已核实的编号关联。邮箱相同不会自动建立关联。</small></fieldset></form>{probeResult&&<p className="status" role="status">{probeResult}</p>}</section>}
      {review&&<section className="panel admin-review"><div className="admin-step">2 · 确认购买归属</div><h2>订单可恢复</h2><dl className="admin-details"><div><dt>套餐</dt><dd>{plans[review.plan]?.name||review.plan}</dd></div><div><dt>匹配依据</dt><dd>{{seller_transaction:'卖家交易号',saved_buyer_transaction:'已核实的买家交易号',paypal_reporting:'PayPal 接口关联',manual_paypal_dashboard:'管理员在 PayPal 后台核实关联',email_candidate:'按邮箱找到、由管理员选择的订单'}[review.matchMethod]}</dd></div><div><dt>用户提供的交易号</dt><dd>{review.transactionId||'未提供（按邮箱查找）'}</dd></div><div><dt>对应卖家收款号</dt><dd>{review.captureId}</dd></div><div><dt>购买联系邮箱</dt><dd>{review.purchaseEmail||'历史订单未提供'} <small>（未验证）{review.emailMatches===true?' · 与辅助输入一致':review.emailMatches===false?' · 与辅助输入不同':''}</small></dd></div><div><dt>PayPal 付款邮箱</dt><dd>{review.paypalPayerEmail||'PayPal 未返回'}<small>{review.paypalEmailMatches===true?'与辅助输入一致':review.paypalEmailMatches===false?'与辅助输入不同':''}</small></dd></div><div><dt>付款时间</dt><dd>{review.paidAt?date(review.paidAt):'未记录'}</dd></div><div><dt>原套餐到期</dt><dd>{date(review.expiresAt)}</dd></div><div><dt>恢复目标</dt><dd>{review.supportId}</dd></div></dl><p className="admin-notice">邮箱匹配不代表购买归属已验证。请独立核实付款归属；用户兑换后会撤销旧安装的授权，原到期时间不变。</p><form onSubmit={issue}><fieldset disabled={busy}><label className="admin-check"><input type="checkbox" checked={verified} required onChange={e=>setVerified(e.target.checked)}/><span>我已核实购买归属，并确认恢复到此次申请的插件。</span></label><label htmlFor="review-note">核查备注（至少 8 个字符）</label><textarea id="review-note" required minLength={8} maxLength={300} value={note} onChange={e=>setNote(e.target.value)} placeholder="记录核查方式，不要填写密码、银行卡或其他敏感信息。"/><small>已填写 {note.trim().length}/300 个字符，至少需要 8 个。备注将保存在恢复记录中，核查结果 5 分钟内有效。</small><button disabled={!verified||note.trim().length<8}>{busy?'正在生成…':'生成恢复链接'}</button></fieldset></form></section>}
      {issued&&<section className="panel admin-issued"><div className="admin-step">3 · 回复用户邮件</div><h2 tabIndex={-1} ref={resultHeading}>恢复链接已准备好</h2><p>有效至 {date(issued.expiresAt)}（北京时间）。请先复制保存，再离开此页；页面不会自动发送邮件。</p><label htmlFor="recovery-link">用户恢复链接</label><textarea id="recovery-link" readOnly value={issued.recoveryUrl} onFocus={e=>e.target.select()}/><div className="admin-actions"><button onClick={()=>copy(true)}>复制邮件回复</button><button className="admin-secondary" onClick={()=>copy()}>只复制链接</button></div><p>用户打开链接并确认后，回到发起申请的插件再次点击“恢复购买”即可。请勿将链接发到公开渠道。</p></section>}
    </>}
  </div>;
}
