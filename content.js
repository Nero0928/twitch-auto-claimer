// Twitch Auto Claimer - Content Script v7
// Uses aria-label and class selectors from actual Twitch DOM inspection

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
    if (message.type === 'TOGGLE') isEnabled = message.enabled;
    else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({ type: 'STATUS', enabled: isEnabled, claimed: claimedCount });
    }
  });

  function clickElement(el) {
    if (!el) return false;
    try {
      el.focus();
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      ['mousedown', 'mouseup', 'click'].forEach(type => {
        el.dispatchEvent(new MouseEvent(type, {
          bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy
        }));
      });
      return true;
    } catch(e) {
      try { el.click(); return true; } catch(e2) { return false; }
    }
  }

  // Find claim button using Twitch's specific selectors
  function findClaimButton() {
    // Method 1: aria-label (most reliable - directly from Twitch DOM)
    const byAria = document.querySelector('[aria-label="領取額外獎勵"]');
    if (byAria) {
      log('[Method 1] Found via aria-label="領取額外獎勵"');
      return byAria;
    }

    // Method 2: aria-label variations (English, other languages)
    const ariaVariants = [
      'Claim Bonus',
      'claim bonus',
      'Claim extra reward',
      'claim extra reward'
    ];
    for (const label of ariaVariants) {
      const el = document.querySelector(`[aria-label="${label}"]`);
      if (el) {
        log(`[Method 1b] Found via aria-label="${label}"`);
        return el;
      }
    }

    // Method 3: class name "claimable-bonus__icon" (exact from inspection)
    const byClass = document.querySelector('.claimable-bonus__icon');
    if (byClass) {
      log('[Method 2] Found via .claimable-bonus__icon');
      return byClass;
    }

    // Method 4: partial class match
    const partialClass = document.querySelector('[class*="claimable-bonus"]');
    if (partialClass) {
      log('[Method 3] Found via [class*="claimable-bonus"]');
      return partialClass;
    }

    // Method 5: Any element with "claimable" in class
    const claimable = document.querySelector('[class*="claimable"]');
    if (claimable) {
      log('[Method 4] Found via [class*="claimable"]');
      return claimable;
    }

    return null;
  }

  function tryClaim() {
    if (!isEnabled) return false;
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const btn = findClaimButton();
    if (btn) {
      // Verify button is visible
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        log('[Skip] Button exists but not visible');
        return false;
      }

      log(`[Claim] Clicking: aria-label="${btn.getAttribute('aria-label') || 'none'}"`);
      const clicked = clickElement(btn);
      if (clicked) {
        lastClaimTime = now;
        claimedCount++;
        log(`[SUCCESS] Claimed reward #${claimedCount}`);
        browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});
        try { localStorage.setItem('twitchAutoClaimerCount', claimedCount); } catch(e) {}
        return true;
      }
    }
    return false;
  }

  log('[Init] Twitch Auto Claimer v7 loaded');

  // Main observer
  const observer = new MutationObserver(() => {
    if (isEnabled) tryClaim();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check
  setTimeout(tryClaim, 2000);
  setInterval(tryClaim, 2000);

  // Also scan on any click
  document.addEventListener('click', () => setTimeout(tryClaim, 100), true);

  log('[Ready] Watching for rewards...');
})();