// Twitch Auto Claimer - Content Script v8
// Cross-tab coordination via BroadcastChannel API

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let claimedCount = 0;
  let lastClaimTime = 0;
  const CLAIM_COOLDOWN = 5000;
  const CHANNEL_NAME = 'twitch-auto-claimer-sync';

  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  // BroadcastChannel for cross-tab communication
  let channel;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      const { type, channelId, rewardId, timestamp } = event.data;
      if (type === 'CLAIMED' && channelId !== getChannelId()) {
        log(`[Sync] Another tab claimed this reward, skipping`);
      }
    };
  } catch(e) {
    log('[Sync] BroadcastChannel not supported');
  }

  // Generate unique ID for this tab
  function getChannelId() {
    return Math.random().toString(36).substring(2, 10);
  }
  const myChannelId = getChannelId();

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
    } else if (message.type === 'GET_STATUS') {
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
    // Primary selector: aria-label
    const byAria = document.querySelector('[aria-label="領取額外獎勵"]');
    if (byAria) {
      log('[Found] aria-label="領取額外獎勵"');
      return byAria;
    }

    // Fallback: class name
    const byClass = document.querySelector('.claimable-bonus__icon');
    if (byClass) {
      log('[Found] .claimable-bonus__icon');
      return byClass;
    }

    // Generic claimable
    const claimable = document.querySelector('[class*="claimable"]');
    if (claimable) {
      log('[Found] [class*="claimable"]');
      return claimable;
    }

    return null;
  }

  // Generate reward ID from button attributes (for dedup across tabs)
  function getRewardId(btn) {
    const attrs = [
      btn.getAttribute('aria-label') || '',
      btn.getAttribute('data-a-target') || '',
      btn.className || ''
    ].join('|');
    return attrs.substring(0, 50);
  }

  let lastRewardId = null;

  function tryClaim() {
    if (!isEnabled) return false;
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const btn = findClaimButton();
    if (!btn) return false;

    // Check visibility
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // Check if we already claimed this specific reward in another tab
    const rewardId = getRewardId(btn);
    if (rewardId === lastRewardId) {
      log('[Skip] Same reward as last claim');
      return false;
    }

    log(`[Claim] Clicking reward`);
    const clicked = clickElement(btn);
    if (clicked) {
      lastClaimTime = now;
      lastRewardId = rewardId;
      claimedCount++;
      log(`[SUCCESS] Claimed reward #${claimedCount}`);

      // Broadcast to other tabs
      if (channel) {
        channel.postMessage({
          type: 'CLAIMED',
          channelId: myChannelId,
          rewardId: rewardId,
          timestamp: now
        });
      }

      browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});
      try { localStorage.setItem('twitchAutoClaimerCount', claimedCount); } catch(e) {}
      return true;
    }
    return false;
  }

  log('[Init] Twitch Auto Claimer v8 loaded (tab:', myChannelId, ')');

  // Main observer
  const observer = new MutationObserver(() => {
    if (isEnabled) tryClaim();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Periodic check
  setTimeout(tryClaim, 2000);
  setInterval(tryClaim, 2000);

  document.addEventListener('click', () => setTimeout(tryClaim, 100), true);

  log('[Ready] Watching for rewards...');
})();