// ===== EVENTA - FINAL PRODUCTION JAVASCRIPT (2025) =====
// تم حل مشكلة الـ navbar نهائيًا + تحديث فوري + دعم كامل للـ API لاحقًا

const API_BASE = 'http://localhost:3000/api'; // غيريه لما الباك يجي

// === Utility Functions ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// === Auth & User System ===
function getCurrentUser() {
    if (localStorage.getItem('userLoggedIn') !== 'true') return null;
    return {
        id: localStorage.getItem('userId') || null,
        name: localStorage.getItem('userName') || 'User',
        email: localStorage.getItem('userEmail') || '',
        role: localStorage.getItem('userRole') || 'user', // user | organizer
        token: localStorage.getItem('authToken') || null
    };
}

function getUserRole() {
    return localStorage.getItem('userRole') || 'guest';
}

function logout() {
    localStorage.clear();
    showToast('Logged out successfully!', 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// === Cart System ===
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('eventa_cart') || '[]');
    } catch {
        return [];
    }
}

function addToCart(eventId, eventTitle, ticketType, price, quantity = 1) {
    if (!quantity || quantity < 1) return;

    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.eventId === eventId && item.ticketType === ticketType);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ eventId, eventTitle, ticketType, price, quantity, addedAt: Date.now() });
    }

    localStorage.setItem('eventa_cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${quantity} × ${ticketType} added to cart`, 'success');
}

function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.quantity, 0);
    $$('.cart-count, .cart-badge').forEach(badge => {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    });
}

// === Notification System ===
function addNotification(title, message, type = 'info') {
    let notifications = JSON.parse(localStorage.getItem('eventa_notifications') || '[]');
    if (notifications.some(n => n.title === title && n.message === message)) return;

    notifications.unshift({
        id: Date.now().toString(),
        title, message, type,
        timestamp: new Date().toISOString(),
        read: false
    });

    if (notifications.length > 50) notifications.pop();
    localStorage.setItem('eventa_notifications', JSON.stringify(notifications));
    updateNotificationCount();
}

function updateNotificationCount() {
    const unread = JSON.parse(localStorage.getItem('eventa_notifications') || '[]')
        .filter(n => !n.read).length;

    $$('.notification-count, .notification-badge').forEach(badge => {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
    });
}

// === Toast Notification ===
function showToast(message, type = 'info', duration = 4000) {
    $('.toast-notification')?.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span>${message}</span>
            <button class="toast-close">×</button>
        </div>
    `;

    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#6366f1' };

    Object.assign(toast.style, {
        position: 'fixed',
        top: '90px',
        right: '20px',
        zIndex: '9999',
        background: colors[type] || colors.info,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        animation: 'slideInRight 0.5s ease',
        fontWeight: '600',
        minWidth: '320px',
        fontFamily: 'inherit'
    });

    document.body.appendChild(toast);
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    if (duration > 0) setTimeout(() => toast.remove(), duration);
}

// === Navbar Update - الحل النهائي لكل الصفحات ===
function updateNavbar() {
    const user = getCurrentUser();

    // تحديث كلاسات الـ body (مهم جدًا للـ CSS)
    document.body.classList.toggle('logged-in', !!user);
    document.body.classList.toggle('logged-out', !user);

    // إخفاء/إظهار الأقسام
    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = user ? 'none' : 'flex';
    });

    document.querySelectorAll('.user-only').forEach(el => {
        el.style.display = user ? 'flex' : 'none';
    });

    document.querySelectorAll('.organizer-only').forEach(el => {
        el.style.display = (user?.role === 'organizer') ? 'block' : 'none';
    });

    // تحديث الاسم والأفاتار
    if (user) {
        const nameEl = $('#userNameDisplay');
        const avatarEl = $('#userAvatar');

        if (nameEl) nameEl.textContent = user.name.split(' ')[0];
        if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }

    // تحديث العدادات
    updateCartCount();
    updateNotificationCount();
}

// === Mobile Menu ===
function initMobileMenu() {
    const toggle = $('.mobile-menu-toggle');
    const menu = $('.nav-menu');
    let overlay = $('.mobile-overlay');

    if (!toggle || !menu) return;

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
    }

    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('menu-open', menu.classList.contains('active'));
    });

    overlay.addEventListener('click', () => {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    });

    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

// === Page Protection ===
function protectPage() {
    const path = location.pathname.split('/').pop();
    const organizerPages = ['organizer-dashboard.html', 'create-event.html'];
    const authPages = ['checkout.html', 'my-tickets.html', 'profile.html', 'edit-profile.html', 'notifications.html', 'success.html'];

    if (organizerPages.includes(path) && !requireOrganizer()) return;
    if (authPages.includes(path) && !requireAuth()) return;
}

function requireAuth() {
    if (!getCurrentUser()) {
        showToast('Please log in to continue', 'warning');
        setTimeout(() => location.href = 'login.html', 1500);
        return false;
    }
    return true;
}

function requireOrganizer() {
    if (!requireAuth()) return false;
    if (getUserRole() !== 'organizer') {
        showToast('This page is for organizers only', 'error');
        setTimeout(() => location.href = 'index.html', 2000);
        return false;
    }
    return true;
}

// === Auth Forms ===
function initAuthForms() {
    // Login
    $('#loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#email').value.trim();
        const password = $('#password').value.trim();
        const isOrganizer = $('#loginAsOrganizer')?.checked || false;

        if (!email || !password) {
            showToast('Please fill all fields', 'error');
            return;
        }

        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', email.split('@')[0]);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', isOrganizer ? 'organizer' : 'user');
        localStorage.setItem('userId', Date.now().toString());

        showToast('Login successful!', 'success');
        addNotification('Welcome back!', 'You are now logged in', 'success');

        setTimeout(() => {
            location.href = isOrganizer ? 'organizer-dashboard.html' : 'index.html';
        }, 1200);
    });

    // Register
    $('#registerForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#name').value.trim();
        const email = $('#email').value.trim();
        const password = $('#password').value.trim();
        const isOrganizer = $('#isOrganizer')?.checked || false;

        if (!name || !email || !password) {
            showToast('Please fill all fields', 'error');
            return;
        }

        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', name);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', isOrganizer ? 'organizer' : 'user');
        localStorage.setItem('userId', Date.now().toString());

        showToast('Account created successfully!', 'success');
        addNotification('Welcome!', 'Your account has been created', 'success');

        setTimeout(() => {
            location.href = isOrganizer ? 'organizer-dashboard.html' : 'index.html';
        }, 1200);
    });
}

// === MAIN INIT - يشتغل في كل الصفحات ===
function initApp() {
    updateNavbar();
    initMobileMenu();
    initAuthForms();
    protectPage();

    $('#logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Welcome notification (once)
    if (getCurrentUser() && !localStorage.getItem('welcome_shown_2025')) {
        addNotification('Welcome to Eventa!', 'Discover amazing events around you', 'success');
        localStorage.setItem('welcome_shown_2025', 'true');
    }
}

// تشغيل التطبيق في كل الأحوال (الحل النهائي)
document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', initApp);
window.addEventListener('focus', updateNavbar);
window.addEventListener('storage', updateNavbar);

// Toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
.toast-notification { animation: slideInRight 0.5s ease; }
`;
document.head.appendChild(toastStyle);