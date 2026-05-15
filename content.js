// Twitch Auto Claimer - Content Script v6
// Handles iframes and shadow DOMs for Twitch's UI

(function() {
  const DEBUG = true;
  let isEnabled = true;
  let claimedCount = 0;
  let lastClaimTime = 0;
  const CLAIM_COOLDOWN = 6000;

  function log(...args) {
    if (DEBUG) console.log('[Twitch Auto Claimer]', ...args);
  }

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') isEnabled = message.enabled;
    else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({ type: 'STATUS', enabled: isEnabled, claimed: claimedCount });
    }
  });

  // Click with full event sequence
  function clickElement(el) {
    if (!el) return false;
    if (el.hasAttribute('disabled')) el.removeAttribute('disabled');
    el.classList.remove('disabled');
    try { el.focus(); } catch(e) {}

    try {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      ['mousedown', 'mouseup', 'click'].forEach(type => {
        el.dispatchEvent(new MouseEvent(type, {
          bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy
        }));
      });
      log('[Click] Multi-event sent');
      return true;
    } catch(e) {
      try { el.click(); return true; } catch(e2) { return false; }
    }
  }

  // Find all claimable buttons across main document, iframes, and shadow DOMs
  function findAllClaimButtons() {
    const results = [];

    // Helper: scan a container for claim buttons
    function scanContainer(container, label) {
      if (!container) return;

      // Scan buttons
      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        const text = (btn.textContent || '').trim();
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const dataAttr = btn.getAttribute?.('data-a-target') || '';
          const classes = (btn.className || '').toLowerCase();
          const html = (btn.innerHTML || '').toLowerCase();

          // Check if this looks like a reward button
          const isClaim = text.toLowerCase() === 'claim' ||
                         text.toLowerCase().includes('領取') ||
                         dataAttr.includes('claim') ||
                         classes.includes('reward') ||
                         html.includes('chest') || html.includes('treasure');

          if (isClaim) {
            results.push({ el: btn, text, label });
            log(`[Found] ${label}: "${text.substring(0, 30)}" class:${classes.substring(0, 40)}`);
          }
        }
      });

      // Scan elements with green background (Twitch reward green)
      const allEls = container.querySelectorAll('div, span, button');
      allEls.forEach(el => {
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width < 20 || rect.height < 20) return;
          if (rect.width > 400 || rect.height > 150) return;

          const styles = window.getComputedStyle(el);
          const bg = styles.backgroundColor;
          // Twitch green: rgb(57, 191, 57)
          if (bg.includes('57') && bg.includes('191') && bg.includes('57') && !bg.includes('0, 0')) {
            const text = (el.textContent || '').trim();
            const classes = (el.className || '').toLowerCase();
            if (!results.some(r => r.el === el)) {
              results.push({ el, text, label: label + ' [GREEN]' });
              log(`[Found] ${label} [GREEN]: "${text.substring(0, 30)}"`);
            }
          }
        } catch(e) {}
      });
    }

    // Main document
    scanContainer(document, 'MainDoc');

    // All iframes
    const iframes = document.querySelectorAll('iframe');
    log(`[Scan] Found ${iframes.length} iframes`);
    iframes.forEach((iframe, idx) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          scanContainer(iframeDoc, `iframe[${idx}]`);
        }
      } catch(e) {
        // Cross-origin iframe, can't access
      }
    });

    // Shadow DOMs (Twitch uses these for some components)
    const shadowHosts = document.querySelectorAll('*');
    shadowHosts.forEach((host, idx) => {
      if (host.shadowRoot) {
        scanContainer(host.shadowRoot, `shadow[${idx}]`);
      }
    });

    return results;
  }

  function tryClaim() {
    if (!isEnabled) return false;
    const now = Date.now();
    if (now - lastClaimTime < CLAIM_COOLDOWN) return false;

    const buttons = findAllClaimButtons();
    if (buttons.length > 0) {
      const first = buttons[0];
      const text = first.text.substring(0, 40) || 'unknown';
      log(`[Claim] Clicking: "${text}"`);
      const clicked = clickElement(first.el);
      if (clicked) {
        lastClaimTime = now;
        claimedCount++;
        log(`[SUCCESS] Claimed reward #${claimedCount}`);
        browser.runtime.sendMessage({ type: 'CLAIMED', count: claimedCount }).catch(() => {});
        try { localStorage.setItem('twitchAutoClaimerCount', claimedCount); } catch(e) {}
        return true;
      }
    } else {
      // Debug: show what buttons exist
      const allBtns = document.querySelectorAll('button');
      if (allBtns.length > 0 && Math.random() < 0.1) { // Log occasionally to avoid spam
        log(`[Debug] ${allBtns.length} buttons on page, none claimable`);
        allBtns.forEach(btn => {
          const text = (btn.textContent || '').trim().substring(0, 20);
          if (text) log(`  button: "${text}"`);
        });
      }
    }
    return false;
  }

  log('[Init] Twitch Auto Claimer v6 loaded');

  // Watch main document
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    tryClaim();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Watch for new iframes
  const iframeObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes?.forEach(node => {
        if (node.tagName === 'IFRAME') {
          log('[Iframe] New iframe detected');
          setTimeout(tryClaim, 1000); // Wait for iframe to load
        }
      });
    });
  });
  iframeObserver.observe(document.documentElement, { childList: true, subtree: true });

  // Periodic scan
  setTimeout(tryClaim, 3000);
  setInterval(tryClaim, 2500);

  log('[Ready] Watching for rewards...');
})();