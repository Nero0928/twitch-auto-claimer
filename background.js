// Twitch Auto Claimer - Background Service Worker v17
// Per-channel claim tracking hub

let channelData = {};

function saveData() {
  browser.storage.local.set({ channelData: channelData });
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLAIM') {
    const { channelName } = message;
    if (channelName) {
      if (!channelData[channelName]) {
        channelData[channelName] = { count: 0, lastClaim: null };
      }
      channelData[channelName].count++;
      channelData[channelName].lastClaim = Date.now();
      saveData();
      log(`[BG] ${channelName}: ${channelData[channelName].count} claims`);
    }
    sendResponse({ received: true });
  } else if (message.type === 'GET_DATA') {
    sendResponse({ channelData: channelData });
  } else if (message.type === 'RESET_CHANNEL') {
    const { channelName } = message;
    if (channelName && channelData[channelName]) {
      channelData[channelName] = { count: 0, lastClaim: null };
      saveData();
    }
    sendResponse({ received: true });
  } else if (message.type === 'RESET_ALL') {
    channelData = {};
    saveData();
    sendResponse({ received: true });
  }
  return true;
});

function log(...args) {
  console.log('[Twitch Auto Claimer BG]', ...args);
}

// Load initial data from storage
browser.storage.local.get('channelData').then((result) => {
  if (result.channelData) {
    channelData = result.channelData;
    const total = Object.values(channelData).reduce((sum, ch) => sum + (ch.count || 0), 0);
    log(`[Init] Loaded data: ${Object.keys(channelData).length} channels, ${total} total claims`);
  }
}).catch((err) => {
  log('[Init] Failed to load data:', err);
});
