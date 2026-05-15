// Twitch Auto Claimer - Content Script
// Monitors the DOM for channel points reward notifications and auto-claims them

(function() {
  console.log('[Twitch Auto Claimer] Extension loaded');

  let isEnabled = true;
  let claimedCount = 0;

  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE') {
      isEnabled = message.enabled;
      console.log(`[Twitch Auto Claimer] ${isEnabled ? 'Enabled' : 'Disabled'}`);
    } else if (message.type === 'GET_STATUS') {
      browser.runtime.sendMessage({
        type: 'STATUS',
        enabled: isEnabled,
        claimed: claimedCount
      });
    }
  });

  // Find and click the claim button
  function tryClaimReward() {
    if (!isEnabled) return;

    // Twitch renders reward toasts with these patterns
    // The claim button typically has these characteristics
    const claimButtons = document.querySelectorAll('button');

    for (const button of claimButtons) {
      const text = button.textContent?.trim().toLowerCase() || '';
      const rect = button.getBoundingClientRect();

      // Check if button is visible and is a "claim" button
      if (rect.width > 0 && rect.height > 0) {
        // Look for claim-related text content
        if (text.includes('claim') && !text.includes('claimed')) {
          button.click();
          claimedCount++;
          console.log(`[Twitch Auto Claimer] Claimed reward #${claimedCount}`);
          notifyBackground();
          return true;
        }
      }
    }

    return false;
  }

  // Notify background script of claim
  function notifyBackground() {
    browser.runtime.sendMessage({
      type: 'CLAIMED',
      count: claimedCount
    }).catch(() => {});
  }

  // Use MutationObserver to detect new reward toasts
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check for new reward notification elements
        // Twitch often shows these as floating notifications
        for (const node of mutation.adddNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;

            // Look for the specific reward notification container
            if (element.querySelector) {
              const claimBtn = element.querySelector(
                'button[data-a-target="claim-button"], ' +
                'button[class*="claim"], ' +
                '[class*="reward-notification"] button'
              );

              if (claimBtn && claimBtn.textContent?.trim().toLowerCase().includes('claim')) {
                claimBtn.click();
                claimedCount++;
                console.log(`[Twitch Auto Claimer] Claimed via observer #${claimedCount}`);
                notifyBackground();
                return;
              }
            }
          }
        }
      }
    }

    // Fallback: also try clicking any visible claim buttons we find
    tryClaimReward();
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial scan after page load
  setTimeout(() => {
    console.log('[Twitch Auto Claimer] Running initial scan');
    tryClaimReward();
  }, 2000);

  // Periodic scan as backup
  setInterval(tryClaimReward, 3000);
})();