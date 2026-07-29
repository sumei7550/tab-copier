# Tab Copier

A minimal Chrome extension that copies all open tab titles and URLs with one click, formatted as Markdown links.

## Features

- 📋 One-click copy of all tabs in the current window
- ✅ Select which tabs to include (with a Select All / Deselect All toggle for batch copying)
- 📝 Export Markdown, URLs, title + URL, or HTML links — ready for Notion, Obsidian, documents, and chat
- 🔎 Filter tabs, copy from all windows, and optionally exclude pinned tabs, duplicate URLs, and tracking parameters
- ⌨️ Keyboard shortcut support: `Alt+Shift+C` by default (customizable in Chrome shortcuts)
- 🌍 Localized UI and store metadata: English, Chinese (Simplified/Traditional), Japanese, Korean, Spanish, German, French, Russian, Thai, Malay, Indonesian, and Brazilian Portuguese
- 🔒 No data collection — everything runs locally in your browser
- 🪶 Only one permission requested: `tabs`

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

Tab Copier does not collect or transmit any user data. All tab processing happens locally in the browser using the `chrome.tabs` API to read open tab titles/URLs, and the Clipboard API to copy the generated text. Only copy preferences are stored locally with `chrome.storage.local`; tab titles, URLs, and copied content are never stored.

## License

MIT — see [LICENSE](./LICENSE).
