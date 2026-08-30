/**
 * Expense List - Homesite Logic
 * Manages tabs, demo logins, form validation, interactive demo preview, and navbar effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated and update UI accordingly
  const currentUser = AuthService.getCurrentUser();
  if (currentUser) {
    const navCtaBtn = document.getElementById('nav-cta-btn');
    if (navCtaBtn) {
      navCtaBtn.innerHTML = `<span>Dashboard (${currentUser.name.split(' ')[0]})</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      navCtaBtn.href = '../app/index.html';
    }

    const heroAccessBtn = document.getElementById('hero-access-btn');
    if (heroAccessBtn) {
      heroAccessBtn.innerHTML = `<span>Go to Your Database (${currentUser.name})</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
      heroAccessBtn.href = '../app/index.html';
    }
  }

  // Navbar scroll background change
  const siteHeader = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteHeader?.classList.add('scrolled');
    } else {
      siteHeader?.classList.remove('scrolled');
    }
  });

  // ==========================================
  // Auth Tabs (Sign In vs Register)
  // ==========================================
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabRegister.classList.remove('active');
    tabRegister.setAttribute('aria-selected', 'false');
    
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabRegister.setAttribute('aria-selected', 'true');
    tabLogin.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'false');
    
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });

  // ==========================================
  // Password Visibility Toggles
  // ==========================================
  const setupPasswordToggle = (btnId, inputId) => {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁️';
    });
  };

  setupPasswordToggle('toggle-login-pass', 'login-password');
  setupPasswordToggle('toggle-reg-pass', 'register-password');

  // ==========================================
  // Quick 1-Click Demo Logins
  // ==========================================
  const btnQuickAlex = document.getElementById('btn-quick-alex');
  const btnQuickSarah = document.getElementById('btn-quick-sarah');

  btnQuickAlex?.addEventListener('click', () => {
    try {
      AuthService.demoLogin('alex@example.com');
      ExpenseDB.showToast('Logged into Alex Vance’s personal database!', 'success');
      setTimeout(() => {
        window.location.href = '../app/index.html';
      }, 500);
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
    }
  });

  btnQuickSarah?.addEventListener('click', () => {
    try {
      AuthService.demoLogin('sarah@example.com');
      ExpenseDB.showToast('Logged into Sarah Connor’s studio database!', 'success');
      setTimeout(() => {
        window.location.href = '../app/index.html';
      }, 500);
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
    }
  });

  // Forgot password helper
  const linkForgotPass = document.getElementById('link-forgot-pass');
  linkForgotPass?.addEventListener('click', () => {
    ExpenseDB.showToast('For demo accounts, use password "password123" or click the 1-Click Demo buttons above.', 'info');
  });

  // ==========================================
  // Login Form Submission
  // ==========================================
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-submit-login');

    const email = emailInput?.value.trim();
    const password = passInput?.value;

    if (!email || !password) {
      ExpenseDB.showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying credentials...</span>';

      const user = AuthService.login(email, password);
      ExpenseDB.showToast(`Welcome back, ${user.name}! Accessing your database...`, 'success');
      
      setTimeout(() => {
        window.location.href = '../app/index.html';
      }, 600);
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Unlock Expense Database</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
  });

  // ==========================================
  // Register Form Submission
  // ==========================================
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passInput = document.getElementById('register-password');
    const typeInput = document.getElementById('register-account-type');
    const submitBtn = document.getElementById('btn-submit-register');

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passInput?.value;
    const accountType = typeInput?.value;

    if (!name || !email || !password) {
      ExpenseDB.showToast('Please complete all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      ExpenseDB.showToast('Password must contain at least 6 characters.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating database partition...</span>';

      const newUser = AuthService.register({
        name,
        email,
        password,
        accountType
      });

      ExpenseDB.showToast(`Account created! Initialized empty database for ${newUser.name}.`, 'success');

      setTimeout(() => {
        window.location.href = '../app/index.html';
      }, 700);
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Initialize & Access Database</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
    }
  });

  // ==========================================
  // Interactive Live Demo Calculator Logic
  // ==========================================
  let demoExpenses = [
    { id: 1, name: 'Cold Brew Coffee', amount: 5.25, date: '2026-08-30' },
    { id: 2, name: 'Metro Transit Pass', amount: 2.75, date: '2026-08-30' }
  ];

  const demoItemsContainer = document.getElementById('demo-items-list');
  const demoTotalDisplay = document.getElementById('demo-calculated-total');
  const demoCalcForm = document.getElementById('demo-calc-form');
  const demoResetBtn = document.getElementById('demo-reset-btn');
  const demoDateInput = document.getElementById('demo-date');

  // Set today as default date in demo
  if (demoDateInput) {
    demoDateInput.value = new Date().toISOString().split('T')[0];
  }

  function renderDemoExpenses() {
    if (!demoItemsContainer || !demoTotalDisplay) return;

    if (demoExpenses.length === 0) {
      demoItemsContainer.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.88rem;">
          No items in demo. Add an item using the form on the left!
        </div>
      `;
      demoTotalDisplay.textContent = '$0.00';
      return;
    }

    demoItemsContainer.innerHTML = '';
    let total = 0;

    demoExpenses.forEach(item => {
      total += item.amount;
      const el = document.createElement('div');
      el.className = 'preview-expense-item';
      el.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span>💸</span>
          <div>
            <div style="font-weight:600; font-size:0.88rem;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${item.date}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:700; color:#f43f5e;">-$${item.amount.toFixed(2)}</span>
          <button type="button" class="btn-danger btn-sm" style="padding:2px 6px; font-size:0.7rem; border-radius:4px;" data-del-id="${item.id}">✕</button>
        </div>
      `;
      demoItemsContainer.appendChild(el);
    });

    demoTotalDisplay.textContent = `$${total.toFixed(2)}`;

    // Add delete handlers
    demoItemsContainer.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-del-id'), 10);
        demoExpenses = demoExpenses.filter(i => i.id !== id);
        renderDemoExpenses();
      });
    });
  }

  demoCalcForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('demo-name');
    const amountInput = document.getElementById('demo-amount');
    const dateInput = document.getElementById('demo-date');

    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    const date = dateInput?.value || new Date().toISOString().split('T')[0];

    if (!name || isNaN(amount) || amount <= 0) {
      ExpenseDB.showToast('Please enter a valid name and amount.', 'error');
      return;
    }

    demoExpenses.push({
      id: Date.now(),
      name,
      amount,
      date
    });

    renderDemoExpenses();

    // Reset inputs
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';

    ExpenseDB.showToast(`Added "${name}" to demo ledger!`, 'info');
  });

  demoResetBtn?.addEventListener('click', () => {
    demoExpenses = [
      { id: 1, name: 'Cold Brew Coffee', amount: 5.25, date: '2026-08-30' },
      { id: 2, name: 'Metro Transit Pass', amount: 2.75, date: '2026-08-30' }
    ];
    renderDemoExpenses();
    ExpenseDB.showToast('Demo preview reset.', 'info');
  });

  // Initial render for demo
  renderDemoExpenses();

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
});
