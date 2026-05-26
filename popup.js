// Twitch Auto Claimer - Popup Script v15
// Redesigned by 狐狐 🦊

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleSwitch');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Update status indicator based on toggle
  function updateStatus(enabled) {
    if (enabled) {
      statusDot.classList.add('active');
      statusText.textContent = '監控中';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = '已暫停';
    }
  }

  // Load saved enabled state
  const savedEnabled = localStorage.getItem('twitchAutoClaimerEnabled');
  if (savedEnabled !== null) {
    toggle.checked = savedEnabled === 'true';
  }
  updateStatus(toggle.checked);

  // Handle toggle
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    localStorage.setItem('twitchAutoClaimerEnabled', String(enabled));
    updateStatus(enabled);

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
});
