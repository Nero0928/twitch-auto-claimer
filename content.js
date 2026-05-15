// Twitch Auto Claimer - Content Script v3 (Enhanced)
// Monitors the DOM for channel points reward notifications and auto-claims them

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let claimedCount = 0;
  let lastClaimTime = 0;
  const CLAIM_COOLDOWN = 5000;

  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
      log(`Extension ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    } else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({ type: 'STATUS', enabled: isEnabled, claimed: claimedCount });
    }
  });

  // Find all buttons with text for debugging
  function scanAllButtons() {
    const buttons = document.querySelectorAll('button');
    const found = [];
    buttons.forEach((btn, idx) => {
      const text = btn.textContent?.trim() || '';
      const rect = btn.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      if (text.length > 0 && text.length < 100) {
        found.push({ idx, text: text.substring(0, 50), visible: isVisible });
      }
    });
    log(`[Scan] Found ${found.length} buttons:`, found.slice(0, 8));
    return found;
  }

  // Check if element is a reward claim button (green with treasure chest icon)
  function isRewardClaimButton(el) {
    if (!el || !el.tagName) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // Strategy 1: Check for data-a-target containing "claim" or "reward"
    const dataTarget = el.getAttribute?.('data-a-target') || '';
    if (dataTarget.includes('claim') || dataTarget.includes('reward')) {
      log('[Strategy D] Found via data-a-target:', dataTarget);
      return true;
    }

    // Strategy 2: Check class names for reward-related keywords
    const classes = el.className || '';
    const rewardKeywords = ['reward', 'claim', 'points', 'chest', 'treasure', 'coin', 'drop'];
    for (const kw of rewardKeywords) {
      if (classes.toLowerCase().includes(kw)) {
        log('[Strategy C] Found via class:', kw, classes.substring(0, 60));
        return true;
      }

      // Strategy 3: Check if button has specific child elements (treasure chest icon)
      const childClasses = el.querySelector?.('*')?.className || '';
      if (childClasses.toLowerCase().includes(kw)) {
        log('[Strategy E] Found via child class:', kw);
        return true;
      }
    }

    // Strategy 4: Check computed styles - green background (Twitch reward color)
    try {
      const styles = window.getComputedStyle(el);
      const bg = styles.backgroundColor;
      // Check for green-ish colors (rgb(57, 191, 57) is Twitch's reward green)
      if (bg.includes('57') && bg.includes('191') && bg.includes('57')) {
        log('[Strategy F] Found green button');
        return true;
      }
    } catch(e) {}

    // Strategy 5: Check for SVG icons (treasure chest typically has SVG)
    const svgs = el.querySelectorAll?.('svg');
    if (svgs && svgs.length > 0) {
      // Look for elements containing treasure chest path
      const html = el.innerHTML?.toLowerCase() || '';
      if (html.includes('treasure') || html.includes('chest') || html.includes('coin')) {
        log('[Strategy G] Found via SVG content');
        return true;
      }
    }

    return false;
  }

  // Find claim button using multiple strategies
  function findClaimButton() {
    // Strategy 1: Look for button with "claim" text
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.trim().toLowerCase() || '';
      if (text.includes('claim') && !text.includes('claimed')) {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          log('[Strategy 1] Found text button:', text.substring(0, 30));
          return btn;
        }
      }
    }

    // Strategy 2: Look for data-a-target="claim-button"
    const claimBtn = document.querySelector('[data-a-target="claim-button"]');
    if (claimBtn) {
      log('[Strategy 2] Found data-a-target="claim-button"');
      return claimBtn;
    }

    // Strategy 3: Check all buttons for reward characteristics
    for (const btn of buttons) {
      if (isRewardClaimButton(btn)) {
        log('[Strategy 3] Found reward button via isRewardClaimButton');
        return btn;
      }
    }

    // Strategy 4: Look for elements near channel points indicator (purple diamond)
    const pointsEl = document.querySelector('[class*="points"]');
    if (pointsEl) {
      // Look for sibling or nearby buttons
      const parent = pointsEl.closest('[class*="container"]') || pointsEl.parentElement;
      if (parent) {
        const nearbyBtns = parent.querySelectorAll?.('button');
        for (const btn of nearbyBtns || []) {
          if (isRewardClaimButton(btn)) {
            log('[Strategy 4] Found reward button near points indicator');
            return btn;
          }
        }
      }
    }

    return null;
  }

  function tryClaim() {
    if (!isEnabled) return false;

    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const btn = findClaimButton();
    if (btn) {
      log('[CLAIM] Clicking:', btn.className?.substring(0, 40) || 'unknown');
      btn.click();
      lastClaimTime = now;
      claimedCount++;
      log(`[SUCCESS] Claimed reward #${claimedCount}`);
      browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});
      return true;
    }

    return false;
  }

  // Periodic scan
  function periodicScan() {
    if (!isEnabled) return;
    tryClaim();
  }

  log('[Init] Starting Twitch Auto Claimer v3');

  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    for (const mutation of mutations) {
      if (mutation.addedNodes?.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            tryClaim();
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    log('[Init] Running initial scan...');
    scanAllButtons();
    tryClaim();
  }, 3000);

  setInterval(periodicScan, 2000);

  log('[Ready] Extension loaded');
})();