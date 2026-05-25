// Twitch Auto Claimer - Popup Script v12

let claimedCount = 0;
let countEl = null;

// Listen for claim updates from content script via BroadcastChannel (more reliable)
const SYNC_CHANNEL = 'twitch-auto-claimer-popup-sync';
try {
  const syncChannel = new BroadcastChannel(SYNC_CHANNEL);
  syncChannel.onmessage = (event) => {
    console.log('[Twitch Auto Claimer] BroadcastChannel message received:', event.data);
    if (event.data.type === 'CLAIM') {
      claimedCount = event.data.count;
      localStorage.setItem('twitchAutoClaimerCount', String(claimedCount));
      // Update UI if element is ready
      if (countEl) {
        countEl.textContent = claimedCount;
      } else {
        // If DOM not ready yet, defer update via DOMContentLoaded
        document.addEventListener('DOMContentLoaded', () => {
          const el = document.getElementById('claimCount');
          if (el) el.textContent = claimedCount;
        }, { once: true });
      }
    }
  };
} catch(e) {
  console.warn('[Twitch Auto Claimer] BroadcastChannel not supported, falling back to runtime.onMessage');
  browser.runtime.onMessage.addListener((message) => {
    console.log('[Twitch Auto Claimer] runtime.onMessage received:', message);
    if (message.type === 'CLAIMED') {
      claimedCount = message.count;
      localStorage.setItem('twitchAutoClaimerCount', String(claimedCount));
      if (countEl) {
        countEl.textContent = claimedCount;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleSwitch');
  const resetBtn = document.getElementById('resetBtn');

  countEl = document.getElementById('claimCount');

  // Load saved state from localStorage
  const savedCount = localStorage.getItem('twitchAutoClaimerCount');
  if (savedCount) {
    claimedCount = parseInt(savedCount, 10);
    countEl.textContent = claimedCount;
  }

  // Load enabled state
  const savedEnabled = localStorage.getItem('twitchAutoClaimerEnabled');
  if (savedEnabled !== null) {
    toggle.checked = savedEnabled === 'true';
  }

  // Handle toggle
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    localStorage.setItem('twitchAutoClaimerEnabled', String(enabled));

    // Notify content script
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE',
          enabled: enabled
        }).catch(() => {});
      }
    });
  });

  // Handle reset
  resetBtn.addEventListener('click', () => {
    claimedCount = 0;
    localStorage.setItem('twitchAutoClaimerCount', '0');
    countEl.textContent = '0';

    // Notify content script to reset its in-memory counter
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, { type: 'RESET_COUNT' }).catch(() => {});
      }
    });
  });
});