// Twitch Auto Claimer - Content Script v2 (Debug Version)
// Monitors the DOM for channel points reward notifications and auto-claims them

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let claimedCount = 0;
  let lastClaimTime = 0;
  const CLAIM_COOLDOWN = 5000; // 5秒內不重複點擊

  // Logging helper
  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  // Store found buttons for debugging
  let observedButtons = new Set();

  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
      log(`Extension ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
    } else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({
        type: 'STATUS',
        enabled: isEnabled,
        claimed: claimedCount
      });
    }
  });

  // Find all buttons on page and log them
  function scanAllButtons() {
    const buttons = document.querySelectorAll('button');
    const found = [];

    buttons.forEach((btn, idx) => {
      const text = btn.textContent?.trim() || '';
      const rect = btn.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;

      if (text.length > 0 && text.length < 100) {
        found.push({
          idx,
          text: text.substring(0, 50),
          visible: isVisible,
          classes: btn.className?.substring(0, 80) || ''
        });
      }
    });

    log(`[Scan] Found ${found.length} buttons with text:`);
    found.slice(0, 10).forEach(b => {
      log(`  Button[${b.idx}]: "${b.text}" | visible:${b.visible} | class:${b.classes}`);
    });

    return found;
  }

  // Try multiple strategies to find claim button
  function findClaimButton() {
    const strategies = [
      // Strategy 1: Look for buttons with "claim" text
      () => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const text = btn.textContent?.trim().toLowerCase() || '';
          if (text.includes('claim') && !text.includes('claimed')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return btn;
            }
          }
        }
        return null;
      },

      // Strategy 2: Look for data-a-target attributes
      () => {
        const el = document.querySelector('[data-a-target="claim-button"]');
        if (el) {
          log('[Strategy 2] Found data-a-target="claim-button"');
          return el;
        }
        // Also try variations
        const variants = ['claim', 'claim-reward', 'channel-points-claim'];
        for (const v of variants) {
          const found = document.querySelector(`[data-a-target*="${v}"]`);
          if (found) {
            log(`[Strategy 2] Found data-a-target containing "${v}":`, found);
            return found;
          }
        }
        return null;
      },

      // Strategy 3: Look for common reward notification classes
      () => {
        const selectors = [
          '[class*="reward-notification"] button',
          '[class*="channel-points"] button',
          '[class*="claim-reward"]',
          '[class*="toast"] button',
          '[class*="bubble"] button',
          '[class*="notification"] button'
        ];

        for (const sel of selectors) {
          try {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
              const text = el.textContent?.trim().toLowerCase() || '';
              if (text.includes('claim') && !text.includes('claimed')) {
                log(`[Strategy 3] Found via "${sel}":`, el);
                return el;
              }
            }
          } catch(e) {}
        }
        return null;
      },

      // Strategy 4: Look for buttons near coin/points icons
      () => {
        const coinSelectors = [
          '[class*="coin"]',
          '[class*="point"]',
          '[class*="drop"]',
          '[data-icon*="coin"]'
        ];

        for (const sel of coinSelectors) {
          const coins = document.querySelectorAll(sel);
          for (const coin of coins) {
            // Look for sibling or parent button
            const parent = coin.closest('button') || coin.parentElement?.querySelector('button');
            if (parent) {
              const text = parent.textContent?.trim().toLowerCase() || '';
              if (text.includes('claim')) {
                log(`[Strategy 4] Found claim button near coin icon`);
                return parent;
              }
            }
          }
        }
        return null;
      },

      // Strategy 5: Check for elements with specific colors (Twitch purple buttons)
      () => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          const styles = window.getComputedStyle(btn);
          const bg = styles.backgroundColor;
          // Twitch's claim button is often purple
          if (bg.includes('128)')) { // rgba purple-ish
            const text = btn.textContent?.trim().toLowerCase() || '';
            if (text.includes('claim')) {
              log('[Strategy 5] Found purple claim button');
              return btn;
            }
          }
        }
        return null;
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      try {
        const btn = strategies[i]();
        if (btn) {
          log(`[Found] Strategy ${i + 1} succeeded`);
          return btn;
        }
      } catch(e) {
        log(`[Error] Strategy ${i + 1} failed:`, e);
      }
    }

    return null;
  }

  // Attempt to claim
  function tryClaim() {
    if (!isEnabled) return false;

    // Check cooldown
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) {
      log('[Cooldown] Skipping, too soon since last claim');
      return false;
    }

    const btn = findClaimButton();
    if (btn) {
      log('[CLAIM] Clicking button:', btn.textContent?.trim());
      btn.click();
      lastClaimTime = now;
      claimedCount++;
      log(`[SUCCESS] Claimed reward #${claimedCount}`);

      // Notify background
      browser.runtime.sendMessage({
        type: 'CLAIMED',
        count: claimedCount
      }).catch(() => {});

      return true;
    }

    return false;
  }

  // Also scan for any visible claim buttons periodically
  function periodicScan() {
    if (!isEnabled) return;

    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const key = btn.outerHTML?.substring(0, 100) || Math.random();
      if (!observedButtons.has(key)) {
        observedButtons.add(key);
        const text = btn.textContent?.trim().toLowerCase() || '';
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && text.includes('claim') && !text.includes('claimed')) {
          log('[New Button] Found new claim button:', text);
          btn.click();
          lastClaimTime = Date.now();
          claimedCount++;
          browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});
        }
      }
    }
  }

  // Main observer
  log('[Init] Starting Twitch Auto Claimer v2');
  log('[Init] Watching for reward notifications...');

  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            tryClaim();
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial scan after load
  setTimeout(() => {
    log('[Init] Running initial button scan...');
    scanAllButtons();
    tryClaim();
  }, 3000);

  // Periodic scans as backup
  setInterval(() => {
    periodicScan();
  }, 2000);

  // Also scan on any click
  document.addEventListener('click', () => {
    setTimeout(tryClaim, 100);
  }, true);

  log('[Ready] Extension loaded and watching');
})();