// Twitch Auto Claimer - Popup Script v17
// Bilingual support (EN/ZH) by 狐狐 🦊

const translations = {
  en: {
    tagline: 'Auto claim Twitch rewards',
    'status.waiting': 'Waiting',
    'status.active': 'Active',
    'status.paused': 'Paused',
    'toggle.title': 'Auto-claim',
    'toggle.desc': 'Automatically click when reward appears',
    'info.title': 'Tip',
    'info.text': 'Turn on the switch and rewards will be claimed automatically when they appear.'
  },
  zh: {
    tagline: '懶人必備・自動領獎',
    'status.waiting': '等待中',
    'status.active': '監控中',
    'status.paused': '已暫停',
    'toggle.title': '自動領取',
    'toggle.desc': '偵測到獎勵時自動點擊',
    'info.title': '使用提示',
    'info.text': '開啟開關後，獎勵按鈕出現時會自動點擊領取。懶人必備！'
  }
};

let currentLang = 'en';

function t(key) {
  return translations[currentLang][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('twitchAutoClaimerLang', lang);

  // Update all i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // Update language button states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update status text
  updateStatus(document.getElementById('toggleSwitch').checked);
}

function updateStatus(enabled) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (enabled) {
    statusDot.classList.add('active');
    statusText.textContent = t('status.active');
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = t('status.paused');
  }
}

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

  // Language toggle handlers
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  // Toggle handler
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    localStorage.setItem('twitchAutoClaimerEnabled', String(enabled));
    updateStatus(enabled);

    // Notify content script
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
