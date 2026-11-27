'use client';
import { useEffect, useRef, useState } from 'react';
import { plans, type Plan, price } from '@/lib/plans';
export default function Checkout() {
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('正在检查购买会话…');
  const [boundPlan,setBoundPlan]=useState<Plan|null>(null);
  const [email,setEmail]=useState(''),[emailLocked,setEmailLocked]=useState(false);
  const emailInput=useRef<HTMLInputElement>(null);
  const initialization = useRef<Promise<void> | null>(null);
  useEffect(() => {
    let disposed = false;
    const initialize = async () => {
      const ticket = new URLSearchParams(location.hash.slice(1)).get('ticket');
      history.replaceState(null, '', location.pathname + location.search);
      if (ticket) {
        const r = await fetch('/api/checkout/exchange', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }) });
        if (!r.ok) throw new Error('购买入口已失效，请回插件重新开始。');
      }
      const r = await fetch('/api/checkout/status', { cache: 'no-store' });
      if (!r.ok) throw new Error('购买会话不可用，请回插件重新开始，或检查沙盒配置。');
      const status=await r.json();
      if(status.status==='paid'){location.replace('/payment/return');return;}
      if(status.plan&&Object.hasOwn(plans,status.plan))setBoundPlan(status.plan);
      if(status.email){setEmail(status.email);setEmailLocked(true);}
    };
    // React strict-mode repeats effects in development. Consume the one-time ticket once.
    initialization.current ??= initialize();
    initialization.current.then(() => { if (!disposed) { setReady(true); setMessage('本页仅用于沙盒测试，不产生真实付款。'); } }).catch(e => { if (!disposed) setMessage(e.message); });
    return () => { disposed = true; };
  }, []);
  async function buy(plan: Plan) {
    if(!emailLocked&&!emailInput.current?.reportValidity())return;
    setBusy(true); setMessage('正在创建沙盒订单…');
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan,email }) });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error==='INVALID_PURCHASE_EMAIL'?'请输入有效的购买联系邮箱。':result.error==='PURCHASE_EMAIL_LOCKED'?'此订单已保存其他联系邮箱，请刷新页面继续原订单。':`暂时无法创建订单（${result.error}）。请勿重复付款，可重试同一套餐。`);
      location.assign(result.approvalUrl);
    } catch (e) { setMessage(e instanceof Error ? e.message : '请求失败，请重试。'); setBusy(false); }
  }
  return <><h1>{boundPlan?'继续未完成的购买':'选择 Pro 使用时长'}</h1><p>不限次数复制、按标签组复制、去重及 Markdown 列表样式。</p><div role="status" className="status">{message}</div>{boundPlan&&<p>已保留原订单，请继续原套餐，不会另建付款订单。</p>}<section className="purchase-contact"><label htmlFor="purchase-email">购买联系邮箱</label><input ref={emailInput} id="purchase-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={!ready||busy||emailLocked} onChange={e=>setEmail(e.target.value)} aria-describedby="purchase-email-help" placeholder="you@example.com"/><small id="purchase-email-help">邮箱随订单保存，用于购买联系与人工恢复。本版不发送自动邮件。<a href="/privacy" target="_blank" rel="noopener noreferrer">数据使用说明</a>{emailLocked&&"此订单的联系邮箱已保存。"}</small></section><div className="plans">{(Object.keys(plans) as Plan[]).map(p => <article key={p}><h2>{plans[p].name}</h2><div className="price">${price(p)} <small>USD</small></div><p>{p === 'lifetime' ? '一次性购买，无套餐到期时间。' : `首次自动激活起 ${p === 'trial' ? '72 小时' : '30 天'}，不自动续费。`}</p>{p === 'trial' && <p>同一可验证付款方仅限一次体验。</p>}<button disabled={!ready || busy || (!!boundPlan&&boundPlan!==p)} onClick={() => buy(p)}>{busy?'正在打开…':boundPlan===p?'继续沙盒付款':'使用沙盒付款'}</button></article>)}</div><small>付款确认后重新打开插件，将自动检查并激活；未及时更新时可点击检查购买结果，无需输入激活码。</small></>;
}
