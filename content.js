// Twitch Auto Claimer - Content Script v14
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

  // BroadcastChannel for cross-tab coordination (content ↔ content)
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

  // BroadcastChannel for popup sync (content → popup UI updates)
  const POPUP_SYNC_CHANNEL = 'twitch-auto-claimer-popup-sync';
  let popupSyncChannel;
  try {
    popupSyncChannel = new BroadcastChannel(POPUP_SYNC_CHANNEL);
  } catch(e) {
    log('[PopupSync] BroadcastChannel not supported');
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
    } else if (message.type === 'RESET_COUNT') {
      claimedCount = 0;
      lastRewardId = null;
      try { localStorage.setItem('twitchAutoClaimerCount', '0'); } catch(e) {}
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
  let claimedThisSession = false; // Track if we just claimed this specific button

  function tryClaim() {
    if (!isEnabled) return false;
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const btn = findClaimButton();
    if (!btn) {
      // No claim button visible — clear the claimed-this-session flag so next reward doesn't get skipped
      claimedThisSession = false;
      return false;
    }

    // Check visibility
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      claimedThisSession = false;
      return false;
    }

    // Generate reward ID from button attributes
    const rewardId = getRewardId(btn);

    // Skip if we just claimed THIS specific button (don't skip different reward IDs)
    if (claimedThisSession && rewardId === lastRewardId) {
      log('[Skip] Same specific button as last claim (still on page)');
      return false;
    }

    log(`[Claim] Clicking reward`);
    const clicked = clickElement(btn);
    if (clicked) {
      lastClaimTime = now;
      lastRewardId = rewardId;
      claimedThisSession = true; // We just claimed this specific button
      claimedCount++;
      log(`[SUCCESS] Claimed reward #${claimedCount}`);

      // Broadcast to other tabs (content ↔ content)
      if (channel) {
        channel.postMessage({
          type: 'CLAIMED',
          channelId: myChannelId,
          rewardId: rewardId,
          timestamp: now
        });
      }

      // Broadcast to popup via BroadcastChannel for real-time UI update
      if (popupSyncChannel) {
        log('[PopupSync] Posting CLAIM message, count:', claimedCount);
        popupSyncChannel.postMessage({ type: 'CLAIM', count: claimedCount });
      }

      // Also send to background service worker (more reliable popup ↔ content bridge)
      browser.runtime.sendMessage({ type: 'CLAIM', count: claimedCount }).then(() => {
        log('[BG] Count update sent to background');
      }).catch(() => {
        log('[BG] Failed to send to background');
      });

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