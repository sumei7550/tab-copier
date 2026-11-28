'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pollPayment } from '@/lib/payment-poll';
import './receipt.css';

const copy = {
  checking: { title: '正在确认付款', detail: '正在向 PayPal 确认付款结果。请保持此页面打开。', tone: 'waiting' },
  pending: { title: '付款结果尚未确认', detail: '请稍后再检查付款结果。如果已在 PayPal 付款，请勿重复购买。', tone: 'attention' },
  paid: { title: '付款成功', detail: 'Tab Copier Pro 的付款已确认。', tone: 'success' },
  review: { title: '订单需要核查', detail: '请联系客服确认订单并协助激活 Pro。请勿重复付款。', tone: 'attention' },
  refunded: { title: '订单已退款', detail: '可在 PayPal 查看退款详情。如有疑问，请联系客服。', tone: 'attention' },
  reversed: { title: '付款已撤销', detail: '可在 PayPal 查看交易详情。如有疑问，请联系客服。', tone: 'attention' },
  unavailable: { title: '无法查看付款结果', detail: '此页面暂时无法关联到你的订单。如果已付款，请打开 Tab Copier 检查购买结果，或联系客服。', tone: 'attention' },
} as const;

type ReceiptState = keyof typeof copy;

export default function PaymentReturn() {
  const [status, setStatus] = useState<ReceiptState>('checking');
  const current = useRef<AbortController | null>(null);

  const check = useCallback(async () => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setStatus('checking');

    try {
      const result = await pollPayment({
        signal: controller.signal,
        onRetry: () => {},
        request: async () => {
          const response = await fetch('/api/checkout/capture', {
            method: 'POST',
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'SERVICE_UNAVAILABLE');
          return data;
        },
      });
      if (controller.signal.aborted) return;
      switch (result.status) {
        case 'paid':
        case 'review':
        case 'refunded':
        case 'reversed':
          setStatus(result.status);
          break;
        default:
          setStatus('pending');
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const permanent = error instanceof Error &&
        ['UNAUTHORIZED', 'ORDER_NOT_FOUND', 'NOT_SANDBOX'].includes(error.message);
      setStatus(permanent ? 'unavailable' : 'pending');
    }
  }, []);

  useEffect(() => {
    void check();
    return () => current.current?.abort();
  }, [check]);

  const receipt = copy[status];
  return (
    <section className="panel payment-receipt" aria-labelledby="payment-result-title">
      <div role="status" aria-atomic="true">
        <span className="payment-receipt-mark" data-tone={receipt.tone} aria-hidden="true">
          {status === 'paid' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 4 4L19 6" />
            </svg>
          ) : status === 'checking' ? (
            <span className="payment-receipt-spinner" />
          ) : '!'}
        </span>
        <h1 id="payment-result-title">{receipt.title}</h1>
        <p className="payment-receipt-summary">{receipt.detail}</p>
      </div>

      {status === 'paid' && (
        <div className="payment-receipt-next">
          <h2>打开 Tab Copier，开始使用 Pro</h2>
          <p>从 Chrome 工具栏或「扩展程序」菜单打开 Tab Copier，扩展会自动同步。若 Pro 尚未显示，点击扩展里的「检查购买结果」。</p>
        </div>
      )}
      {status === 'pending' && <button className="payment-receipt-retry" onClick={check}>再次检查付款结果</button>}
      {status !== 'checking' && (
        <div className="payment-receipt-support">
          <span>需要帮助？</span>
          <a href="mailto:sumei7550@outlook.com?subject=Tab%20Copier%20付款支持">联系客服</a>
        </div>
      )}
    </section>
  );
}
