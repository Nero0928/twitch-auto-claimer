# Chrome Web Store Publishing Guide

## Current Status: Ready for Submission

## Pre-Submission Checklist

### ✅ Already Done
- [x] PayPal donate button (https://paypal.me/Nero0928Nero0928)
- [x] Store-ready icons (16x16, 48x48, 128x128, 256x256, 512x512)
- [x] Manifest V3 compatible
- [x] Native i18n support (EN/zh_TW)

### ⏳ You Need to Do

**1. Take Real Screenshots (Required: 1-5 screenshots)**

The Chrome Web Store requires real screenshots of your extension. AI-generated images won't work because:
- Text won't be legible
- May violate store policies

**How to take screenshots:**
1. Install the extension locally
2. Open Twitch (or any page where popup works)
3. Click the extension icon to show popup
4. Take screenshot:
   - Windows: `Win + Shift + S` then drag area, or PrtScn
   - Or use browser's built-in screenshot tool
5. Recommended sizes: **1280x800** or **640x400**

**Suggested screenshots:**
1. Main popup showing stats (English)
2. Main popup showing stats (Chinese)
3. Close-up of the stats card with multiple channels

**2. Create Developer Account**

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "Add new item"
3. Pay $5 one-time developer fee
4. Verify your email

**3. Create ZIP Package**

When ready to publish:
```bash
cd ~/twitch-auto-claimer && git pull
```

Then zip the extension folder (not the repo root, just the extension files):
```
twitch-auto-claimer/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── _locales/
│   ├── en/messages.json
│   └── zh_TW/messages.json
└── icons/
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    ├── icon256.png
    └── icon512.png
```

---

## Store Listing Content

### English (en)
**Title:** Twitch Auto Claimer

**Description:**
```
Automatically claim Twitch channel points rewards when they appear.

Features:
• Auto-claim bonus rewards when they appear
• Per-channel tracking with claim counts
• Bilingual support (English/繁體中文)
• Beautiful dark theme with fox design
• Support development via PayPal

How it works:
1. Install the extension
2. Make sure Auto-claim is enabled
3. Visit Twitch channels
4. Rewards are claimed automatically!

Note: This extension does not collect any personal data. All processing happens locally in your browser.
```

### Chinese (zh_TW)
**標題:** Twitch Auto Claimer

**描述:**
```
自動領取 Twitch 頻道點數獎勵。

功能：
• 獎勵出現時自動領取
• 每頻道獨立統計領取次數
• 雙語支援（English/繁體中文）
• 狐狸主題深色介面
• 可透過 PayPal 支持開發

使用方法：
1. 安裝擴充功能
2. 確保自動領取已開啟
3. 造訪 Twitch 頻道
4. 獎勵會自動領取！

注意：此擴充功能不會收集任何個人資料。所有處理都在瀏覽器本地完成。
```

---

## Store Assets Status

| Asset | Status | Notes |
|-------|--------|-------|
| icon16.png | ✅ Ready | Toolbar icon |
| icon48.png | ✅ Ready | Extension page |
| icon128.png | ✅ Ready | Store listing |
| icon256.png | ✅ Ready | Store listing (hi-res) |
| icon512.png | ✅ Ready | Store listing (hi-res) |
| Screenshot 1 | ⏳ Needed | 1280x800 English |
| Screenshot 2 | ⏳ Needed | 1280x800 Chinese |
| Promotional image | ⏳ Optional | 1280x640 |

---

## Submitting

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "Add new item"
3. Upload ZIP
4. Fill in store listing (use content above)
5. Upload screenshots
6. Submit for review

**Review time:** Usually 1-3 days

---

## Post-Publication

- Monitor reviews and ratings
- Keep extension updated with Twitch changes
- Respond to user feedback
