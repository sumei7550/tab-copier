// Local entitlement boundary. A future licensing flow can replace getPlan()
// without changing the tab-copying pipeline.
const TabCopierFeatureFlags = (() => {
  const FREE = Object.freeze({ currentWindow: true, allWindows: false, deduplicate: false, domainGrouping: false, fileExport: false, customTemplates: false, tabCollections: false, chromeTabGroups: false });
  const PRO = Object.freeze({ ...FREE, allWindows: true, deduplicate: true, domainGrouping: true, fileExport: true, customTemplates: true, tabCollections: true, chromeTabGroups: true });
  async function load() {
    const stored = await chrome.storage.local.get({ plan: 'free' });
    const plan = stored.plan === 'pro' ? 'pro' : 'free';
    return { plan, capabilities: plan === 'pro' ? PRO : FREE };
  }
  return { load };
})();
