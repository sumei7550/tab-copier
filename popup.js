document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);
  const tabList = $('tabList'); const countLabel = $('countLabel'); const copyBtn = $('copyBtn');
  const downloadBtn = $('downloadBtn'); const toast = $('toast'); const selectAllBtn = $('selectAllBtn');
  const formatSelect = $('formatSelect'); const sortSelect = $('sortSelect'); const allWindowsToggle = $('allWindowsToggle');
  const filterInput = $('filterInput'); const previewText = $('previewText');
  const FALLBACK_FAVICON = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="#cccccc"/></svg>');
  const defaults = { format: 'markdown', allWindows: false, excludePinned: false, removeDuplicates: true, removeTracking: true, sort: 'tabOrder' };
  let settings = { ...defaults }; let tabsData = []; let selectedIds = new Set(); let toastTimer;
  const t = (key, substitutions) => TabCopierI18n.t(key, substitutions);
  const entitlement = await TabCopierFeatureFlags.load();
  const can = (capability) => entitlement.capabilities[capability] === true;

  function localizeStaticText() {
    document.title = t('extensionName');
    $('title').textContent = t('extensionName'); $('buyCoffee').textContent = t('buyCoffee');
    $('formatLabel').textContent = t('format'); $('sortLabel').textContent = t('sortTabs'); $('previewHeading').textContent = t('preview');
    $('refreshPreviewBtn').textContent = t('refreshPreview'); $('allWindowsLabel').textContent = t('allWindows');
    filterInput.placeholder = t('filterTabs'); $('copyBtnText').textContent = t('copySelected'); downloadBtn.textContent = t('download'); $('settingsLink').textContent = t('settings');
    [['markdown','formatMarkdown'],['text','formatText'],['urls','formatUrls']].forEach(([v,k]) => { formatSelect.querySelector(`[value="${v}"]`).textContent = t(k); });
    [['tabOrder','sortTabOrder'],['domain','sortDomain'],['domainGroup','sortDomainGroup']].forEach(([v,k]) => { sortSelect.querySelector(`[value="${v}"]`).textContent = t(k); });
    allWindowsToggle.disabled = !can('allWindows');
    downloadBtn.disabled = !can('fileExport');
    allWindowsToggle.title = downloadBtn.title = !can('allWindows') || !can('fileExport') ? t('proFeature') : '';
    ['domain', 'domainGroup'].forEach((value) => { sortSelect.querySelector(`[value="${value}"]`).disabled = !can('domainGrouping'); });
  }
  function isSystemUrl(url) { return /^(chrome|edge|about|devtools|chrome-extension|view-source):/i.test(url); }
  function cleanUrl(raw) { if (!settings.removeTracking) return raw; try { const url = new URL(raw); [...url.searchParams.keys()].filter((key) => /^(utm_|fbclid$|gclid$|mc_[ce]id$)/i.test(key)).forEach((key) => url.searchParams.delete(key)); return url.toString(); } catch { return raw; } }
  function domainOf(url) { try { return new URL(url).hostname.toLowerCase() || t('localPage'); } catch { return t('localPage'); } }
  async function loadTabs() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: !(can('allWindows') && allWindowsToggle.checked) }); const seen = new Set();
      tabsData = tabs.filter((tab) => !(settings.excludePinned && tab.pinned)).map((tab) => {
        const url = cleanUrl(tab.url || ''); const inaccessible = isSystemUrl(url);
        return { id: tab.id, title: tab.title || t('untitled'), url, favicon: tab.favIconUrl || FALLBACK_FAVICON, inaccessible, domain: domainOf(url), windowId: tab.windowId };
      }).filter((tab) => { if (tab.inaccessible || !can('deduplicate') || !settings.removeDuplicates) return true; if (seen.has(tab.url)) return false; seen.add(tab.url); return true; });
      selectedIds = new Set(tabsData.filter((tab) => !tab.inaccessible).map((tab) => tab.id)); renderTabs();
    } catch { showToast(t('loadFailed'), true); }
  }
  function orderedTabs() { const tabs = [...tabsData]; if (sortSelect.value === 'domain' || sortSelect.value === 'domainGroup') tabs.sort((a,b) => a.domain.localeCompare(b.domain) || a.title.localeCompare(b.title)); return tabs; }
  function renderTabs() {
    const query = filterInput.value.trim().toLowerCase(); const visibleTabs = orderedTabs().filter((tab) => `${tab.title} ${tab.url}`.toLowerCase().includes(query));
    const fragment = document.createDocumentFragment(); tabList.replaceChildren();
    if (!visibleTabs.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = query ? t('noMatchingTabs') : t('noTabs'); fragment.appendChild(empty); }
    visibleTabs.forEach((tab) => { const item = document.createElement('div'); item.className = 'tab-item' + (tab.inaccessible ? ' inaccessible' : '');
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.tabId = String(tab.id); checkbox.checked = selectedIds.has(tab.id); checkbox.disabled = tab.inaccessible; checkbox.addEventListener('change', () => { checkbox.checked ? selectedIds.add(tab.id) : selectedIds.delete(tab.id); updateCount(); updatePreview(); });
      const favicon = document.createElement('img'); favicon.className = 'favicon'; favicon.src = tab.favicon; favicon.alt = ''; favicon.addEventListener('error', () => { favicon.src = FALLBACK_FAVICON; });
      const titleSpan = document.createElement('span'); titleSpan.className = 'tab-title'; titleSpan.title = tab.title; titleSpan.textContent = tab.title;
      const action = document.createElement('button'); action.type = 'button'; action.className = 'row-copy'; action.textContent = t('copyOne'); action.disabled = tab.inaccessible; action.addEventListener('click', () => copyTabs([tab]));
      item.append(checkbox, favicon, titleSpan, action); if (tab.inaccessible) { const note = document.createElement('span'); note.className = 'access-note'; note.textContent = t('inaccessible'); item.append(note); } fragment.appendChild(item);
    }); tabList.appendChild(fragment); updateCount(); updatePreview();
  }
  function selectedTabs() { return tabsData.filter((tab) => selectedIds.has(tab.id) && !tab.inaccessible); }
  function updateCount() { const boxes = [...tabList.querySelectorAll('input[type="checkbox"]:not(:disabled)')]; const checked = boxes.filter((box) => box.checked); countLabel.textContent = t('selectedCount', String(selectedIds.size)); selectAllBtn.classList.toggle('hidden', boxes.length === 0); selectAllBtn.textContent = checked.length === boxes.length ? t('deselectAll') : t('selectAll'); }
  function showToast(message, isError = false) { toast.textContent = message; toast.style.color = isError ? '#d93025' : '#188038'; toast.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600); }
  function escapeMarkdownText(value) { return String(value).replace(/[\\[\]]/g, '\\$&').replace(/[\r\n]+/g, ' '); }
  function escapeMarkdownUrl(value) { return String(value).replace(/[\\<>]/g, '\\$&').replace(/[\r\n]+/g, ''); }
  function outputFor(tabs) { const format = formatSelect.value; return tabs.map((tab) => { if (format === 'urls') return tab.url; if (format === 'text') return `${tab.title} — ${tab.url}`; return `[${escapeMarkdownText(tab.title)}](<${escapeMarkdownUrl(tab.url)}>)`; }).join('\n'); }
  function updatePreview() { const selected = selectedTabs(); previewText.textContent = selected.length ? outputFor(selected) : t('previewEmpty'); }
  async function writeClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* try the extension-page fallback */ }
    }
    const textarea = document.createElement('textarea');
    textarea.value = text; textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed'; textarea.style.top = '-1000px'; textarea.style.left = '-1000px';
    document.body.appendChild(textarea); textarea.focus(); textarea.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    textarea.remove();
    return copied;
  }
  async function copyTabs(tabs) { if (!tabs.length) return showToast(t('selectAtLeastOne'), true); const copied = await writeClipboard(outputFor(tabs)); if (copied) showToast(t('copiedCount', String(tabs.length))); else showToast(t('copyFailed'), true); }
  function download() { if (!can('fileExport')) return showToast(t('proFeature'), true); const selected = selectedTabs(); if (!selected.length) return showToast(t('selectAtLeastOne'), true); const extension = formatSelect.value === 'markdown' ? 'md' : 'txt'; const blob = new Blob([outputFor(selected)], { type: extension === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `tabs-${new Date().toISOString().slice(0,10)}.${extension}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast(t('downloadedCount', String(selected.length))); }
  localizeStaticText(); settings = { ...defaults, ...(await chrome.storage.local.get(defaults)) }; if (!can('allWindows')) settings.allWindows = false; if (!can('deduplicate')) settings.removeDuplicates = false; if (!can('domainGrouping')) settings.sort = 'tabOrder'; if (settings.format === 'titleUrl' || settings.format === 'html') settings.format = 'text'; formatSelect.value = settings.format; sortSelect.value = settings.sort; allWindowsToggle.checked = settings.allWindows; await loadTabs();
  selectAllBtn.addEventListener('click', () => { const boxes = [...tabList.querySelectorAll('input[type="checkbox"]:not(:disabled)')]; const select = boxes.some((box) => !box.checked); boxes.forEach((box) => { box.checked = select; select ? selectedIds.add(Number(box.dataset.tabId)) : selectedIds.delete(Number(box.dataset.tabId)); }); updateCount(); updatePreview(); });
  filterInput.addEventListener('input', renderTabs); allWindowsToggle.addEventListener('change', async () => { if (!can('allWindows')) return; settings.allWindows = allWindowsToggle.checked; await chrome.storage.local.set({ allWindows: settings.allWindows }); await loadTabs(); });
  formatSelect.addEventListener('change', () => { chrome.storage.local.set({ format: formatSelect.value }); updatePreview(); }); sortSelect.addEventListener('change', () => { settings.sort = sortSelect.value; chrome.storage.local.set({ sort: settings.sort }); renderTabs(); });
  $('refreshPreviewBtn').addEventListener('click', updatePreview); copyBtn.addEventListener('click', () => copyTabs(selectedTabs())); downloadBtn.addEventListener('click', download);
});
