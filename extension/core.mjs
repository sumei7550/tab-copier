export const defaults = Object.freeze({ format: 'markdown', scope: 'window', markdownStyle: 'plain', removeDuplicates: false, removeTracking: true, excludePinned: false, includeGroupName: true });
export function rights(pro, legacy = false) {
  return { unlimited: pro || legacy, groups: pro, lists: pro || legacy, dedup: pro || legacy };
}
export function effectiveSettings(settings, access) {
  return { ...defaults, ...settings, scope: settings.scope === 'group' && !access.groups ? 'window' : (settings.scope || 'window'),
    markdownStyle: access.lists ? (settings.markdownStyle || 'plain') : 'plain', removeDuplicates: access.dedup && !!settings.removeDuplicates };
}
export function cleanUrl(raw, tracking) {
  if (!tracking) return raw;
  try { const u = new URL(raw); [...u.searchParams.keys()].filter(k => /^(utm_|fbclid$|gclid$|mc_[ce]id$)/i.test(k)).forEach(k => u.searchParams.delete(k)); return u.toString(); } catch { return raw; }
}
export function usableUrl(raw) { return typeof raw === 'string' && /^(https?|file|ftp):/i.test(raw); }
const md = text => String(text).replace(/[\r\n]+/g, ' ').replace(/([\\\[\]])/g, '\\$1');
const html = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function outputModel(tabs, settings, access, groupName = '') {
  const s = effectiveSettings(settings, access), seen = new Set();
  const selected = tabs.filter(t => usableUrl(t.url)).map(t => ({ ...t, url: cleanUrl(t.url, s.removeTracking) }));
  const items = selected.filter(t => { if (!s.removeDuplicates) return true; if (seen.has(t.url)) return false; seen.add(t.url); return true; });
  const group = s.scope === 'group' && access.groups && s.includeGroupName ? groupName : '';
  let text = items.map((t, i) => {
    if (s.format === 'urls') return t.url;
    if (s.format === 'titleUrl') return `${t.title}\n${t.url}`;
    if (s.format === 'html') return `<a href="${html(t.url)}">${html(t.title)}</a>`;
    const link = `[${md(t.title)}](${t.url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/[\r\n]/g, '')})`;
    return ({ bullet: '- ', ordered: `${i + 1}. `, task: '- [ ] ', plain: '' }[s.markdownStyle] || '') + link;
  }).join('\n');
  if (group && items.length) text = (s.format === 'markdown' ? `## ${md(group)}` : s.format === 'html' ? `<h2>${html(group)}</h2>` : group) + '\n' + text;
  return { text, items, removed: selected.length - items.length, group, settings: s };
}
export function localDay(now = Date.now()) { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function quotaState(old, day, now) {
  const q = !old || day > old.day ? { day, used: 0, leases: [], committed: [] } : { ...old, leases: [...(old.leases || [])], committed: [...(old.committed || [])] };
  q.leases = q.leases.filter(l => l.until > now);
  return q;
}
export function reserveCopy(old, day, now, operation) {
  const q = quotaState(old, day, now);
  if (q.used + q.leases.length >= 3) throw new Error('QUOTA_EXHAUSTED');
  q.leases.push({ id: operation, until: now + 30_000 }); return q;
}
export function commitCopy(old, operation) {
  if (!old || old.committed?.includes(operation)) return old;
  if (!old.leases.some(l => l.id === operation)) throw new Error('COPY_LEASE_LOST');
  return { ...old, used: old.used + 1, leases: old.leases.filter(l => l.id !== operation), committed: [...(old.committed || []), operation].slice(-32) };
}
