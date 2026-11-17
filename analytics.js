const TabCopierAnalytics = (() => {
  const TOKEN = '4b0846f8be7d1726f00ae544466ee916';
  const ENDPOINT = 'https://api.mixpanel.com/track?ip=1&verbose=1';
  const ID_KEY = 'analyticsDistinctId';

  function operatingSystem() {
    const platform = navigator.userAgentData?.platform || navigator.platform || '';
    if (/windows/i.test(platform)) return 'Windows';
    if (/mac/i.test(platform)) return 'Mac OS X';
    if (/cros|chrome os/i.test(platform)) return 'Chrome OS';
    if (/android/i.test(platform)) return 'Android';
    if (/iphone|ipad|ipod|ios/i.test(platform)) return 'iOS';
    if (/linux/i.test(platform)) return 'Linux';
    return 'Unknown';
  }

  let idPromise;
  function distinctId() {
    if (!idPromise) {
      idPromise = (async () => {
        const stored = await chrome.storage.local.get(ID_KEY);
        if (typeof stored[ID_KEY] === 'string' && stored[ID_KEY]) return stored[ID_KEY];
        const id = crypto.randomUUID();
        await chrome.storage.local.set({ [ID_KEY]: id });
        return id;
      })().catch((error) => {
        idPromise = null;
        throw error;
      });
    }
    return idPromise;
  }

  async function track(event, properties = {}) {
    try {
      const payload = [{
        event: `ext_${event.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').toLowerCase()}`,
        properties: {
          ...properties,
          token: TOKEN,
          distinct_id: await distinctId(),
          time: Math.floor(Date.now() / 1000),
          $insert_id: crypto.randomUUID(),
          extension_version: chrome.runtime.getManifest().version,
          ui_language: chrome.i18n.getUILanguage(),
          $os: operatingSystem(),
        },
      }];
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      return response.ok && (await response.json()).status === 1;
    } catch {
      // Analytics must never block copying or settings.
      return false;
    }
  }

  return { track };
})();
