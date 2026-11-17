document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);
  const tabList = $('tabList');
  const countLabel = $('countLabel');
  const copyBtn = $('copyBtn');
  const toast = $('toast');
  const selectAllBtn = $('selectAllBtn');
  const formatSelect = $('formatSelect');
  const markdownStyleSelect = $('markdownStyleSelect');
  const markdownStyleRow = $('markdownStyleRow');
  const allWindowsToggle = $('allWindowsToggle');
  const filterInput = $('filterInput');
  const previewText = $('previewText');
  const FALLBACK_FAVICON = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" rx="3" fill="#cccccc"/></svg>');
  const defaults = { format: 'markdown', markdownStyle: 'bullet', allWindows: false, excludePinned: false, removeDuplicates: true, removeTracking: true };
  let settings = { ...defaults };
  let tabsData = [];
  let selectedIds = new Set();
  let toastTimer;
  const t = (key, substitutions) => TabCopierI18n.t(key, substitutions);

  function localizeStaticText() {
    $('formatLabel').textContent = t('format');
    $('allWindowsLabel').textContent = t('allWindows');
    filterInput.placeholder = t('filterTabs');
    $('copyBtnText').textContent = t('copySelected');
    $('settingsLink').textContent = t('settings');
    $('previewHeading').textContent = t('preview');
    $('refreshPreviewBtn').textContent = t('refreshPreview');
    $('markdownStyleLabel').textContent = t('markdownStyle');
    const styleLabels = { bullet: 'markdownStyleBullet', ordered: 'markdownStyleOrdered', task: 'markdownStyleTask' };
    Object.entries(styleLabels).forEach(([value, key]) => { markdownStyleSelect.querySelector(`[value="${value}"]`).textContent = t(key); });
    const labels = { markdown: 'formatMarkdown', urls: 'formatUrls', titleUrl: 'formatTitleUrl', html: 'formatHtml' };
    Object.entries(labels).forEach(([value, key]) => { formatSelect.querySelector(`[value="${value}"]`).textContent = t(key); });
  }

  async function loadTabs() {
    const query = allWindowsToggle.checked ? {} : { currentWindow: true };
    const tabs = await chrome.tabs.query(query);
    tabsData = tabs
      .filter((tab) => !isSystemUrl(tab.url || ''))
      .filter((tab) => !(settings.excludePinned && tab.pinned))
      .map((tab) => ({ id: tab.id, title: tab.title || t('untitled'), url: cleanUrl(tab.url || ''), favicon: tab.favIconUrl || FALLBACK_FAVICON }));
    if (settings.removeDuplicates) {
      const seen = new Set();
      tabsData = tabsData.filter((tab) => !seen.has(tab.url) && seen.add(tab.url));
    }
    selectedIds = new Set(tabsData.map((tab) => tab.id));
    renderTabs();
  }

  function isSystemUrl(url) { return /^(chrome|edge|about|devtools):/i.test(url); }
  function cleanUrl(raw) {
    if (!settings.removeTracking) return raw;
    try {
      const url = new URL(raw);
      [...url.searchParams.keys()].filter((key) => /^(utm_|fbclid$|gclid$|mc_[ce]id$)/i.test(key)).forEach((key) => url.searchParams.delete(key));
      return url.toString();
    } catch { return raw; }
  }

  function renderTabs() {
    const query = filterInput.value.trim().toLowerCase();
    tabList.replaceChildren();
    const visibleTabs = tabsData.filter((tab) => `${tab.title} ${tab.url}`.toLowerCase().includes(query));
    if (!visibleTabs.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = query ? t('noMatchingTabs') : t('noTabs');
      tabList.appendChild(empty);
    }
    visibleTabs.forEach((tab) => {
      const item = document.createElement('label'); item.className = 'tab-item';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedIds.has(tab.id); checkbox.dataset.tabId = String(tab.id); checkbox.addEventListener('change', () => { if (checkbox.checked) selectedIds.add(tab.id); else selectedIds.delete(tab.id); TabCopierAnalytics.track('Tab Selection Changed', { is_selected: checkbox.checked, selected_count: selectedIds.size, eligible_tab_count: tabsData.length, surface: 'popup' }); updateCount(); });
      const favicon = document.createElement('img'); favicon.className = 'favicon'; favicon.src = tab.favicon; favicon.alt = ''; favicon.addEventListener('error', () => { favicon.src = FALLBACK_FAVICON; });
      const titleSpan = document.createElement('span'); titleSpan.className = 'tab-title'; titleSpan.title = tab.title; titleSpan.textContent = tab.title;
      item.append(checkbox, favicon, titleSpan); tabList.appendChild(item);
    });
    updateCount();
  }

  function selectedTabs() {
    return tabsData.filter((tab) => selectedIds.has(tab.id));
  }
  function updateCount() {
    const checkboxes = [...tabList.querySelectorAll('input[type="checkbox"]')];
    const checked = checkboxes.filter((box) => box.checked);
    countLabel.textContent = t('selectedCount', String(selectedIds.size));
    selectAllBtn.classList.toggle('hidden', checkboxes.length === 0);
    selectAllBtn.textContent = checked.length === checkboxes.length ? t('deselectAll') : t('selectAll');
    updatePreview();
  }
  function showToast(message, isError = false) {
    toast.textContent = message; toast.style.color = isError ? '#d93025' : '#188038'; toast.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.add('hidden'), 2200);
  }
  function escapeMarkdown(value) { return value.replace(/([\\\[\]])/g, '\\$1'); }
  function outputFor(tabs) {
    const format = formatSelect.value;
    return tabs.map((tab, index) => {
      if (format === 'urls') return tab.url;
      if (format === 'titleUrl') return `${tab.title}\n${tab.url}`;
      if (format === 'html') return `<a href="${tab.url.replace(/"/g, '&quot;')}">${tab.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>`;
      const link = `[${escapeMarkdown(tab.title)}](${tab.url.replace(/\)/g, '\\)')})`;
      if (markdownStyleSelect.value === 'ordered') return `${index + 1}. ${link}`;
      if (markdownStyleSelect.value === 'task') return `- [ ] ${link}`;
      return `- ${link}`;
    }).join('\n');
  }
  function updateMarkdownStyleVisibility() {
    markdownStyleRow.hidden = formatSelect.value !== 'markdown';
  }
  function updatePreview() {
    const selected = selectedTabs();
    previewText.replaceChildren();
    if (!selected.length) {
      previewText.classList.add('raw');
      previewText.textContent = t('previewEmpty');
      return;
    }
    if (formatSelect.value !== 'markdown') {
      previewText.classList.add('raw');
      previewText.textContent = outputFor(selected);
      return;
    }

    previewText.classList.remove('raw');
    const isTaskList = markdownStyleSelect.value === 'task';
    const list = document.createElement(markdownStyleSelect.value === 'ordered' ? 'ol' : 'ul');
    if (isTaskList) list.className = 'task-list';
    selected.forEach((tab) => {
      const item = document.createElement('li');
      if (isTaskList) {
        item.className = 'task-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.disabled = true;
        checkbox.className = 'task-box';
        item.appendChild(checkbox);
      }
      const linkText = document.createElement('span');
      linkText.className = 'markdown-link';
      linkText.textContent = tab.title;
      linkText.title = tab.url;
      item.appendChild(linkText);
      list.appendChild(item);
    });
    previewText.appendChild(list);
  }

  localizeStaticText();
  settings = { ...defaults, ...(await chrome.storage.local.get(defaults)) };
  formatSelect.value = settings.format;
  markdownStyleSelect.value = settings.markdownStyle;
  updateMarkdownStyleVisibility();
  allWindowsToggle.checked = settings.allWindows;
  await loadTabs();
  TabCopierAnalytics.track('Popup Opened', {
    eligible_tab_count: tabsData.length,
    format: formatSelect.value,
    ...(formatSelect.value === 'markdown' ? { markdown_style: markdownStyleSelect.value } : {}),
    all_windows: allWindowsToggle.checked,
  });
  selectAllBtn.addEventListener('click', () => { const boxes = [...tabList.querySelectorAll('input[type="checkbox"]')]; const select = boxes.some((box) => !box.checked); boxes.forEach((box) => { box.checked = select; if (select) selectedIds.add(Number(box.dataset.tabId)); else selectedIds.delete(Number(box.dataset.tabId)); }); TabCopierAnalytics.track('Tab Selection Bulk Changed', { action: select ? 'select_all' : 'deselect_all', selected_count: selectedIds.size, eligible_tab_count: tabsData.length, visible_tab_count: boxes.length, filter_active: filterInput.value.trim().length > 0, surface: 'popup' }); updateCount(); });
  filterInput.addEventListener('input', renderTabs);
  allWindowsToggle.addEventListener('change', async () => { settings.allWindows = allWindowsToggle.checked; await chrome.storage.local.set({ allWindows: settings.allWindows }); TabCopierAnalytics.track('All Windows Toggled', { all_windows: settings.allWindows, surface: 'popup' }); await loadTabs(); });
  $('coffeeLink').addEventListener('click', () => { TabCopierAnalytics.track('Coffee Link Clicked', { destination: 'ko-fi', surface: 'popup' }); });
  formatSelect.addEventListener('change', () => { chrome.storage.local.set({ format: formatSelect.value }); updateMarkdownStyleVisibility(); updatePreview(); TabCopierAnalytics.track('Format Changed', { format: formatSelect.value, surface: 'popup' }); });
  markdownStyleSelect.addEventListener('change', () => { chrome.storage.local.set({ markdownStyle: markdownStyleSelect.value }); updatePreview(); TabCopierAnalytics.track('Markdown Style Changed', { markdown_style: markdownStyleSelect.value, surface: 'popup' }); });
  $('refreshPreviewBtn').addEventListener('click', () => { updatePreview(); TabCopierAnalytics.track('Preview Refresh Clicked', { selected_count: selectedIds.size, format: formatSelect.value, ...(formatSelect.value === 'markdown' ? { markdown_style: markdownStyleSelect.value } : {}), surface: 'popup' }); });
  copyBtn.addEventListener('click', async () => {
    const selected = selectedTabs();
    if (!selected.length) {
      TabCopierAnalytics.track('Copy Blocked', { reason: 'none_selected', format: formatSelect.value });
      return showToast(t('selectAtLeastOne'), true);
    }
    const properties = { format: formatSelect.value, ...(formatSelect.value === 'markdown' ? { markdown_style: markdownStyleSelect.value } : {}), selected_count: selected.length, eligible_tab_count: tabsData.length, all_windows: allWindowsToggle.checked, filter_active: filterInput.value.trim().length > 0 };
    try { await navigator.clipboard.writeText(outputFor(selected)); showToast(t('copiedCount', String(selected.length))); TabCopierAnalytics.track('Tabs Copied', { ...properties, success: true }); }
    catch { showToast(t('copyFailed'), true); TabCopierAnalytics.track('Tabs Copied', { ...properties, success: false }); }
  });
});
