document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList');
  const countLabel = document.getElementById('countLabel');
  const copyBtn = document.getElementById('copyBtn');
  const toast = document.getElementById('toast');
  const selectAllBtn = document.getElementById('selectAllBtn');

  const FALLBACK_FAVICON =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
      '<rect width="16" height="16" rx="3" fill="%23cccccc"/></svg>'
    );

  let tabsData = [];
  let toastTimer = null;

  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabsData = tabs.map((tab) => ({
      id: tab.id,
      title: tab.title || 'Untitled',
      url: tab.url || '',
      favicon: tab.favIconUrl || FALLBACK_FAVICON
    }));
    renderTabs();
    updateCount();
  });

  function renderTabs() {
    tabList.innerHTML = '';

    if (tabsData.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No open tabs found.';
      tabList.appendChild(empty);
      return;
    }

    tabsData.forEach((tab, index) => {
      const item = document.createElement('div');
      item.className = 'tab-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.dataset.index = String(index);
      checkbox.addEventListener('change', updateCount);

      const favicon = document.createElement('img');
      favicon.className = 'favicon';
      favicon.src = tab.favicon;
      favicon.alt = '';
      favicon.addEventListener('error', () => {
        favicon.src = FALLBACK_FAVICON;
      });

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tab-title';
      titleSpan.title = tab.title;
      titleSpan.textContent = tab.title;

      item.appendChild(checkbox);
      item.appendChild(favicon);
      item.appendChild(titleSpan);
      tabList.appendChild(item);
    });
  }

  function updateCount() {
    const checkboxes = document.querySelectorAll('#tabList input[type="checkbox"]');
    const checked = Array.from(checkboxes).filter((cb) => cb.checked);
    countLabel.textContent = `Selected ${checked.length}`;
    updateSelectAllBtn(checkboxes.length, checked.length);
  }

  function updateSelectAllBtn(total, checkedCount) {
    if (total === 0) {
      selectAllBtn.classList.add('hidden');
      return;
    }
    selectAllBtn.classList.remove('hidden');
    // If everything is currently checked, offer "Deselect All".
    // Otherwise (none or some checked), offer "Select All".
    selectAllBtn.textContent = checkedCount === total ? 'Deselect All' : 'Select All';
  }

  function showToast(message, isError) {
    toast.textContent = message;
    toast.style.color = isError ? '#d93025' : '#1e8e3e';
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2000);
  }

  selectAllBtn.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('#tabList input[type="checkbox"]');
    const checked = Array.from(checkboxes).filter((cb) => cb.checked);
    const shouldSelectAll = checked.length !== checkboxes.length;
    checkboxes.forEach((cb) => {
      cb.checked = shouldSelectAll;
    });
    updateCount();
  });

  copyBtn.addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('#tabList input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach((cb, index) => {
      if (cb.checked) {
        const tab = tabsData[index];
        if (tab) selected.push(tab);
      }
    });

    if (selected.length === 0) {
      showToast('⚠️ Please select at least one tab', true);
      return;
    }

    const markdown = selected.map((tab) => `[${tab.title}](${tab.url})`).join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      showToast(`✅ Copied ${selected.length} tabs`, false);
    } catch (err) {
      showToast('❌ Copy failed, please try again', true);
    }
  });
});
