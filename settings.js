// Twitch Auto Claimer - Settings Page Script

const translations = {
  en: {
    tagline: 'Settings & About',
    about_text: 'Twitch Auto Claimer automatically claims channel point rewards when they appear. Supports per-channel tracking with beautiful dark theme.',
    how_text: '1. Install the extension\n2. Make sure Auto-claim is enabled\n3. Visit Twitch channels\n4. Rewards are claimed automatically!',
    privacy_text: 'This extension does not collect any personal data. All data is stored locally in your browser. No tracking, no analytics, no servers.',
    back_btn: '← Back to popup'
  },
  zh: {
    tagline: '設定與說明',
    about_text: 'Twitch Auto Claimer 自動領取 Twitch 頻道點數獎勵，支援每頻道獨立統計，深色狐狸主題。',
    how_text: '1. 安裝擴充功能\n2. 確保自動領取已開啟\n3. 造訪 Twitch 頻道\n4. 獎勵會自動領取！',
    privacy_text: '此擴充功能不會收集任何個人資料。所有資料都儲存在瀏覽器本地，無追蹤、無分析、無伺服器。',
    back_btn: '← 返回'
  }
};

let currentLang = 'en';

function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('twitchAutoClaimerLang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.querySelector('.tagline').textContent = t('tagline');
  document.getElementById('aboutText').textContent = t('about_text');
  document.getElementById('aboutText').style.display = lang === 'en' ? 'block' : 'none';
  document.getElementById('aboutTextZh').style.display = lang === 'zh' ? 'block' : 'none';
  document.getElementById('howText').innerHTML = t('how_text').replace(/\n/g, '<br>');
  document.getElementById('howTextZh').style.display = lang === 'zh' ? 'block' : 'none';
  document.getElementById('howText').style.display = lang === 'en' ? 'block' : 'none';
  document.getElementById('privacyText').style.display = lang === 'en' ? 'block' : 'none';
  document.getElementById('privacyTextZh').style.display = lang === 'zh' ? 'block' : 'none';
  document.getElementById('backBtn').textContent = t('back_btn');
}

document.addEventListener('DOMContentLoaded', () => {
  // Load saved language
  const savedLang = localStorage.getItem('twitchAutoClaimerLang') || 'en';
  setLanguage(savedLang);

  // Language toggle
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang'));
    });
  });

  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
  });
});