const USERS_KEY = 'nsfas_users_v3';
const CURRENT_KEY = 'nsfas_current_user_v3';

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch(e) { return []; }
}
function setCurrentUser(user) { localStorage.setItem(CURRENT_KEY, JSON.stringify(user)); }

// Fallback login illustration SVG
const LOGIN_SVG = `<svg viewBox="0 0 400 300"><circle cx="200" cy="150" r="120" fill="rgba(255,255,255,0.10)"/><rect x="150" y="70" width="100" height="170" rx="16" fill="#fff"/><rect x="158" y="80" width="84" height="150" rx="10" fill="#e8f0fe"/><rect x="168" y="92" width="60" height="10" rx="5" fill="#0A4DA2"/><rect x="168" y="112" width="64" height="30" rx="8" fill="#16A34A"/><circle cx="290" cy="90" r="22" fill="#F59E0B"/><text x="290" y="98" font-family="Montserrat,sans-serif" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">R</text></svg>`;

document.addEventListener('DOMContentLoaded', function() {
    // Show illustration
    const el = document.getElementById('loginImageContainer');
    if (el) el.innerHTML = LOGIN_SVG;

    // If already logged in, go straight to dashboard
    const current = localStorage.getItem(CURRENT_KEY);
    if (current) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Show toast helper
    window.showToast = function(message, type) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${type==='error'?'#EF4444':'#16A34A'};color:#fff;padding:11px 22px;border-radius:50px;font-size:0.86rem;font-family:Poppins,sans-serif;font-weight:500;box-shadow:0 16px 44px rgba(15,23,42,0.12);z-index:2000;`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2400);
    };

    // Forgot password
    document.getElementById('forgotLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.showToast('Please contact support to reset your password.', 'error');
    });

    // Login handler
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const identifier = document.getElementById('loginIdentifier').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        errorEl.classList.remove('show');
        errorEl.textContent = '';

        if (!identifier || !password) {
            errorEl.textContent = 'Please enter your student number/email and password.';
            errorEl.classList.add('show');
            return;
        }

        const users = getUsers();
        const user = users.find(u =>
            (u.studentNumber === identifier || u.email === identifier) && u.password === password
        );

        if (!user) {
            errorEl.textContent = 'Your student number/email or password is incorrect.';
            errorEl.classList.add('show');
            return;
        }

        setCurrentUser(user);
        window.location.href = 'dashboard.html';
    });
});
