// Twitch Auto Claimer - Popup Script v14

let claimedCount = 0;
let countEl = null;

// Request current count from background service worker when popup opens
browser.runtime.sendMessage({ type: 'GET_COUNT' }).then((response) => {
  if (response && typeof response.count === 'number') {
    claimedCount = response.count;
    if (countEl) countEl.textContent = claimedCount;
  }
}).catch(() => {});

// Listen for claim updates from background service worker
browser.runtime.onMessage.addListener((message) => {
  console.log('[Twitch Auto Claimer] runtime.onMessage received:', message);
  if (message.type === 'CLAIMED' || message.type === 'CLAIM') {
    const newCount = message.count || message;
    claimedCount = newCount;
    localStorage.setItem('twitchAutoClaimerCount', String(claimedCount));
    if (countEl) {
      countEl.textContent = claimedCount;
    }
  }
});

// Listen for claim updates via BroadcastChannel (backup)
const SYNC_CHANNEL = 'twitch-auto-claimer-popup-sync';
try {
  const syncChannel = new BroadcastChannel(SYNC_CHANNEL);
  syncChannel.onmessage = (event) => {
    console.log('[Twitch Auto Claimer] BroadcastChannel message received:', event.data);
    if (event.data.type === 'CLAIM') {
      claimedCount = event.data.count;
      localStorage.setItem('twitchAutoClaimerCount', String(claimedCount));
      if (countEl) {
        countEl.textContent = claimedCount;
      }
    }
  };
} catch(e) {
  console.warn('[Twitch Auto Claimer] BroadcastChannel not supported');
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

    // Also reset via background
    browser.runtime.sendMessage({ type: 'RESET_COUNT' }).catch(() => {});
  });
});