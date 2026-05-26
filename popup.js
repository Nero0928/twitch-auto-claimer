// Twitch Auto Claimer - Popup Script v17
// Per-channel stats display with i18n support

// Translations
const translations = {
  en: {
    tagline: 'Auto claim Twitch rewards',
    status_waiting: 'Waiting',
    status_active: 'Active',
    status_paused: 'Paused',
    toggle_title: 'Auto-claim',
    toggle_desc: 'Automatically click when reward appears',
    channel_stats_title: 'Channel Stats',
    no_channels: 'No claims yet',
    claims: 'claims',
    total: 'Total'
  },
  zh: {
    tagline: '懶人必備・自動領獎',
    status_waiting: '等待中',
    status_active: '監控中',
    status_paused: '已暫停',
    toggle_title: '自動領取',
    toggle_desc: '偵測到獎勵時自動點擊',
    channel_stats_title: '頻道統計',
    no_channels: '還沒有任何記錄',
    claims: '次',
    total: '總計'
  }
};

let currentLang = 'en';

function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('twitchAutoClaimerLang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  updateStatus(document.getElementById('toggleSwitch').checked);
  renderChannelList();
}

function updateStatus(enabled) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (enabled) {
    statusDot.classList.add('active');
    statusText.textContent = t('status_active');
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = t('status_paused');
  }
}

function getChannelData() {
  return new Promise((resolve) => {
    browser.runtime.sendMessage({ type: 'GET_DATA' }).then((response) => {
      resolve(response?.channelData || {});
    }).catch(() => resolve({}));
  });
}

function renderChannelList() {
  const channelList = document.getElementById('channelList');
  const totalCount = document.getElementById('totalCount');

  getChannelData().then((data) => {
    const channels = Object.keys(data);
    let total = 0;

    if (channels.length === 0) {
      channelList.innerHTML = `<div class="no-data" data-i18n="no_channels">${t('no_channels')}</div>`;
      totalCount.textContent = '0';
      return;
    }

    // Sort by count descending
    channels.sort((a, b) => (data[b].count || 0) - (data[a].count || 0));

    let html = '';
    channels.forEach((channel) => {
      const count = data[channel].count || 0;
      total += count;
      html += `
        <div class="channel-item">
          <span class="channel-name">${escapeHtml(channel)}</span>
          <span class="channel-count"><span>${count}</span> ${t('claims')}</span>
        </div>
      `;
    });

    channelList.innerHTML = html;
    totalCount.textContent = total;
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for storage changes from background (triggers when background updates channelData)
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.channelData) {
    renderChannelList();
  }
});

// Poll for updates every 2 seconds as backup (popup doesn't always receive storage changes)
setInterval(renderChannelList, 2000);

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleSwitch');
  const langBtns = document.querySelectorAll('.lang-btn');

  // Load saved language
  const savedLang = localStorage.getItem('twitchAutoClaimerLang');
  if (savedLang && translations[savedLang]) {
    setLanguage(savedLang);
  }

  // Load saved enabled state
  const savedEnabled = localStorage.getItem('twitchAutoClaimerEnabled');
  if (savedEnabled !== null) {
    toggle.checked = savedEnabled === 'true';
  }
  updateStatus(toggle.checked);

  // Render channel list
  renderChannelList();

  // Language toggle
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang'));
    });
  });

  // Toggle handler
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    localStorage.setItem('twitchAutoClaimerEnabled', String(enabled));
    updateStatus(enabled);

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE',
          enabled: enabled
        }).catch(() => {});
      }
    });
  });
});
