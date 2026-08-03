# Tab Copier

Tab Copier is a Chrome extension for copying selected browser tabs as Markdown links, title + URL text, or URL-only lists. It is designed for research notes, documentation, and sharing links.

## Features

- Select individual tabs or all tabs in the current window
- Copy tabs from the current window (all-window copying is reserved for Pro)
- Export Markdown links, title + URL text, or URL-only lists to the clipboard
- Filter tabs, exclude pinned tabs, and remove common tracking parameters
- Preview the result before copying
- English, Simplified Chinese, Traditional Chinese, Japanese, Korean, German, French, Spanish, Russian, Indonesian, Malay, Portuguese (Brazil), and Thai UI translations
- Language resources are bundled with the extension; switching language does not require a network connection

## Free and Pro boundary

The free plan keeps the fast local workflow free: current-window copying, three output formats, basic selection, and no account or cloud sync. Pro capabilities are reserved behind local feature flags for a later release: all-window copying, deduplication, domain grouping, file export, custom templates, tab collections, and Chrome tab-group preservation. See [COMMERCIALIZATION.md](./COMMERCIALIZATION.md) for the product boundary and pricing discussion.

## Permissions

- `tabs`: reads tab titles and URLs to create the export
- `storage`: saves copy preferences in `chrome.storage.local`
- `clipboardWrite`: copies generated text to the clipboard

The extension does not read page contents. Browser-internal and extension-internal pages may be shown but cannot be copied when Chrome blocks access to their URLs.

## Privacy

Tab processing happens locally in the browser. The extension does not include an account, analytics, cloud sync, AI API, or background server. It does not store tab titles, URLs, or copied content; only copy preferences are saved locally. See [privacy.html](./privacy.html) for the bilingual policy.

## Install in developer mode

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the repository folder.
5. Pin Tab Copier and click its toolbar icon.

## License

MIT — see [LICENSE](./LICENSE).
