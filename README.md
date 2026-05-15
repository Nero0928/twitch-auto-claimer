# Twitch Auto Claimer

A browser extension that automatically claims Twitch channel points rewards when they appear.

## Features

- 🎯 Auto-claim channel points rewards automatically
- 🔘 Simple toggle on/off control
- 📊 Shows count of claimed rewards
- 🌙 Dark mode UI matching Twitch's aesthetic

## Installation

### Chrome / Edge (Chromium-based)

1. Download or clone this repository
2. Open `chrome://extensions/` (Edge: `edge://extensions/`)
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `twitch-auto-claimer` folder

### Firefox

1. Download or clone this repository
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file

## Usage

1. Open Twitch and go to any live stream
2. Click the extension icon in your browser toolbar
3. Toggle **Auto-claim** ON
4. Rewards will be claimed automatically when they appear

## Files Structure

```
twitch-auto-claimer/
├── manifest.json     # Extension configuration
├── content.js        # Injected script for reward detection
├── popup.html        # Extension popup UI
├── popup.js          # Popup functionality
├── icons/            # Extension icons
└── README.md         # This file
```

## How It Works

- The extension uses a `MutationObserver` to watch for new DOM elements on Twitch
- When a reward notification appears, it automatically clicks the claim button
- State is persisted in localStorage

## Privacy

This extension only runs on Twitch pages and does not collect or transmit any personal data.

---

Built with 🦊 by 狐狐