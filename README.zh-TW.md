# Twitch Auto Claimer

Manifest V3 擴充功能（v1.0.5）。在 Twitch 直播頻道頁面上點擊頻道點數的額外獎勵按鈕，並把每個頻道的點擊次數存在這台裝置上。

作者已在 Microsoft Edge 測過這個版本。Chrome 用同一包 Manifest V3。Firefox 不支援。

English: [README.md](README.md)

## 功能

- 直播頁面開啟時，每 2 秒找一次獎勵按鈕，找到就點。
- 認得這些按鈕名稱：英文 `Claim Bonus`、繁體中文 `領取額外獎勵`、簡體中文 `领取奖励`、日文 `ボーナスを受け取る`、韓文 `보너스 받기`。對不上時再試幾個 class 選擇器。
- 不在 `dashboard.twitch.tv` 與 Twitch 設定頁動作。播放器不存在、影片暫停或錯誤時也不點。
- 彈出視窗：開關、各頻道次數、估計點數（一次以 50 點計算，不是 Twitch 餘額）、清除一個頻道或全部，頻道名稱可開到該頁。
- 介面語言可切 English / 中文，中文文案是繁體。存在彈出視窗自己的儲存空間，不讀 `_locales`。
- 設定頁有簡短說明、隱私聲明，以及 Ko-fi 贊助小工具。
- 深色彈出視窗，標題旁是狐狸 emoji。工具列圖示是 `icons/` 裡橘色爪印壓著金幣的圖。
- 瀏覽器擴充功能清單上的簡介來自 `_locales`（`en`、`zh_TW`）。清單裡的名稱固定是 `Twitch Auto Claimer`。

## 從原始碼安裝

選含有 `manifest.json` 的這個資料夾。

### Chrome

1. 開啟 `chrome://extensions`。
2. 打開「開發人員模式」。
3. 按「載入未封裝項目」。
4. 選這個資料夾。

### Microsoft Edge

1. 開啟 `edge://extensions`。
2. 打開「開發人員模式」。
3. 按「載入解壓縮的擴充功能」。
4. 選這個資料夾。

### Firefox

不支援。請不要再把「暫存載入附加元件」當成 Firefox 的安裝方式。`manifest.json` 只註冊了 Manifest V3 的 background service worker，沒有同時提供 `background.scripts`。Firefox 不會執行單獨的 `background.service_worker`（見 [MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)，Firefox bug 1573659）。這個套件也沒有 Firefox 附加元件 id。它在 Microsoft Edge 上測試，不維護 Firefox 版。程式維持現狀，不為 Firefox 改寫。

## 使用方式

1. 載入擴充功能，打開一個正在直播的 `twitch.tv` 頻道。
2. 點工具列圖示。Twitch 頁面每次完整載入時，自動領取是開著的。
3. 讓頁面留著。獎勵按鈕出現時會被點擊，該頻道的次數加 1。
4. 開關只暫停或恢復目前這個分頁，並記住彈出視窗上的位置。頁面重新載入後，內容腳本又從開啟開始，直到你再撥一次。
5. 「清除」刪一個頻道，「清除全部」刪掉所有次數。
6. 齒輪會打開設定頁。

頻道名稱取自網址第一段（`twitch.tv/some_channel` → `some_channel`）。

## 運作方式

`content.js` 在 `*://*.twitch.tv/*`、`document_idle` 時注入。不用 `MutationObserver`。以 `setInterval` 每 2000 毫秒檢查一次。

每次檢查：功能開著、網址不在排除清單、播放器看起來正在直播，才尋找獎勵按鈕。按鈕必須看得到，而且還沒被標成已領取。接著點擊並寫入儲存。

`.video-player` 裡要有正在播放的 `<video>`（`readyState` 大於 0、未暫停、沒有媒體錯誤）。若頁面上有 Twitch 的 live-status 或 stream-status 元素，文字必須包含 `live`。

次數存在 `chrome.storage.local` 的 `twitchAutoClaimerChannelData`，格式是 `{ "頻道": 次數 }`。只用 local，不是 `chrome.storage.sync`，也不是 Twitch 網頁的 `localStorage`。次數是擴充功能點了幾下，不是 Twitch 回傳的餘額。彈出視窗把次數乘以 50 當成點數顯示。

語言（`twitchAutoClaimerLang`，`en` 或 `zh`）和開關（`twitchAutoClaimerEnabled`）存在擴充功能頁面自己的 `localStorage`。

`background.js` 只把彈出視窗的開關訊息轉給作用中的分頁。點擊迴圈在內容腳本裡。

權限只有 `storage`，以及主機權限 `*://*.twitch.tv/*`。沒有 `activeTab`，程式也沒用到它。

## 隱私

次數、語言和開關都留在本機。沒有分析，也沒有作者的伺服器。打開設定頁會向 `ko-fi.com` 載入贊助小工具。這個版本沒有 PayPal 連結。

完整說明：[PRIVACY.md](PRIVACY.md)。上架文案與打包：[STORE.md](STORE.md)。

## 作者

狐狐（Nero）
