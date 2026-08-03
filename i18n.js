const TabCopierI18n = (() => {
  const fallbacks = { proFeature: 'Pro feature reserved for a future plan.' };
  function t(key, substitutions) {
    let message = '';
    try {
      message = chrome.i18n.getMessage(key, substitutions);
    } catch {
      // Keep the popup usable if the browser i18n API is unavailable during startup.
    }
    return message || fallbacks[key] || key;
  }

  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
  }

  return { t, apply };
})();
