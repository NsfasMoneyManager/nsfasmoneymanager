// IMAGE URLS — replace with your own, blank = fallback SVG
const IMAGE_URLS = {
    hero:"", community:"", wallet:"", budget:"", expenses:"", savings:"",
    analytics:"", aiAssistant:"", savingTips:"", budgetingTips:"", groceriesTips:"",
    transportTips:"", discountsTips:"", emergencyFundTips:"", login:"", signup:""
};

const FALLBACK_SVGS = {
    hero:`<svg viewBox="0 0 500 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e8f0fe"/><stop offset="100%" stop-color="#e6f7ed"/></linearGradient></defs><rect width="500" height="600" fill="url(#hg)"/><circle cx="250" cy="300" r="200" fill="#fff" opacity="0.4"/><rect x="170" y="140" width="160" height="320" rx="26" fill="#0A4DA2"/><rect x="180" y="152" width="140" height="296" rx="20" fill="#fff"/><text x="200" y="190" font-family="Poppins,sans-serif" font-size="12" font-weight="700" fill="#6B7280">BALANCE</text><text x="200" y="220" font-family="Montserrat,sans-serif" font-size="26" font-weight="800" fill="#0A4DA2">R 0.00</text><rect x="200" y="240" width="100" height="60" rx="10" fill="#e6f7ed"/><text x="212" y="262" font-family="Inter,sans-serif" font-size="10" fill="#15803D">INCOME</text><text x="212" y="285" font-family="Montserrat,sans-serif" font-size="18" font-weight="800" fill="#16A34A">R 0.00</text><rect x="200" y="312" width="100" height="60" rx="10" fill="#fee2e2"/><text x="212" y="334" font-family="Inter,sans-serif" font-size="10" fill="#991b1b">EXPENSE</text><text x="212" y="357" font-family="Montserrat,sans-serif" font-size="18" font-weight="800" fill="#EF4444">R 0.00</text><circle cx="360" cy="200" r="26" fill="#F59E0B"/><text x="360" y="210" font-family="Montserrat,sans-serif" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">R</text></svg>`,
    community:`<svg viewBox="0 0 600 400"><rect width="600" height="400" fill="#e8f0fe"/><circle cx="300" cy="200" r="180" fill="#fff" opacity="0.35"/><circle cx="180" cy="170" r="34" fill="#f4c7a3"/><circle cx="300" cy="160" r="36" fill="#d6a679"/><circle cx="420" cy="170" r="34" fill="#a06b3d"/><path d="M130 290 Q130 230 180 230 Q230 230 230 290 Z" fill="#16A34A"/><path d="M245 290 Q245 220 300 220 Q355 220 355 290 Z" fill="#0A4DA2"/><path d="M370 290 Q370 230 420 230 Q470 230 470 290 Z" fill="#F59E0B"/><rect x="60" y="290" width="480" height="14" rx="6" fill="#0A4DA2" opacity="0.85"/></svg>`,
    wallet:`<svg viewBox="0 0 120 80"><rect x="12" y="16" width="96" height="56" rx="10" fill="#0A4DA2"/><rect x="12" y="26" width="96" height="10" fill="#083B7A"/><circle cx="90" cy="46" r="9" fill="#F59E0B"/></svg>`,
    budget:`<svg viewBox="0 0 120 80"><rect x="20" y="12" width="80" height="56" rx="8" fill="#16A34A"/><rect x="30" y="24" width="40" height="6" rx="3" fill="#fff"/><circle cx="86" cy="22" r="10" fill="#F59E0B"/></svg>`,
    expenses:`<svg viewBox="0 0 120 80"><rect x="26" y="10" width="68" height="60" rx="8" fill="#0A4DA2"/><rect x="36" y="22" width="48" height="5" rx="2.5" fill="#fff"/><rect x="36" y="34" width="34" height="5" rx="2.5" fill="#fff" opacity="0.6"/><rect x="36" y="46" width="44" height="5" rx="2.5" fill="#fff" opacity="0.6"/></svg>`,
    savings:`<svg viewBox="0 0 120 80"><path d="M30 40 h60 v26 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 Z" fill="#16A34A"/><rect x="26" y="30" width="68" height="12" rx="6" fill="#0A4DA2"/><circle cx="60" cy="20" r="9" fill="#F59E0B"/></svg>`,
    analytics:`<svg viewBox="0 0 120 80"><rect x="22" y="46" width="14" height="24" rx="3" fill="#0A4DA2"/><rect x="44" y="32" width="14" height="38" rx="3" fill="#16A34A"/><rect x="66" y="20" width="14" height="50" rx="3" fill="#F59E0B"/><rect x="88" y="38" width="14" height="32" rx="3" fill="#EF4444"/></svg>`,
    aiAssistant:`<svg viewBox="0 0 120 80"><rect x="26" y="22" width="68" height="46" rx="14" fill="#7c3aed"/><rect x="36" y="34" width="48" height="22" rx="8" fill="#fff"/><circle cx="52" cy="45" r="4" fill="#7c3aed"/><circle cx="68" cy="45" r="4" fill="#7c3aed"/></svg>`,
    savingTips:`<svg viewBox="0 0 120 80"><path d="M30 42 h60 v24 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 Z" fill="#16A34A"/><rect x="26" y="32" width="68" height="12" rx="6" fill="#0A4DA2"/><circle cx="60" cy="22" r="9" fill="#F59E0B"/></svg>`,
    budgetingTips:`<svg viewBox="0 0 120 80"><rect x="24" y="14" width="72" height="54" rx="8" fill="#0A4DA2"/><rect x="34" y="24" width="44" height="5" rx="2.5" fill="#fff"/></svg>`,
    groceriesTips:`<svg viewBox="0 0 120 80"><path d="M28 32 h64 l-6 30 a6 6 0 0 1 -6 5 H40 a6 6 0 0 1 -6 -5 Z" fill="#16A34A"/><circle cx="46" cy="52" r="4" fill="#fff"/><circle cx="74" cy="52" r="4" fill="#fff"/></svg>`,
    transportTips:`<svg viewBox="0 0 120 80"><rect x="20" y="28" width="80" height="32" rx="8" fill="#0A4DA2"/><circle cx="38" cy="62" r="6" fill="#1e293b"/><circle cx="82" cy="62" r="6" fill="#1e293b"/></svg>`,
    discountsTips:`<svg viewBox="0 0 120 80"><rect x="22" y="24" width="76" height="36" rx="6" fill="#7c3aed"/><circle cx="38" cy="42" r="8" fill="#fff"/></svg>`,
    emergencyFundTips:`<svg viewBox="0 0 120 80"><path d="M60 14 L100 32 L100 70 L20 70 L20 32 Z" fill="#16A34A"/><rect x="48" y="42" width="24" height="28" rx="3" fill="#fff"/></svg>`
};

function renderImage(containerId, url, alt, fallbackKey) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const fallback = FALLBACK_SVGS[fallbackKey] || '';
    const cleanUrl = (url || '').trim();
    if (cleanUrl && !cleanUrl.includes('YOUR_')) {
        el.innerHTML = '';
        const img = document.createElement('img');
        img.src = cleanUrl; img.alt = alt || ''; img.loading = 'lazy';
        img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
        img.onerror = function() { el.innerHTML = fallback; };
        el.appendChild(img);
    } else {
        el.innerHTML = fallback;
    }
}

function toggleLandingMenu() {
    document.getElementById('landingNavLinks').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', function() {
    renderImage('heroImageContainer', IMAGE_URLS.hero, 'Student managing finances', 'hero');
    renderImage('communityImageContainer', IMAGE_URLS.community, 'Students studying together', 'community');
    renderImage('featureWallet', IMAGE_URLS.wallet, 'Wallet', 'wallet');
    renderImage('featureBudget', IMAGE_URLS.budget, 'Budget', 'budget');
    renderImage('featureExpenses', IMAGE_URLS.expenses, 'Expenses', 'expenses');
    renderImage('featureSavings', IMAGE_URLS.savings, 'Savings', 'savings');
    renderImage('featureAnalytics', IMAGE_URLS.analytics, 'Analytics', 'analytics');
    renderImage('featureAI', IMAGE_URLS.aiAssistant, 'AI', 'aiAssistant');
    renderImage('tipSaving', IMAGE_URLS.savingTips, 'Saving', 'savingTips');
    renderImage('tipBudgeting', IMAGE_URLS.budgetingTips, 'Budgeting', 'budgetingTips');
    renderImage('tipGroceries', IMAGE_URLS.groceriesTips, 'Groceries', 'groceriesTips');
    renderImage('tipTransport', IMAGE_URLS.transportTips, 'Transport', 'transportTips');
    renderImage('tipDiscounts', IMAGE_URLS.discountsTips, 'Discounts', 'discountsTips');
    renderImage('tipEmergency', IMAGE_URLS.emergencyFundTips, 'Emergency', 'emergencyFundTips');

    window.addEventListener('scroll', function() {
        const nav = document.getElementById('landingNav');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    });
});
