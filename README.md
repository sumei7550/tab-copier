# Tab Copier

A minimal Chrome extension that copies all open tab titles and URLs with one click, formatted as Markdown links.

## Features

- 📋 One-click copy of all tabs in the current window
- ✅ Select which tabs to include (with a Select All / Deselect All toggle for batch copying)
- 📝 Output format: `[Title](URL)`, ready to paste into Notion, Obsidian, or any Markdown editor
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

Tab Copier does not collect, store, or transmit any user data. All processing happens locally in the browser using the `chrome.tabs` API to read open tab titles/URLs, and the Clipboard API to copy the generated text.

## License

MIT — see [LICENSE](./LICENSE).
