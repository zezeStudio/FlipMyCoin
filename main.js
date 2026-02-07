import { initCoinFlip, triggerCoinFlip } from './coinFlip.js';
import { translations } from './translations.js';

let isFastModeEnabled = false; // Fast Mode 기본값은 off
let isAutoflipEnabled = (localStorage.getItem('isAutoflipEnabled') === 'true'); // Load from localStorage, ensures off by default
let autoflipIntervalId = null; // To store the interval ID
const autoflipIntervalDuration = 10000; // 10 seconds

export function getIsFastModeEnabled() {
    return isFastModeEnabled;
}

// Function to apply translations
const applyTranslations = (lang) => {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    // Update the title and meta description if present in translations
    if (translations[lang] && translations[lang]['title']) {
        document.title = translations[lang]['title'];
    }
    if (translations[lang] && translations[lang]['meta_description']) {
        document.querySelector('meta[name="description"]').setAttribute('content', translations[lang]['meta_description']);
    }
    document.documentElement.lang = lang; // Update HTML lang attribute
};


function setupFastModeToggle() {
    const fastModeToggleButton = document.getElementById('fast-mode-toggle');
    const fastModeToggleHandle = fastModeToggleButton.querySelector('.toggle-switch-handle');

    // Initial state setup
    // 이 부분에서 isFastModeEnabled가 이미 false로 초기화되었으므로 localStorage에 저장된 값을 덮어씁니다.
    if (isFastModeEnabled) { // 이 조건은 항상 false일 것이므로, 아래 else 블록이 실행됩니다.
        fastModeToggleButton.setAttribute('data-toggled', 'true');
    } else {
        fastModeToggleButton.setAttribute('data-toggled', 'false');
    }
    localStorage.setItem('isFastModeEnabled', isFastModeEnabled); // 초기 상태를 localStorage에 저장하여 off로 강제

    fastModeToggleButton.addEventListener('click', () => {
        isFastModeEnabled = !isFastModeEnabled;
        localStorage.setItem('isFastModeEnabled', isFastModeEnabled);

        if (isFastModeEnabled) {
            fastModeToggleButton.setAttribute('data-toggled', 'true');
        } else {
            fastModeToggleButton.setAttribute('data-toggled', 'false');
        }
        console.log('Fast Mode Enabled:', isFastModeEnabled);
    });
}

function setupAutoflipToggle() {
    const autoflipToggleButton = document.getElementById('autoflip-toggle');
    const autoflipToggleHandle = autoflipToggleButton.querySelector('.toggle-switch-handle');

    // Initial state setup
    if (isAutoflipEnabled) {
        autoflipToggleButton.setAttribute('data-toggled', 'true');
        autoflipIntervalId = setInterval(triggerCoinFlip, autoflipIntervalDuration);
    } else {
        autoflipToggleButton.setAttribute('data-toggled', 'false');
    }

    autoflipToggleButton.addEventListener('click', () => {
        isAutoflipEnabled = !isAutoflipEnabled;
        localStorage.setItem('isAutoflipEnabled', isAutoflipEnabled);

        if (isAutoflipEnabled) {
            autoflipToggleButton.setAttribute('data-toggled', 'true');
            autoflipIntervalId = setInterval(triggerCoinFlip, autoflipIntervalDuration);
        } else {
            autoflipToggleButton.setAttribute('data-toggled', 'false');
            clearInterval(autoflipIntervalId);
            autoflipIntervalId = null;
        }
        console.log('Autoflip Enabled:', isAutoflipEnabled);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize language
    const storedLang = localStorage.getItem('selectedLanguage') || 'en'; // Default to English
    const languageSelector = document.getElementById('language-selector');
    
    if (languageSelector) {
        languageSelector.value = storedLang;
        applyTranslations(storedLang);
    }

    // Handle language change
    if (languageSelector) {
        languageSelector.addEventListener('change', (event) => {
            const newLang = event.target.value;
            localStorage.setItem('selectedLanguage', newLang);
            applyTranslations(newLang);
        });
    }

    setupFastModeToggle();
    setupAutoflipToggle(); // Setup autoflip toggle
    initCoinFlip(getIsFastModeEnabled);

    const guideNavLink = document.getElementById('guide-nav-link');
    const guideModal = document.getElementById('guide-modal');
    const modalCloseButton = document.getElementById('modal-close-button');

    if (guideNavLink && guideModal) {
        guideNavLink.addEventListener('click', (event) => {
            event.preventDefault(); // 기본 링크 동작 방지
            guideModal.classList.remove('hidden');
        });
    }

    if (modalCloseButton && guideModal) {
        modalCloseButton.addEventListener('click', () => {
            guideModal.classList.add('hidden');
        });
    }
});