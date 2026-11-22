# Privacy policy — Twitch Auto Claimer

Last updated: 22 November 2026  
Applies to extension version 1.0.5  
Developer: 狐狐 (Nero)

This is the privacy policy for the Twitch Auto Claimer browser extension. There is no separate account system and no server operated by the developer for this extension.

The use of information received from Google APIs will adhere to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data), including the Limited Use requirements.

繁體中文在下方。

## What the extension does

On a live Twitch channel page it clicks the channel-points bonus button and keeps a count of those clicks so the toolbar popup can show them.

## What is stored

All of the following stays in the browser. None of it is synced with `chrome.storage.sync`, and none of it is uploaded by the extension's own scripts.

### chrome.storage.local

The `storage` permission is used only for this.

| Key | Value |
| --- | --- |
| `twitchAutoClaimerChannelData` | An object whose keys are channel names and whose values are numbers. The channel name is the first segment of the Twitch URL path (`twitch.tv/some_channel` → `some_channel`). The number is how many times the extension clicked the bonus button on that page. |

### Extension-page localStorage

The popup and the settings page store two strings in **their own** localStorage (the extension origin). The content script does not read or write the Twitch page's localStorage.

| Key | Value |
| --- | --- |
| `twitchAutoClaimerLang` | `en` or `zh` |
| `twitchAutoClaimerEnabled` | `true` or `false` (the popup switch) |

## What is not collected

- No name, email, Twitch login, cookie, or OAuth token.
- No analytics, crash reports, or advertising.
- The claim map and the two settings above are not sent to the developer.
- The extension does not read your channel-points balance. The popup shows clicks × 50 as an estimate.

The content script reads the Twitch page in memory (the bonus button and the video player) only to decide whether to click. That page content is not saved and not transmitted.

## Network requests

- `content.js`, `popup.js`, and `background.js` do not send claim data or settings anywhere.
- A channel name in the popup is a normal link to `https://www.twitch.tv/<channel>`. It loads only if you click it.
- The settings page embeds a Ko-fi donation widget:

  `https://ko-fi.com/widget.html?v=2&name=Twitch Auto Claimer&code=B3D820O9OV`

  Opening settings loads that document from Ko-fi. Ko-fi's own privacy policy applies to the widget (for example your IP address, and any cookie Ko-fi sets). The extension does not add the claim map or the popup settings to that request.

### PayPal

Version 1.0.5 does not contain a PayPal button, a `paypal.com` request, or a `paypal.me` link. An older store note listed `https://paypal.me/Nero0928Nero0928`. That control was removed from the UI in v1.0.5 and replaced with the Ko-fi widget above. Using this version does not send you, or any data the extension stores, to PayPal.

## Permissions

| Permission | Why it is declared |
| --- | --- |
| `storage` | Write and read `twitchAutoClaimerChannelData` in `chrome.storage.local`. |
| Host `*://*.twitch.tv/*` | Inject the content script on Twitch so it can find and click the bonus button, and message that tab. |
| `activeTab` | Not declared. The extension does not use it. |

The manifest does not request `tabs`, `history`, `cookies`, `webRequest`, or `identity`.

## Contact

No email address is published in the extension. Use the contact method on the Chrome Web Store or Microsoft Edge Add-ons listing.

## Changes

This document should be updated if the extension starts storing anything else or contacting any other host.

---

# 隱私權說明 — Twitch Auto Claimer

最後更新：2026 年 11 月 22 日  
適用版本：1.0.5  
開發者：狐狐（Nero）

這份說明描述 Twitch Auto Claimer 擴充功能。開發者沒有為這個擴充功能另開帳號系統，也沒有自己的伺服器。

從 Google API 收到的資訊，其使用方式會遵守 [Chrome 線上應用程式商店使用者資料政策](https://developer.chrome.com/docs/webstore/program-policies/user-data)，包括有限使用（Limited Use）要求。

## 擴充功能做什麼

在正在直播的 Twitch 頻道頁面點擊頻道點數獎勵按鈕，並把點擊次數留在工具列彈出視窗裡顯示。

## 儲存了什麼

下列資料都留在瀏覽器裡。不會用 `chrome.storage.sync` 同步，擴充功能自己的程式也不會把它們上傳。

### chrome.storage.local

`storage` 權限只用在這裡。

| 鍵 | 內容 |
| --- | --- |
| `twitchAutoClaimerChannelData` | 頻道名稱對應次數。頻道名稱是 Twitch 網址的第一段路徑（`twitch.tv/some_channel` → `some_channel`）。次數是擴充功能在該頁點了幾次獎勵按鈕。 |

### 擴充功能頁面的 localStorage

彈出視窗和設定頁把兩個字串存在**它們自己的** localStorage（擴充功能來源），不是 Twitch 網頁的 localStorage。內容腳本不會讀寫 Twitch 頁面的 localStorage。

| 鍵 | 內容 |
| --- | --- |
| `twitchAutoClaimerLang` | `en` 或 `zh` |
| `twitchAutoClaimerEnabled` | `true` 或 `false`（彈出視窗開關） |

## 沒有收集的東西

- 不收集姓名、電子郵件、Twitch 登入、cookie 或 OAuth 權杖。
- 沒有分析、錯誤回報或廣告。
- 領取次數和上面兩項設定不會送給開發者。
- 不讀取你的頻道點數餘額。彈出視窗顯示的是次數 × 50 的估計值。

內容腳本只在記憶體裡讀取 Twitch 頁面（獎勵按鈕與播放器），用來決定要不要點。頁面內容不會存起來，也不會送出。

## 網路連線

- `content.js`、`popup.js`、`background.js` 不會把次數或設定送到任何地方。
- 彈出視窗裡的頻道名稱是連到 `https://www.twitch.tv/<channel>` 的一般連結，只有你點了才會開啟。
- 設定頁嵌入 Ko-fi 贊助小工具：

  `https://ko-fi.com/widget.html?v=2&name=Twitch Auto Claimer&code=B3D820O9OV`

  打開設定頁時，瀏覽器會向 Ko-fi 載入該頁。小工具適用 Ko-fi 自己的隱私權政策（例如 IP 位址，以及 Ko-fi 設定的 cookie）。擴充功能不會把次數或彈出視窗設定加進這個請求。

### PayPal

1.0.5 沒有 PayPal 按鈕，也不會連到 `paypal.com` 或 `paypal.me`。舊的上架筆記曾寫 `https://paypal.me/Nero0928Nero0928`。那個按鈕已在 v1.0.5 從介面移除，改為上面的 Ko-fi 小工具。使用這個版本不會把你或擴充功能存的資料送到 PayPal。

## 權限

| 權限 | 為什麼需要 |
| --- | --- |
| `storage` | 在 `chrome.storage.local` 讀寫 `twitchAutoClaimerChannelData`。 |
| 主機 `*://*.twitch.tv/*` | 在 Twitch 注入內容腳本，尋找並點擊獎勵按鈕，以及對該分頁傳訊息。 |
| `activeTab` | 未宣告。程式沒有使用。 |

清單沒有要求 `tabs`、`history`、`cookies`、`webRequest` 或 `identity`。

## 聯絡

擴充功能裡沒有公開電子郵件。請用 Chrome 線上應用程式商店或 Microsoft Edge 增益集商店商品頁上的聯絡方式。

## 變更

若以後多存了別的資料，或會連到其他網站，應更新這份說明。
