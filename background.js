// Twitch Auto Claimer - Background Service Worker v18
// Simplified - only handles toggle messages from popup

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE') {
    // Forward toggle to the active tab
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE',
          enabled: message.enabled
        }).catch(() => {});
      }
    });
    sendResponse({ received: true });
  }
});
