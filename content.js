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

function isButtonDisabled(button) {
  // Check multiple indicators that the button was already claimed
  if (button.hasAttribute('disabled')) return true;
  if (button.getAttribute('aria-disabled') === 'true') return true;
  
  const label = button.getAttribute('aria-label') || '';
  const claimedLabels = ['Claimed', '已領取', '领取', 'claimed', 'done'];
  for (const l of claimedLabels) {
    if (label.toLowerCase().includes(l.toLowerCase())) return true;
  }
  
  // Check class-based disabled states
  const classes = button.className || '';
  if (classes.includes('disabled') || classes.includes('claimed')) return true;
  
  // Check if button has reduced opacity (visual disabled indicator)
  const style = window.getComputedStyle(button);
  if (style.opacity === '0.5' || style.opacity === '0.4' || style.opacity === '0.3') return true;
  
  return false;
}

function isValidClaimButton(button) {
  // Must be a button or have a button ancestor
  const clickTarget = button.nodeName !== 'BUTTON' 
    ? button.closest('button') 
    : button;
  if (!clickTarget) return false;

  // Check if it's actually disabled/claimed
  if (isButtonDisabled(clickTarget)) return false;

  // Verify aria-label contains actual claim text (not just any label)
  const label = clickTarget.getAttribute('aria-label') || '';
  const claimLabels = ['Claim Bonus', '領取額外獎勵', '领取奖励', 'ボーナスを受け取る', '보너스 받기'];
  const hasClaimLabel = claimLabels.some(l => label.includes(l));
  
  // Check button text content
  const text = clickTarget.textContent?.trim() || '';
  const hasClaimText = text.includes('Claim') || text.includes('Bonus') || text.includes('領取') || text.includes('奖励');

  // At least one indicator should match
  if (!hasClaimLabel && !hasClaimText) return false;

  // Must be visible (non-zero size)
  const rect = clickTarget.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return false;

  return true;
}

function tryClaim() {
  if (!isEnabled) return;
  if (isExcluded()) return;

  const button = findClaimButton();
  if (!button) return;

  // Validate this is actually a claimable button
  if (!isValidClaimButton(button)) return;

  const clickTarget = button.nodeName !== 'BUTTON' 
    ? button.closest('button') 
    : button;

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
