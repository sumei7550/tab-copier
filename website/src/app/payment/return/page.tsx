'use client';
import { useEffect, useRef, useState } from 'react';
export default function PaymentReturn() {
  const [message, setMessage] = useState('正在核实付款，请勿重复支付。'), [busy, setBusy] = useState(false);
  const started = useRef(false);
  async function check() {
    setBusy(true);
    try {
      const r = await fetch('/api/checkout/capture', { method: 'POST' }); const result = await r.json();
      if (!r.ok) throw new Error(`付款尚未确认（${result.error}）。请稍后重试；已付款时不要重复购买。`);
      setMessage(result.status === 'paid' ? '付款已确认。请返回插件检查结果，自动激活 Pro。' : result.status === 'review' ? '订单需要人工核查，请联系客服，不要重复付款。' : '当前订单状态：' + result.status);
    } catch (e) { setMessage(e instanceof Error ? e.message : '服务暂不可用，请重试。'); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (!started.current) { started.current = true; void check(); } }, []);
  return <section className="panel"><h1>确认沙盒付款结果</h1><p role="status">{message}</p><button onClick={check} disabled={busy}>重新检查</button><p><a href="mailto:sumei7550@outlook.com?subject=Tab%20Copier%20付款支持">联系客服</a></p></section>;
}
