# Chrome Web Store Publishing Guide

## Current Status: Ready for Review

## Store Listing Content

### English (en)
**Title:** Twitch Auto Claimer  
**Description:**  
Automatically claim Twitch channel points rewards when they appear. 

**Features:**
- 🔄 Auto-claim bonus rewards when they appear
- 📊 Per-channel tracking with claim counts
- 🌍 Supports multiple languages (English/繁體中文)
- 🌙 Dark theme with fox-inspired design
- ☕ Support development with Ko-fi / PayPal

**How it works:**
1. Install the extension
2. Make sure Auto-claim is enabled
3. Visit any Twitch channel
4. Rewards are claimed automatically when available

Note: This extension does not interact with any servers - all processing happens locally in your browser.

### Chinese (zh_TW)
**標題:** Twitch Auto Claimer  
**描述:**  
自動領取 Twitch 頻道點數獎勵。

**功能:**
- 🔄 獎勵出現時自動領取
- 📊 每頻道獨立統計領取次數
- 🌍 支援中英文
- 🌙 狐狸主題深色介面
- ☕ 可透過 Ko-fi / PayPal 支持開發

## Required Assets

### Icons (CURRENT - Need Upgrade)
✅ icon16.png (16x16) - Extension toolbar
✅ icon48.png (48x48) - Extension management page  
✅ icon128.png (128x128) - Chrome Web Store listing

❌ icon256.png (256x256) - REQUIRED for store
❌ icon512.png (512x512) - REQUIRED for store (high-res)

### Screenshots
❌ 1-5 screenshots required (1280x800 or 640x400)

**Suggested screenshots:**
1. Main popup UI showing stats
2. Channel list with multiple entries
3. Language toggle demonstration

### Store Logo
❌ 1280x640 promotional image (optional but recommended)

## Publishing Steps

1. **Prepare Assets**
   - Generate 256x256 and 512x512 icons
   - Create 1-5 screenshots
   - Optional: promotional logo

2. **Update Donate Links**
   - Edit `popup.html` line with `href="https://ko-fi.com/yourusername"`
   - Edit `popup.html` line with `href="https://paypal.me/yourusername"`
   - Replace `yourusername` with actual Ko-fi/PayPal usernames

3. **Create Developer Account**
   - Go to https://chrome.google.com/webstore/devconsole
   - Pay $5 one-time developer registration fee

4. **Submit Extension**
   - Create new item
   - Upload ZIP (export from git)
   - Fill in store listing
   - Submit for review (usually 1-3 days)

## Files to Include in ZIP

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

## Post-Publishing

After approval:
- Monitor reviews and ratings
- Keep extension updated with Twitch changes
- Respond to user feedback
