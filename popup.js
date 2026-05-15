// Twitch Auto Claimer - Popup Script

let claimedCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleSwitch');
  const countEl = document.getElementById('claimCount');
  const resetBtn = document.getElementById('resetBtn');

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
  });

  // Listen for claim updates from content script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'CLAIMED') {
      claimedCount = message.count;
      localStorage.setItem('twitchAutoClaimerCount', String(claimedCount));
      countEl.textContent = claimedCount;
    }
  });
});