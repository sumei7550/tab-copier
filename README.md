# Tab Copier

A minimal Chrome extension that copies all open tab titles and URLs with one click, formatted as Markdown links.

## Features

- 📋 One-click copy of all tabs in the current window
- ✅ Select which tabs to include (with a Select All / Deselect All toggle for batch copying)
- 👀 Preview the text before copying
- 📝 Export Markdown, URLs, title + URL, or HTML links — ready for Notion, Obsidian, documents, and chat
- 🔎 Filter tabs, copy from all windows, and optionally exclude pinned tabs, duplicate URLs, and tracking parameters
- ⌨️ Keyboard shortcut support: `Alt+Shift+C` by default (customizable in Chrome shortcuts)
- 🌍 Localized UI and store metadata: English, Chinese (Simplified/Traditional), Japanese, Korean, Spanish, German, French, Russian, Thai, Malay, Indonesian, and Brazilian Portuguese
- 🔒 Tab titles, URLs, and copied text stay on your device. Anonymous usage events are sent to Mixpanel
- 🪶 Uses `tabs` and `storage`, plus access to `api.mixpanel.com` for usage events

## Install (developer mode)

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select this folder
5. Pin the extension and click its icon to open the popup

## Project structure

```
tab-copier/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Privacy

Tab titles, URLs, and copied text are processed locally and are not transmitted. The extension reads open tab titles and URLs with the `chrome.tabs` API and writes the generated text with the Clipboard API. Copy preferences and a random analytics identifier are stored with `chrome.storage.local`. Pseudonymous usage events, including operating system, are sent to Mixpanel with the request IP used for country and location inference. Tab contents and filter text are not sent. See [privacy.html](./privacy.html).

## License

MIT — see [LICENSE](./LICENSE).
