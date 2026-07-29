document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);
  const t = (key) => TabCopierI18n.t(key);
  const defaults = { format: 'markdown', allWindows: false, excludePinned: false, removeDuplicates: true, removeTracking: true };
  const settings = { ...defaults, ...(await chrome.storage.local.get(defaults)) };
  const labels = { markdown: 'formatMarkdown', urls: 'formatUrls', titleUrl: 'formatTitleUrl', html: 'formatHtml' };
  $('pageTitle').textContent = t('settingsTitle'); $('pageIntro').textContent = t('settingsIntro'); $('copyDefaultsHeading').textContent = t('copyDefaults'); $('defaultFormatLabel').textContent = t('defaultFormat'); $('defaultAllWindowsLabel').textContent = t('allWindows'); $('excludePinnedLabel').textContent = t('excludePinned'); $('removeDuplicatesLabel').textContent = t('removeDuplicates'); $('removeTrackingLabel').textContent = t('removeTracking'); $('shortcutHeading').textContent = t('keyboardShortcut'); $('shortcutText').textContent = t('shortcutDescription'); $('shortcutLink').textContent = t('manageShortcuts');
  Object.entries(labels).forEach(([value, key]) => { $('defaultFormat').querySelector(`[value="${value}"]`).textContent = t(key); });
  $('defaultFormat').value = settings.format;
  ['defaultAllWindows', 'excludePinned', 'removeDuplicates', 'removeTracking'].forEach((id) => { $(id).checked = settings[id === 'defaultAllWindows' ? 'allWindows' : id]; });
  const save = async () => { const next = { format: $('defaultFormat').value, allWindows: $('defaultAllWindows').checked, excludePinned: $('excludePinned').checked, removeDuplicates: $('removeDuplicates').checked, removeTracking: $('removeTracking').checked }; await chrome.storage.local.set(next); $('savedMessage').textContent = t('saved'); setTimeout(() => { $('savedMessage').textContent = ''; }, 1800); };
  document.querySelectorAll('input, select').forEach((element) => element.addEventListener('change', save));
});
