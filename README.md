# Twitch Auto Claimer

Manifest V3 extension (v1.0.5) that clicks Twitch's channel-points bonus button on a live channel and stores a per-channel count on this device.

Tested by the author on Microsoft Edge. Chrome uses the same Manifest V3 package. Firefox is not supported.

繁體中文：[README.zh-TW.md](README.zh-TW.md)

## Features

- Every 2 seconds, on a live Twitch page, looks for the bonus button and clicks it.
- Matches the button label in English (`Claim Bonus`), Traditional Chinese (`領取額外獎勵`), Simplified Chinese (`领取奖励`), Japanese (`ボーナスを受け取る`), and Korean (`보너스 받기`), then falls back to a few class names.
- Does nothing on `dashboard.twitch.tv` or Twitch settings URLs, or when the channel video is missing, paused, or in error.
- Popup: on/off switch, per-channel click counts, a points figure of 50 per click (an estimate, not your Twitch balance), clear one channel or clear all, and a link to that channel.
- Popup language switch, English or Traditional Chinese. Saved in the popup, not taken from `_locales`.
- Settings page with a short about / how-to / privacy note and a Ko-fi donation widget.
- Dark popup. The header mark is a fox emoji. The toolbar icon is the orange paw on a gold coin in `icons/`.
- The text Chrome and Edge show under the extension name comes from `_locales` (`en`, `zh_TW`). The manifest name itself is always `Twitch Auto Claimer`.

## Install from source

Load the folder that contains `manifest.json` (this repo root).

### Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

### Microsoft Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

### Firefox

Not supported. Do not use the old "Load Temporary Add-on" steps as a Firefox install. `manifest.json` registers only a Manifest V3 background service worker. Firefox does not run `background.service_worker` unless `background.scripts` is set as well ([MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background), Firefox bug 1573659). This package has neither `background.scripts` nor a Firefox add-on id. It is tested on Microsoft Edge and is not maintained for Firefox. The code is unchanged on purpose.

## Usage

1. Load the extension and open a live channel on `twitch.tv`.
2. Click the toolbar icon. Each full load of a Twitch page starts with claiming enabled.
3. Leave the page open. When the bonus button is on screen, the extension clicks it and adds 1 to that channel's count.
4. The switch pauses or resumes the active tab and remembers its position in the popup. A newly loaded page starts enabled again until you toggle it.
5. **Clear** deletes one channel. **Clear All** deletes every count.
6. The gear opens the settings page.

The channel name is the first segment of the path (`twitch.tv/some_channel` → `some_channel`).

## How it works

`content.js` is injected on `*://*.twitch.tv/*` at `document_idle`. It does not use a `MutationObserver`. A `setInterval` of 2000 ms runs the check.

On each tick, if claiming is enabled, the URL is not excluded, and the player looks live, it searches for the bonus button. The control must be visible and not already marked claimed. It then clicks and updates storage.

A playing `<video>` inside `.video-player` is required (`readyState` above 0, not paused, no media error). If Twitch's live-status or stream-status element is present, its text must contain `live`.

Counts are stored with `chrome.storage.local` under `twitchAutoClaimerChannelData`, as `{ "channel": number }`. That is local only: not `chrome.storage.sync`, and not the Twitch page's `localStorage`. The count is how many times the extension clicked. It does not read Twitch's response or your real balance. The popup multiplies the count by 50 for the points label.

The popup language (`twitchAutoClaimerLang`, `en` or `zh`) and switch (`twitchAutoClaimerEnabled`) use the extension page's own `localStorage`.

`background.js` only forwards the popup's toggle message to the active tab. The click loop stays in the content script.

Permissions in the manifest are `storage` and the host permission `*://*.twitch.tv/*`. `activeTab` is not requested; nothing in the code uses it.

## Privacy

Claim counts and the popup language/switch stay on the device. There is no analytics and no author server. Opening settings loads a Ko-fi widget from `ko-fi.com`. This version has no PayPal link.

Details: [PRIVACY.md](PRIVACY.md). Store listing copy and the zip build: [STORE.md](STORE.md).

## Files

```
manifest.json
background.js
content.js
popup.html
popup.js
settings.html
settings.js
_locales/en/messages.json
_locales/zh_TW/messages.json
icons/icon16.png
icons/icon48.png
icons/icon128.png
icons/icon256.png
icons/icon512.png
store-assets/icon_master.png
scripts/package.mjs
scripts/package.ps1
scripts/render-store-screenshots.mjs
store-assets/
PRIVACY.md
STORE.md
README.md
README.zh-TW.md
```

## Author

狐狐 (Nero)
