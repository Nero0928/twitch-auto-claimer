// Twitch Auto Claimer - Content Script v18
// Direct storage approach (like reference project)

const STORAGE_KEY = 'twitchAutoClaimerChannelData';
const CLAIM_INTERVAL = 2000;
const EXCLUDE_URLS = [
  /.*:\/\/dashboard\.twitch\.tv.*/,
  /.*:\/\/.*\.twitch\.tv\/settings\/.*/,
];

let isEnabled = true;

function isExcluded() {
  return EXCLUDE_URLS.some(pattern => window.location.href.match(pattern));
}

// Listen for toggle messages from popup
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE') {
    isEnabled = message.enabled;
  }
});

function getChannelName() {
  const match = window.location.pathname.match(/^\/([a-zA-Z0-9_]+)/);
  return match ? match[1] : 'unknown';
}

function getButtonByAriaLabel() {
  const labels = [
    "Claim Bonus",
    "領取額外獎勵",
    "领取奖励",
    "ボーナスを受け取る",
    "보너스 받기",
  ];

  for (const label of labels) {
    const btn = document.querySelector(`[aria-label="${label}"]`);
    if (btn) return btn;
  }
  return null;
}

function findClaimButton() {
  // Try aria-label first
  const byAria = getButtonByAriaLabel();
  if (byAria) return byAria;

  // Fallback: class-based (same as reference project)
  const byClass = document.querySelector('.ScCoreButtonSuccess-sc-1qn4ixc-5')
    || document.querySelector('.VGQNd')
    || document.querySelector('.claimable-bonus__icon')?.parentElement?.parentElement?.parentElement;
  if (byClass) return byClass;

  return null;
}

function tryClaim() {
  if (!isEnabled) return;
  if (isExcluded()) return;

  const button = findClaimButton();
  if (!button) return;

  // Verify button is visible
  const rect = button.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return;

  // Get the right click target (same logic as reference)
  let clickTarget = button;
  if (button.nodeName !== 'BUTTON') {
    clickTarget = button.closest('button') || button;
  }

  // Click like reference project does - simple .click()
  clickTarget.click();

  // Record immediately after click
  const channelName = getChannelName();
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    let data = result[STORAGE_KEY] || {};
    data[channelName] = (data[channelName] || 0) + 1;
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      console.log(`[Twitch Auto Claimer] Claim recorded for ${channelName}: ${data[channelName]}`);
    });
  });
}

// Main loop - same as reference project
setInterval(tryClaim, CLAIM_INTERVAL);

console.log('[Twitch Auto Claimer] Loaded');
