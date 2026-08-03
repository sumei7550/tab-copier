const TabCopierI18n = (() => {
  const fallbacks = { proFeature: 'Pro feature reserved for a future plan.' };
  function t(key, substitutions) {
    const message = chrome.i18n.getMessage(key, substitutions);
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
