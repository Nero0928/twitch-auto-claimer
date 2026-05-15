// Twitch Auto Claimer - Content Script v5 (Robust)
// Uses multiple click methods and prevents duplicate claims

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let claimedCount = 0;
  let lastClaimTime = 0;
  let lastClickedRewardId = null; // Track what we last clicked
  const CLAIM_COOLDOWN = 6000; // 6 seconds cooldown

  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
    } else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({ type: 'STATUS', enabled: isEnabled, claimed: claimedCount });
    }
  });

  // Better click using multiple fallbacks
  function clickElement(el) {
    if (!el) return false;

    // Remove disabled attribute if present
    if (el.hasAttribute('disabled')) {
      el.removeAttribute('disabled');
    }

    // Remove disabled class
    el.classList.remove('disabled');

    // Try focus first
    try { el.focus(); } catch(e) {}

    // Use both mousedown + mouseup + click for reliability
    try {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Mouse down
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true, cancelable: true,
        view: window, clientX: centerX, clientY: centerY
      });
      el.dispatchEvent(mousedownEvent);

      // Mouse up
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true, cancelable: true,
        view: window, clientX: centerX, clientY: centerY
      });
      el.dispatchEvent(mouseupEvent);

      // Click
      const clickEvent = new MouseEvent('click', {
        bubbles: true, cancelable: true,
        view: window, clientX: centerX, clientY: centerY
      });
      el.dispatchEvent(clickEvent);

      log('[Click] Sent multi-event sequence');
      return true;
    } catch(e) {
      log('[Click] Multi-event failed, trying .click()');
      try {
        el.click();
        return true;
      } catch(e2) {
        log('[Click] All methods failed');
        return false;
      }
    }
  }

  // Find the actual reward claim button in Twitch's UI
  function findClaimButton() {
    // Method 1: Direct data-a-target
    const d1 = document.querySelector('[data-a-target="claim-button"]');
    if (d1) {
      log('[Method 1] claim-button');
      return d1;
    }

    // Method 2: Look for claimable reward container
    // Twitch shows a purple diamond with 0/1/2+ points, then a green button when available
    const containers = document.querySelectorAll('[class*="claimable"]');
    for (const c of containers) {
      const btn = c.querySelector('button');
      if (btn) {
        log('[Method 2] claimable container');
        return btn;
      }
    }

    // Method 3: Find by green color (Twitch reward green)
    // Look for elements with background: rgb(57, 191, 57) or rgba(57, 191, 57, 1)
    const allEls = document.querySelectorAll('button, div[role="button"], span');
    for (const el of allEls) {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 20) continue;
        if (rect.width > 300 || rect.height > 100) continue; // Too large to be a button

        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        // Check for Twitch green: rgb(57, 191, 57)
        if (bg.includes('57') && bg.includes('191') && bg.includes('57') && !bg.includes('0)')) {
          // Make sure it's visible and clickable
          if (styles.display !== 'none' && styles.visibility !== 'hidden') {
            log('[Method 3] Found green element');
            return el;
          }
        }
      } catch(e) {}
    }

    // Method 4: Scan for buttons with "chest" or treasure icon (SVG)
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const html = btn.innerHTML?.toLowerCase() || '';
      const text = btn.textContent?.trim().toLowerCase() || '';

      // Check for treasure chest keywords
      if (html.includes('chest') || html.includes('treasure') || html.includes('coin')) {
        if (btn.querySelector('svg')) {
          log('[Method 4] Found treasure chest button');
          return btn;
        }
      }

      // Check for reward class names
      const classes = btn.className?.toLowerCase() || '';
      if (classes.includes('reward') && (classes.includes('btn') || classes.includes('button'))) {
        log('[Method 4] Found reward button via class');
        return btn;
      }
    }

    // Method 5: Look for buttons with text "Claim" (not Claimed)
    for (const btn of buttons) {
      const text = btn.textContent?.trim() || '';
      if (text.toLowerCase() === 'claim') {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          log('[Method 5] Found text=Claim button');
          return btn;
        }
      }
    }

    return null;
  }

  // Check if we should click (avoid double-clicking same reward)
  function shouldClick(el) {
    const now = Date.now();

    // Check cooldown
    if (now - lastClaimTime < CLAIM_COOLDOWN) {
      log('[Skip] Cooldown active');
      return false;
    }

    // Get unique identifier for this element
    const elId = el?.className + el?.textContent?.substring(0, 20);
    if (elId === lastClickedRewardId) {
      log('[Skip] Same element as last click');
      return false;
    }

    return true;
  }

  function tryClaim() {
    if (!isEnabled) return false;

    const btn = findClaimButton();
    if (!btn) return false;

    if (!shouldClick(btn)) return false;

    const text = btn.textContent?.trim().substring(0, 40) || 'unknown';
    log(`[Claim] Clicking: "${text}"`);

    const clicked = clickElement(btn);
    if (clicked) {
      lastClaimTime = Date.now();
      lastClickedRewardId = btn?.className + btn?.textContent?.substring(0, 20);
      claimedCount++;
      log(`[SUCCESS] Claimed reward #${claimedCount}`);
      browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});

      // Save to localStorage
      try {
        localStorage.setItem('twitchAutoClaimerCount', claimedCount);
      } catch(e) {}

      return true;
    }
    return false;
  }

  log('[Init] Twitch Auto Claimer v5 loaded');

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

  // Initial check after page load
  setTimeout(tryClaim, 3000);
  setInterval(tryClaim, 2500);

  log('[Ready] Watching for rewards...');
})();