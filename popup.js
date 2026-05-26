// Twitch Auto Claimer - Popup Script v18
// Direct storage reading (like reference project)

const STORAGE_KEY = 'twitchAutoClaimerChannelData';

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
    clear: 'Clear',
    clear_all: 'Clear All',
    channel: 'Channel',
    claimed_count: 'Claimed',
    clear_record: 'Action',
    total: 'Total',
    points: 'pts',
    donate_title: 'Support Development'
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
    clear: '清除',
    clear_all: '清除全部',
    channel: '頻道',
    claimed_count: '領取次數',
    clear_record: '操作',
    total: '總計',
    points: '點',
    donate_title: '支持開發'
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

  renderStats();
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

function renderStats() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const data = result[STORAGE_KEY] || {};
    const channelList = document.getElementById('channelList');
    const totalCount = document.getElementById('totalCount');

    const channels = Object.keys(data);

    if (channels.length === 0) {
      channelList.innerHTML = `<div class="no-data" data-i18n="no_channels">${t('no_channels')}</div>`;
      totalCount.textContent = '0';
      return;
    }

    // Calculate total
    let total = 0;
    channels.forEach(ch => total += data[ch]);

    // Sort by count descending
    channels.sort((a, b) => data[b] - data[a]);

    let html = '';
    channels.forEach((channel) => {
      const count = data[channel];
      const points = count * 50;
      html += `
        <div class="channel-item">
          <div class="channel-info">
            <a class="channel-name" href="https://www.twitch.tv/${channel}" target="_blank">${escapeHtml(channel)}</a>
            <span class="channel-points">${points} ${t('points')}</span>
          </div>
          <div class="channel-actions">
            <span class="channel-count"><span>${count}</span> ${t('claims')}</span>
            <button class="btn-clear" data-channel="${escapeHtml(channel)}">${t('clear')}</button>
          </div>
        </div>
      `;
    });

    channelList.innerHTML = html;
    totalCount.textContent = total;

    // Attach clear handlers
    channelList.querySelectorAll('.btn-clear').forEach(btn => {
      btn.addEventListener('click', () => {
        const ch = btn.getAttribute('data-channel');
        chrome.storage.local.get(STORAGE_KEY, (result) => {
          const data = result[STORAGE_KEY] || {};
          delete data[ch];
          chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
            renderStats();
          });
        });
      });
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    renderStats();
  }
});

// Poll as backup (popup might not receive storage changes reliably)
setInterval(renderStats, 2000);

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

  // Render stats
  renderStats();

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

    browser.runtime.sendMessage({
      type: 'TOGGLE',
      enabled: enabled
    }).catch(() => {});
  });

  // Clear all button
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      chrome.storage.local.remove(STORAGE_KEY, () => {
        renderStats();
      });
    });
  }
});
