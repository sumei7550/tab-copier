# Chrome Web Store listing kit — Tab Copier 1.2

## Product positioning

**For researchers, writers, and knowledge workers who need to move a set of browser tabs into notes.** Tab Copier copies selected tabs as clean Markdown, links, or HTML. Tab contents stay on the device.

Use the **Workflow & planning** category. Do not use competitor names or claims such as “best” or “fastest”.

## English (primary)

- **Title:** Tab Copier – Export Tabs to Markdown
- **Summary:** Copy selected tabs as Markdown, links, or HTML. Tab contents stay on your device.
- **Detailed description:**

Save a research session or share a set of links in seconds. Tab Copier turns the browser tabs you choose into clean text ready for Notion, Obsidian, documents, email, or chat.

Features:

- Copy selected tabs from the current window or every open window.
- Choose Markdown, URL-only, title + URL, or HTML-link output.
- Filter tabs before copying; optionally exclude pinned tabs and duplicate URLs.
- Remove common tracking parameters for cleaner shared links.
- No account or ads. Tab titles, URLs, and copied text stay on your device.
- Pseudonymous usage events, including operating system and basic feature interactions, are sent to Mixpanel. The request IP address is used to infer country and location. Filter text and tab contents are not sent.

The `tabs` permission is used only to read the titles and URLs needed to create the text you copy. Those details are never sent to a server.
The `storage` permission keeps copy preferences and a random analytics identifier on the device. Access to `api.mixpanel.com` is used only for the usage events described above, including IP-based country and location inference.

## Localized titles and summaries

| Locale | Title | Summary |
|---|---|---|
| 简体中文 | Tab Copier – 一键导出标签页链接 | 将选中的标签页复制为 Markdown、链接或 HTML。标签内容留在本地。 |
| 繁體中文 | Tab Copier – 匯出分頁連結 | 將選取的分頁複製為 Markdown、連結或 HTML。分頁內容留在本機。 |
| 日本語 | Tab Copier – タブをMarkdownへ書き出し | 選択したタブを Markdown、リンク、HTML としてコピー。タブの内容は端末内に残ります。 |
| 한국어 | Tab Copier – 탭을 Markdown으로 내보내기 | 선택한 탭을 Markdown, 링크 또는 HTML로 복사합니다. 탭 내용은 기기에 남습니다. |
| Español | Tab Copier – Exportar pestañas a Markdown | Copia pestañas seleccionadas como Markdown, enlaces o HTML. El contenido permanece en el dispositivo. |
| Deutsch | Tab Copier – Tabs als Markdown exportieren | Kopiert ausgewählte Tabs als Markdown, Links oder HTML. Tab-Inhalte bleiben auf dem Gerät. |
| Français | Tab Copier – Exporter les onglets en Markdown | Copiez les onglets sélectionnés en Markdown, liens ou HTML. Le contenu reste sur l'appareil. |
| Русский | Tab Copier – Экспорт вкладок в Markdown | Копируйте выбранные вкладки как Markdown, ссылки или HTML. Содержимое остаётся на устройстве. |
| ไทย | Tab Copier – ส่งออกแท็บเป็น Markdown | คัดลอกแท็บที่เลือกเป็น Markdown ลิงก์ หรือ HTML เนื้อหาแท็บอยู่บนอุปกรณ์ |
| Bahasa Melayu | Tab Copier – Eksport tab ke Markdown | Salin tab terpilih sebagai Markdown, pautan atau HTML. Kandungan tab kekal pada peranti. |
| Bahasa Indonesia | Tab Copier – Ekspor tab ke Markdown | Salin tab pilihan sebagai Markdown, tautan, atau HTML. Isi tab tetap di perangkat. |
| Português (Brasil) | Tab Copier – Exportar abas para Markdown | Copie abas selecionadas como Markdown, links ou HTML. O conteúdo fica no dispositivo. |

## Upload checklist

1. Upload `promo-tile-440x280.png` as the small promo tile.
2. Load this extension in Chrome, then capture four real 1280×800 screenshots: format selection; filtering selected tabs; pasted Markdown in a notes app; settings/privacy screen.
3. In the Store listing language dropdown, fill each locale. The `_locales` folders in this release make the locales selectable.
4. Fill the privacy practices form: disclose pseudonymous product interaction events, operating system, and IP-based location inference via Mixpanel. Do not declare collection or transfer of website content, tab titles, URLs, or filter text. Data is not sold.
5. Add the GitHub repository as homepage/support URL and publish a concise 1.2 release note.

## Suggested release note

Sends pseudonymous usage events to Mixpanel, including operating system and IP-based location inference. Tab titles, URLs, copied text, and filter text stay on the device.
