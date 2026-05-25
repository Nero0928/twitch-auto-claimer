// Twitch Auto Claimer - Background Service Worker (v14)
// Acts as message hub between content script and popup

let currentCount = 0;

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLAIM') {
    currentCount = message.count;
    // Acknowledge to content script
    sendResponse({ received: true });
  } else if (message.type === 'GET_COUNT') {
    // Respond with current count to popup
    sendResponse({ count: currentCount });
  } else if (message.type === 'RESET_COUNT') {
    currentCount = 0;
    sendResponse({ received: true });
  }
});

// Also handle BroadcastChannel messages from content script (fallback for same-context)
const SYNC_CHANNEL = 'twitch-auto-claimer-popup-sync';
try {
  const syncChannel = new BroadcastChannel(SYNC_CHANNEL);
  syncChannel.onmessage = (event) => {
    if (event.data.type === 'CLAIM') {
      currentCount = event.data.count;
    } else if (event.data.type === 'RESET') {
      currentCount = 0;
    }
  };
} catch(e) {
  // BroadcastChannel not supported in service worker context
}