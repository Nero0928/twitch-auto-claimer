// Twitch Auto Claimer - Content Script v17
// Per-channel claim tracking

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let lastClaimTime = 0;
  const CLAIM_COOLDOWN = 5000;
  const CHANNEL_SYNC_CHANNEL = 'twitch-auto-claimer-sync';

  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  function getChannelName() {
    const match = window.location.pathname.match(/^\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : 'unknown';
  }

  let channel;
  try {
    channel = new BroadcastChannel(CHANNEL_SYNC_CHANNEL);
    channel.onmessage = (event) => {
      const { type, channelId, rewardId } = event.data;
      if (type === 'CLAIMED' && channelId !== myChannelId) {
        log(`[Sync] Another tab claimed this reward, skipping`);
      }
    };
  } catch(e) {
    log('[Sync] BroadcastChannel not supported');
  }

  function getChannelId() {
    return Math.random().toString(36).substring(2, 10);
  }
  const myChannelId = getChannelId();

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
    } else if (message.type === 'RESET_COUNT') {
      // Report reset to background
      browser.runtime.sendMessage({
        type: 'RESET_CHANNEL',
        channelName: getChannelName()
      }).catch(() => {});
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

  function findClaimButton() {
    const byAria = document.querySelector('[aria-label="領取額外獎勵"]');
    if (byAria) {
      log('[Found] aria-label="領取額外獎勵"');
      return byAria;
    }

    const byClass = document.querySelector('.claimable-bonus__icon');
    if (byClass) {
      log('[Found] .claimable-bonus__icon');
      return byClass;
    }

    const claimable = document.querySelector('[class*="claimable"]');
    if (claimable) {
      log('[Found] [class*="claimable"]');
      return claimable;
    }

    return null;
  }

  function getRewardId(btn) {
    const attrs = [
      btn.getAttribute('aria-label') || '',
      btn.getAttribute('data-a-target') || '',
      btn.className || ''
    ].join('|');
    return attrs.substring(0, 50);
  }

  let lastRewardId = null;
  let claimedThisSession = false;

  function tryClaim() {
    if (!isEnabled) return false;
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const btn = findClaimButton();
    if (!btn) {
      claimedThisSession = false;
      return false;
    }

    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      claimedThisSession = false;
      return false;
    }

    const rewardId = getRewardId(btn);

    if (claimedThisSession && rewardId === lastRewardId) {
      log('[Skip] Same specific button as last claim (still on page)');
      return false;
    }

    const channelName = getChannelName();
    log(`[Claim] Clicking reward on ${channelName}`);
    const clicked = clickElement(btn);
    if (clicked) {
      lastClaimTime = now;
      lastRewardId = rewardId;
      claimedThisSession = true;

      // Sync with other tabs
      if (channel) {
        channel.postMessage({
          type: 'CLAIMED',
          channelId: myChannelId,
          rewardId: rewardId,
          timestamp: now,
          channelName: channelName
        });
      }

      // Report to background for storage and per-channel tracking
      browser.runtime.sendMessage({
        type: 'CLAIM',
        channelName: channelName
      }).then(() => {
        log('[BG] Claim reported to background');
      }).catch(() => {
        log('[BG] Failed to report claim');
      });

      return true;
    }
    return false;
  }

  log(`[Init] Twitch Auto Claimer loaded (tab: ${myChannelId})`);

  const observer = new MutationObserver(() => {
    if (isEnabled) tryClaim();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(tryClaim, 2000);
  setInterval(tryClaim, 2000);

  document.addEventListener('click', () => setTimeout(tryClaim, 100), true);

  log('[Ready] Watching for rewards...');
})();
