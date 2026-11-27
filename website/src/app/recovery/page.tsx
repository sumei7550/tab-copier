'use client';
import { useEffect, useRef, useState } from 'react';
export default function Recovery() {
  const ticket = useRef('');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('请确认恢复到发起申请的插件安装。原套餐到期时间不变。');
  useEffect(() => {
    const value = new URLSearchParams(location.hash.slice(1)).get('ticket');
    if (value) { ticket.current = value; history.replaceState(null, '', location.pathname); setReady(true); }
    // Do not POST on mount: email-link scanners must not consume recovery links.
  }, []);
  async function confirm() {
    setBusy(true);
    try {
      const r = await fetch('/api/recovery/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: ticket.current }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      ticket.current = ''; setReady(false); setMessage('恢复已确认。请回到发起申请的插件，点击“完成恢复”取得授权。');
    } catch { setMessage('无法确认链接，可能已过期或已使用。可重试；仍失败请联系支持。'); }
    finally { setBusy(false); }
  }
  return <section className="panel"><h1>恢复 Pro 权益</h1><p role="status">{message}</p><button disabled={!ready || busy} onClick={confirm}>确认恢复</button><p><a href="mailto:sumei7550@outlook.com?subject=Tab%20Copier%20恢复购买">联系客服</a></p><small>本页为沙盒版本。没有有效链接时，请回复支持邮件获取新链接；不要再次付款。</small></section>;
}
