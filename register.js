const USERS_KEY = 'nsfas_users_v3';
const CURRENT_KEY = 'nsfas_current_user_v3';

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch(e) { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function setCurrentUser(user) { localStorage.setItem(CURRENT_KEY, JSON.stringify(user)); }

const SIGNUP_SVG = `<svg viewBox="0 0 400 300"><circle cx="200" cy="150" r="120" fill="rgba(255,255,255,0.10)"/><circle cx="200" cy="115" r="34" fill="#fff" opacity="0.9"/><path d="M140 250 Q140 175 200 175 Q260 175 260 250 Z" fill="#fff" opacity="0.9"/><circle cx="270" cy="90" r="24" fill="#16A34A"/><polyline points="262,90 270,98 282,82" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

document.addEventListener('DOMContentLoaded', function() {
    const el = document.getElementById('signupImageContainer');
    if (el) el.innerHTML = SIGNUP_SVG;

    // If already logged in, go to dashboard
    if (localStorage.getItem(CURRENT_KEY)) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const fn = document.getElementById('regFirstName').value.trim();
        const ln = document.getElementById('regLastName').value.trim();
        const sn = document.getElementById('regStudentNumber').value.trim();
        const em = document.getElementById('regEmail').value.trim();
        const ph = document.getElementById('regPhone').value.trim();
        const uni = document.getElementById('regUniversity').value.trim();
        const crs = document.getElementById('regCourse').value.trim();
        const pw = document.getElementById('regPassword').value;
        const cpw = document.getElementById('regConfirmPassword').value;

        const err = document.getElementById('registerError');
        const ok = document.getElementById('registerSuccess');
        err.classList.remove('show'); ok.classList.remove('show');

        if (!fn || !ln || !sn || !em || !ph || !pw) {
            err.textContent = 'Please fill in all required fields.';
            err.classList.add('show'); return;
        }
        if (pw.length < 8) {
            err.textContent = 'Password must be at least 8 characters.';
            err.classList.add('show'); return;
        }
        if (pw !== cpw) {
            err.textContent = 'Passwords do not match.';
            err.classList.add('show'); return;
        }

        const users = getUsers();
        if (users.find(u => u.studentNumber === sn)) {
            err.textContent = 'This student number is already registered. Please sign in.';
            err.classList.add('show'); return;
        }
        if (users.find(u => u.email === em)) {
            err.textContent = 'This email is already registered.';
            err.classList.add('show'); return;
        }

        const newUser = {
            id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
            firstName: fn, lastName: ln, studentNumber: sn, email: em, phone: ph,
            university: uni || 'Not specified', course: crs || 'Not specified',
            nsfasStatus: 'Active', password: pw, status: 'Active',
            registeredAt: new Date().toISOString(), profilePicture: null,
            allowance: 0, balance: 0, savings: 0,
            transactions: [], budgetCategories: [], goals: [], monthlyBudget: 0
        };
        users.push(newUser);
        saveUsers(users);

        ok.textContent = 'Account created. Setting up your dashboard...';
        ok.classList.add('show');

        setTimeout(() => {
            setCurrentUser(newUser);
            window.location.href = 'dashboard.html';
        }, 900);
    });
});
