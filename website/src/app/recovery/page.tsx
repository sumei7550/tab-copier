'use client';
import { useEffect, useRef, useState } from 'react';
export default function Recovery() {
  const ticket = useRef('');
  const heading=useRef<HTMLHeadingElement>(null);
  const [confirmed,setConfirmed]=useState(false),[copyMessage,setCopyMessage]=useState('');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('请确认恢复到发起申请的插件安装。原套餐到期时间不变。');
  useEffect(() => {
    const value = new URLSearchParams(location.hash.slice(1)).get('ticket');
    if (value) { ticket.current = value; history.replaceState(null, '', location.pathname); setReady(true); }
    else if(!ticket.current)setMessage('此页面没有有效恢复链接。请使用支持邮件中的完整链接打开，无需再次付款。');
    // Do not POST on mount: email-link scanners must not consume recovery links.
  }, []);
  async function confirm() {
    setBusy(true);
    try {
      const r = await fetch('/api/recovery/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: ticket.current }) });
      const data = await r.json();
      if (!r.ok||data.confirmed!==true) throw new Error(data.error);
      ticket.current = ''; setReady(false);setConfirmed(true);setMessage('恢复申请已确认。请回到插件领取 Pro 权益，无需再次付款。');
    } catch { setMessage('无法确认链接，可能已过期或已使用。可重试；仍失败请联系支持。'); }
    finally { setBusy(false); }
  }
  useEffect(()=>{if(confirmed)heading.current?.focus();},[confirmed]);
  async function copySteps(){
    try{await navigator.clipboard.writeText('恢复申请已确认。请回到发起申请的同一浏览器，点击右上角拼图图标 → Tab Copier → 恢复购买。看到 Pro 已激活即完成。请勿重新付款或卸载插件。');setCopyMessage('操作步骤已复制。');}
    catch{setCopyMessage('无法复制，请按下方步骤返回插件。');}
  }
  return <section className={'panel recovery-confirmation'+(confirmed?' recovery-confirmed':'')}>
    {confirmed&&<span className="recovery-success-mark" aria-hidden="true">✓</span>}
    <h1 tabIndex={-1} ref={heading}>{confirmed?'恢复确认成功':'恢复 Pro 权益'}</h1><p role="status" aria-live="polite">{message}</p>
    {confirmed?<><div className="recovery-next"><h2>最后一步：回到插件完成恢复</h2><ol><li>回到发起申请的<strong>同一浏览器和插件安装</strong>。</li><li>点击浏览器右上角的拼图图标，打开 <strong>Tab Copier</strong>。</li><li>点击插件里的<strong>「恢复购买」</strong>，领取授权。旧版入口位于「联系客服」中。</li></ol><p>看到「Pro 已激活」即恢复完成。原套餐到期时间不变。</p></div><button onClick={copySteps}>复制返回插件步骤</button><p role="status">{copyMessage}</p></>:<button disabled={!ready || busy} onClick={confirm}>{busy?'正在确认恢复…':'确认恢复'}</button>}
    <p><a href="mailto:sumei7550@outlook.com?subject=Tab%20Copier%20恢复购买">联系客服</a></p><small>{confirmed?'现在可以保留或关闭此页面；请勿再次卸载插件。':'本页为沙盒版本。链接无效时请回复支持邮件获取新链接；不要再次付款。'}</small>
  </section>;
}
