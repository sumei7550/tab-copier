'use client';
import { useEffect, useRef, useState } from 'react';
import { pollPayment } from '@/lib/payment-poll';
export default function PaymentReturn() {
  const [message, setMessage] = useState('正在核实付款，请勿重复支付。'), [busy, setBusy] = useState(false);
  const current = useRef<AbortController|null>(null);
  async function check() {
    current.current?.abort();
    const controller=new AbortController();current.current=controller;
    setBusy(true);setMessage('正在核实付款，请勿重复支付。');
    try {
      const result=await pollPayment({signal:controller.signal,onRetry:()=>setMessage('付款结果确认中，正在自动重试，请勿重复支付。'),request:async()=>{
        const r=await fetch('/api/checkout/capture',{method:'POST',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20_000)])});
        const data=await r.json();if(!r.ok)throw new Error(data.error||'SERVICE_UNAVAILABLE');return data;
      }});
      setMessage(result.status==='paid'?'付款已确认。重新打开插件后会自动检查并激活 Pro，无需再次购买。':result.status==='review'?'订单需要人工核查，请联系客服，不要重复付款。':'当前订单状态：'+result.status);
    } catch (e) { if(!controller.signal.aborted)setMessage(`付款尚未确认（${e instanceof Error?e.message:'SERVICE_UNAVAILABLE'}）。自动检查已停止，可稍后重新检查；已付款时不要重复购买。`); }
    finally { if(!controller.signal.aborted)setBusy(false); }
  }
  useEffect(() => { void check();return()=>current.current?.abort(); }, []);
  return <section className="panel"><h1>确认沙盒付款结果</h1><p role="status">{message}</p><button onClick={check} disabled={busy}>重新检查</button><p><a href="mailto:sumei7550@outlook.com?subject=Tab%20Copier%20付款支持">联系客服</a></p></section>;
}
