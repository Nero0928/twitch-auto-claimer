# Store submission (v1.0.5)

給作者：程式的領取邏輯沒有改。這次只做了兩處產品檔案的修改：`manifest.json` 拿掉沒有使用的 `activeTab`，`settings.html` 頁尾版本號從 v1.0.4 改成 v1.0.5（與 manifest、彈出視窗一致）。圖示三張都是白的，送審前一定要換成真的圖。這個版本沒有 PayPal，贊助按鈕是設定頁的 Ko-fi。Firefox 不支援。打包用下面的指令，壓縮檔在 `dist/`，不要把 `dist/` 提交進 git。

## Package

Both scripts read `version` from `manifest.json` and write `dist/twitch-auto-claimer-<version>.zip`. `dist/` is gitignored. The zip root is the extension (`manifest.json` at the top), which is what both stores expect.

```bash
node scripts/package.mjs
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package.ps1
```

Included:

- `manifest.json`
- root `*.js` and `*.html` (`background.js`, `content.js`, `popup.js`, `settings.js`, `popup.html`, `settings.html`)
- `_locales/`
- `icons/`

Left out: this file, `README.md`, `README.zh-TW.md`, `PRIVACY.md`, `scripts/`, `store-assets/`, `.git`.

## Icons

| File | In the repo | What it actually is |
| --- | --- | --- |
| `icons/icon16.png` | Yes, 118 bytes, IHDR 16×16 | Paints as a blank white square |
| `icons/icon48.png` | Yes, 241 bytes, IHDR 48×48 | Paints as a blank white square |
| `icons/icon128.png` | Yes, 605 bytes, IHDR 128×128 | Paints as a blank white square |
| `icon256.png` | No | Not required inside the zip |
| `icon512.png` | No | Not required inside the zip |

`icon128.png` is a PNG container (8-bit RGBA, CRC checks pass) but the image data is short: the IDAT stream decompresses to 49,280 bytes, and a full 128×128 RGBA frame with filter bytes is 65,664 bytes. Chrome still reports 128×128 and fires the image load event. The pixels that show are white, with a tiny cyan speck. The 16 and 48 files are the same kind of file. They are not a low-resolution drawing of a logo. They are blank, and they are not usable as a toolbar icon or a store icon.

Chrome's listing needs a real **128×128** icon, uploaded in the dashboard (the manifest icon is separate from that upload, and this file should not be that upload). Edge wants a square logo, **300×300 recommended**, **128×128 minimum**, also uploaded in Partner Center rather than shipped as `icon256.png`. Optional promo tiles (Chrome and Edge: 440×280 and 1400×560) are not in this repo.

Replace `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` with real PNGs of those sizes before you ship. The popup's fox is an emoji in the HTML, not these files.

## Screenshots

Rendered from the real `popup.html` and `settings.html` in headless Chrome. `chrome.*` / `browser.*` were stubbed. Sample counts: `moonlight_static` 24, `foxden_live` 11, `night_market` 4 (39 total, 50 points per click). Language is the extension's own English / 中文 switch. The 中文 strings are Traditional Chinese. Each file is exactly 1280×800. The 340px-wide page is centered on the extension background (`#0d0d0f`). Nothing else was drawn on top.

| File | What it shows |
| --- | --- |
| [store-assets/popup-en-1280x800.png](store-assets/popup-en-1280x800.png) | Popup, English |
| [store-assets/popup-zh-TW-1280x800.png](store-assets/popup-zh-TW-1280x800.png) | Popup, Traditional Chinese |
| [store-assets/settings-en-1280x800.png](store-assets/settings-en-1280x800.png) | Settings, English |
| [store-assets/settings-zh-TW-1280x800.png](store-assets/settings-zh-TW-1280x800.png) | Settings, Traditional Chinese |

Regenerate (needs `puppeteer-core` and Chrome):

```bash
npm install puppeteer-core
node scripts/render-store-screenshots.mjs
```

The Ko-fi widget did not paint. A headless request to `ko-fi.com` got a Cloudflare challenge, so the Support Development box is an empty frame. The rest of each settings shot is the real page. Retake the two settings images in Edge if you want the donate button visible on the listing. These are not photos of a Twitch watch page. Add one of those yourself if you want the popup shown over a channel.

Chrome accepts 1280×800 or 640×400, at least 1 and at most 5. Edge accepts 1280×800 or 640×480, up to 6. These four are 1280×800, so the same files fit both. Edge can duplicate one language's images to the other.

## Single purpose

Paste:

```
Automatically click the channel-points bonus button on a live Twitch channel and show a local count of those clicks.
```

## Permission justifications

`activeTab` was removed from `manifest.json`. Nothing calls `chrome.scripting` or `tabs.executeScript`, nothing reads `tab.url`, and the content script is injected by the manifest on Twitch. `chrome.tabs.create` (the settings gear) and `tabs.sendMessage` to that content script do not need `activeTab`. The host permission already covers Twitch. The privacy form only asks about permissions that are still in the package. If an older zip still lists `activeTab`, delete it and upload again rather than justifying it.

### storage

```
Saves a map of Twitch channel names to how many times this extension clicked the bonus button, in chrome.storage.local under the key twitchAutoClaimerChannelData, so the popup can show the counts after the browser restarts. The extension does not use chrome.storage.sync and does not send this map off the device. The on/off switch and the popup language use the extension page's own localStorage and do not need this permission.
```

### Host permission `*://*.twitch.tv/*`

```
The content script has to run inside Twitch channel pages to find the bonus button and click it. This is the same set of pages as content_scripts.matches. The script does not run on other sites. It skips dashboard.twitch.tv and Twitch settings URLs, and it does not click unless a live video is playing.
```

## Remote code

Answer **Yes**. The claim loop is packaged. The settings page is not fully local:

```
All extension logic ships in the zip. settings.html embeds Ko-fi's donation widget in an iframe, https://ko-fi.com/widget.html?v=2&name=Twitch Auto Claimer&code=B3D820O9OV, with sandbox allow-scripts allow-same-origin. The widget loads only when the user opens Settings. It is not used to click the bonus button, and the claim counts are not added to that request. No other remote script is loaded.
```

Do not answer "No, I am not using remote code" while that iframe is still in `settings.html`. Removing the iframe would be a code change; this package does not do that.

## Data use

Do not check any data-type box:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- Web history
- User activity
- Website content

Check all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

What the code actually does, so the answers stay consistent with [PRIVACY.md](PRIVACY.md):

- Channel name (first URL path segment) and a click count stay in `chrome.storage.local`. Not synced, not uploaded.
- Popup language and the on/off switch stay in the extension page's `localStorage`, not the Twitch page's.
- The content script reads the bonus button and the video player in memory to decide whether to click. It does not store or upload page content.
- Opening Settings loads the Ko-fi iframe. That request does not include the claim map. Ko-fi can see a normal browser request (IP address and whatever Ko-fi sets). The privacy policy says so. Read the form's help text before certifying the "do not transfer" line if you think that iframe counts as a transfer.

There is no PayPal button in v1.0.5. An older note listed `https://paypal.me/Nero0928Nero0928`. That control was removed and replaced with the Ko-fi widget. The extension does not contact PayPal.

## Privacy policy URL

Host [PRIVACY.md](PRIVACY.md) at a public HTTPS URL and paste it into both dashboards. After this file is on the default branch, this page is enough:

`https://github.com/Nero0928/twitch-auto-claimer/blob/main/PRIVACY.md`

The policy covers local storage, the permissions, the Ko-fi widget, and the fact that the old PayPal URL is not in this version. It includes the Chrome Web Store Limited Use sentence.

## Listing text

The one-line browser description is already in `_locales` (`description`). Edge's store description is a separate field and must be at least 250 characters. Paste the long text below into the Chrome detailed description and into the Edge description. Do not mention PayPal, Firefox, or a MutationObserver.

### English

```
Automatically clicks Twitch's channel-points bonus button while a live channel is open, and keeps a count of those clicks on your device.

The extension checks the page every two seconds. When the bonus button is visible it clicks it. It recognizes the English, Traditional Chinese, Simplified Chinese, Japanese, and Korean labels Twitch uses for that button. It skips the creator dashboard, settings pages, and any channel whose video is not playing.

The toolbar popup shows a per-channel click count and an estimate of 50 points per click. That estimate is not your real Twitch balance. You can clear one channel or clear every count, and you can switch the popup between English and Traditional Chinese.

Claim counts stay in chrome.storage.local on this browser. They are not uploaded. There is no account and no analytics. The settings page includes an optional Ko-fi donation widget. This version does not link to PayPal.

Open a live Twitch channel with the extension installed and leave auto-claim on. The bonus is clicked for you when the button appears.
```

### 繁體中文 (zh-TW)

```
在 Twitch 直播頻道頁面自動點擊頻道點數的額外獎勵按鈕，並把每個頻道的點擊次數留在你的瀏覽器裡。

擴充功能每兩秒檢查一次頁面。獎勵按鈕出現而且看得到時會點下去。它認得 Twitch 這個按鈕的英文、繁體中文、簡體中文、日文和韓文名稱。創作者後台、設定頁，以及影片沒有在播放的頻道會略過。

工具列彈出視窗會顯示各頻道的點擊次數，並用「一次 50 點」做估計。那不是你的 Twitch 真實餘額。可以清除一個頻道或全部次數，也可以把介面切成英文或繁體中文。

次數存在這台瀏覽器的 chrome.storage.local，不會上傳。沒有帳號，也沒有分析。設定頁有一個可選的 Ko-fi 贊助小工具。這個版本沒有 PayPal 連結。

裝好之後打開正在直播的 Twitch 頻道，讓自動領取保持開啟。獎勵按鈕出現時就會被點擊。
```

## Chrome Web Store

1. Sign in at https://chrome.google.com/webstore/devconsole and pay the one-time **$5** developer registration if you have not already.
2. Build the zip above and upload it (**Add new item**).
3. Paste the single purpose, the two permission justifications, the remote-code answer, and the data-use answers.
4. Paste the privacy policy URL.
5. Store listing: name comes from the manifest (`Twitch Auto Claimer`). Paste the English detailed description. Add a zh-TW locale and paste the Traditional Chinese description.
6. Upload a real 128×128 icon. Do not upload `icons/icon128.png` as it is now.
7. Upload the screenshots (up to 5).
8. Submit. Review time is up to Google.

## Microsoft Edge Add-ons (Partner Center)

Same zip. There is no Edge developer fee. Guide: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension

1. Sign in to Partner Center with a Microsoft account: https://partner.microsoft.com/dashboard/microsoftedge/overview
2. Create an extension and upload the zip. The extension name on the listing is taken from the manifest and is not edited there.
3. Privacy page: paste the same single purpose, `storage` justification, host-permission justification, remote-code **Yes** text, data-use answers, and privacy policy URL.
4. Store listings: add English and Chinese (Traditional). For each language, paste the long description (Edge requires at least 250 characters). Category is required; Entertainment is the closest. You can pick another.
5. Upload a real square logo (300×300 recommended, 128×128 minimum). Upload the 1280×800 screenshots (up to 6). You can duplicate assets from one language to the other.
6. Publish. Microsoft's guide says certification can take up to seven business days.

The author already tested the extension's behavior on Microsoft Edge. This packaging pass did not change `content.js`, `popup.js`, `settings.js`, or `background.js`.
