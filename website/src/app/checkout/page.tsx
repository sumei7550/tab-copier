'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { terminalPaymentStates } from '@/lib/payment-poll';
import { isPlan, plans, type Plan, price } from '@/lib/plans';
import './pricing.css';

const descriptions: Record<Plan, string> = {
  trial: '首次激活起 72 小时。同一付款账号限购一次。',
  month: '首次激活起 30 天。',
  lifetime: '无到期时间。',
};

type CheckoutSession =
  | { kind: 'choose' }
  | { kind: 'resume'; plan: Plan; email: string | null }
  | { kind: 'result' };

const orderErrors: Record<string, string> = {
  INVALID_PURCHASE_EMAIL: '请输入有效的邮箱地址。',
  PURCHASE_EMAIL_LOCKED: '原订单已保存联系邮箱。请刷新页面后继续付款。',
  EXPIRED: '请刷新页面检查原订单，或从 Tab Copier 扩展重新打开购买页。',
  PAYMENT_REQUIRES_REVIEW: '暂时无法继续这笔订单，请联系客服核查。',
  UNAUTHORIZED: '购买会话已失效，请回到 Tab Copier 扩展重新打开购买页。',
};

async function loadCheckout(): Promise<CheckoutSession> {
  const ticket = new URLSearchParams(location.hash.slice(1)).get('ticket');
  history.replaceState(history.state, '', location.pathname + location.search);
  if (ticket) {
    const response = await fetch('/api/checkout/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket }),
    });
    if (!response.ok) throw new Error('购买入口已失效，请回到 Tab Copier 扩展重新打开购买页。');
  }

  const response = await fetch('/api/checkout/status', { cache: 'no-store' });
  if (!response.ok) throw new Error('暂时无法打开购买会话，请从 Tab Copier 扩展重新进入。');
  const { status, plan, email } = await response.json();
  if (terminalPaymentStates.has(status)) return { kind: 'result' };
  if (isPlan(plan)) return { kind: 'resume', plan, email: typeof email === 'string' && email ? email : null };
  return { kind: 'choose' };
}

export default function Checkout() {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [selected, setSelected] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const initialization = useRef<Promise<CheckoutSession> | null>(null);
  const submitting = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let disposed = false;
    // Strict Mode can replay effects. Exchange the one-time ticket only once.
    initialization.current ??= loadCheckout();
    initialization.current.then(next => {
      if (disposed) return;
      if (next.kind === 'result') location.replace('/payment/return');
      else setSession(next);
    }).catch(error => {
      if (!disposed) setSessionError(error instanceof Error ? error.message : '暂时无法打开购买页，请重试。');
    });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
      emailInput.current?.focus();
    }
  }, [selected]);

  const resume = session?.kind === 'resume' ? session : null;

  function selectPlan(plan: Plan) {
    setPaymentError('');
    setSelected(plan);
  }

  async function buy(plan: Plan, contactEmail: string) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setPaymentError('');
    let failure = '暂时无法打开 PayPal，请重试。如果已付款，请勿重复购买。';
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: contactEmail }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'ORDER_ALREADY_PROCESSED') {
          location.replace('/payment/return');
          return;
        }
        if (Object.hasOwn(orderErrors, result.error)) failure = orderErrors[result.error];
      } else {
        location.assign(result.approvalUrl);
        return;
      }
    } catch {
      // Leave the entered email in place so the same order can be retried.
    }
    setPaymentError(failure);
    submitting.current = false;
    setBusy(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected) void buy(selected, email);
  }

  return (
    <div className="checkout-pricing">
      <div className="checkout-intro">
        <h1>{resume ? '继续未完成的购买' : '选择 Tab Copier Pro 套餐'}</h1>
        <p>{resume ? '你的订单已保留，可以继续原订单。' : '解锁不限次数复制、按标签组复制、链接去重和 Markdown 列表样式。'}</p>
      </div>

      {resume ? (
        <section className="panel checkout-resume" aria-labelledby="checkout-resume-plan">
          <h2 id="checkout-resume-plan">{plans[resume.plan].name}</h2>
          <p className="checkout-price">${price(resume.plan)} <small>USD</small></p>
          {resume.email && <p className="checkout-saved-email">购买联系邮箱：{resume.email}</p>}
          <button type="button" disabled={busy} onClick={() => {
            if (resume.email) void buy(resume.plan, resume.email);
            else selectPlan(resume.plan);
          }}>{busy ? '正在打开 PayPal…' : '继续付款'}</button>
          {!selected && paymentError && <p className="checkout-error" role="alert">{paymentError}</p>}
        </section>
      ) : (
        <>
          {!session && <p className={sessionError ? 'checkout-error' : 'checkout-loading'} role="status">
            {sessionError || '正在准备购买…'}
          </p>}
          <div className="checkout-plans">
            {(Object.keys(plans) as Plan[]).map(plan => (
              <article className="checkout-plan" key={plan}>
                <h2>{plans[plan].name}</h2>
                <p className="checkout-price">${price(plan)} <small>USD</small></p>
                <p className="checkout-plan-detail">{descriptions[plan]}</p>
                <button type="button" disabled={!session || busy} onClick={() => selectPlan(plan)} aria-label={`选择套餐：${plans[plan].name}`}>
                  选择套餐
                </button>
              </article>
            ))}
          </div>
          <p className="checkout-note">各套餐均为一次性付款，不自动续费。</p>
        </>
      )}

      <dialog ref={dialog} className="checkout-dialog" aria-labelledby="checkout-dialog-title"
        onCancel={event => { if (submitting.current) event.preventDefault(); }}
        onClose={() => { setSelected(null); setPaymentError(''); }}>
        {selected && (
          <form onSubmit={submit}>
            <h2 id="checkout-dialog-title">确认购买</h2>
            <div className="checkout-order-summary">
              <span>{plans[selected].name}</span>
              <strong>US${price(selected)}</strong>
            </div>
            <label htmlFor="purchase-email">购买联系邮箱</label>
            <input ref={emailInput} id="purchase-email" type="email" autoComplete="email" required maxLength={254}
              value={email} readOnly={busy} onChange={event => setEmail(event.target.value)}
              aria-describedby="purchase-email-help" placeholder="you@example.com" />
            <p id="purchase-email-help">用于订单联系和恢复购买。 <a href="/privacy" target="_blank" rel="noopener noreferrer">数据使用说明</a></p>
            {paymentError && <p className="checkout-error" role="alert">{paymentError}</p>}
            <div className="checkout-dialog-actions">
              <button type="button" className="checkout-secondary" disabled={busy} onClick={() => dialog.current?.close()}>取消</button>
              <button type="submit" disabled={busy}>{busy ? '正在打开 PayPal…' : '前往 PayPal 付款'}</button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
