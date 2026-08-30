/**
 * Expense List - Dashboard Application Logic
 * Manages user authentication state, CRUD operations on the isolated user database,
 * real-time total calculations, filtering, and user switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard check: Require authentication
  const currentUser = AuthService.requireAuth('../home/index.html');
  if (!currentUser) return;

  // Category Icon Mapping
  const CATEGORY_ICONS = {
    'Groceries': '🛒',
    'Food & Dining': '☕',
    'Electronics': '💻',
    'Health & Fitness': '🏋️',
    'Software': '⚡',
    'Business': '💼',
    'Office': '🪑',
    'Transportation': '🚗',
    'Other': '🏷️'
  };

  // DOM Elements
  const userAvatarDisplay = document.getElementById('user-avatar-display');
  const userNameDisplay = document.getElementById('user-name-display');
  const userDbTagDisplay = document.getElementById('user-dbtag-display');
  const statTotalExpenses = document.getElementById('stat-total-expenses');
  const statItemCount = document.getElementById('stat-item-count');
  const statMaxExpense = document.getElementById('stat-max-expense');
  const ledgerBottomTotal = document.getElementById('ledger-bottom-total');
  const displayedCount = document.getElementById('displayed-count');

  const addExpenseForm = document.getElementById('add-expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseDateInput = document.getElementById('expense-date');
  const expenseCategoryInput = document.getElementById('expense-category');

  const expenseItemsContainer = document.getElementById('expense-items-container');
  const searchInput = document.getElementById('ledger-search-input');
  const categoryFilter = document.getElementById('ledger-cat-filter');

  const btnLogout = document.getElementById('btn-logout');

  // Set default date to today
  if (expenseDateInput) {
    expenseDateInput.value = new Date().toISOString().split('T')[0];
  }

  // Populate User Profile
  if (userAvatarDisplay) userAvatarDisplay.textContent = currentUser.avatar || '👤';
  if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
  if (userDbTagDisplay) userDbTagDisplay.textContent = `DB: ${currentUser.accountType || 'Personal'} (${currentUser.email})`;

  // ==========================================
  // Render User Database Expenses & Stats
  // ==========================================
  function renderLedger() {
    const allExpenses = ExpenseDB.getUserExpenses(currentUser.id);
    const searchQuery = searchInput?.value.trim().toLowerCase() || '';
    const selectedCategory = categoryFilter?.value || 'ALL';

    // Filter by search & category
    const filteredExpenses = allExpenses.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery) ||
                            item.category.toLowerCase().includes(searchQuery);
      const matchesCat = (selectedCategory === 'ALL') || (item.category === selectedCategory);
      return matchesSearch && matchesCat;
    });

    // Update Statistics (calculated on complete user database)
    const grandTotal = ExpenseDB.calculateTotal(currentUser.id);
    if (statTotalExpenses) statTotalExpenses.textContent = `$${grandTotal.toFixed(2)}`;
    if (statItemCount) statItemCount.textContent = allExpenses.length.toString();

    const maxSingle = allExpenses.reduce((max, item) => Math.max(max, Number(item.amount) || 0), 0);
    if (statMaxExpense) statMaxExpense.textContent = `$${maxSingle.toFixed(2)}`;

    // Update filtered summary
    const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (ledgerBottomTotal) ledgerBottomTotal.textContent = `$${filteredTotal.toFixed(2)}`;
    if (displayedCount) displayedCount.textContent = filteredExpenses.length.toString();

    // Render Rows
    if (!expenseItemsContainer) return;

    if (filteredExpenses.length === 0) {
      if (allExpenses.length === 0) {
        expenseItemsContainer.innerHTML = `
          <div class="empty-ledger">
            <div class="empty-icon">📂</div>
            <h3 style="margin-bottom:6px;">Your Database is Empty</h3>
            <p style="font-size:0.9rem; color:var(--text-muted);">
              Use the form on the left to add your first expense record to this database!
            </p>
          </div>
        `;
      } else {
        expenseItemsContainer.innerHTML = `
          <div class="empty-ledger">
            <div class="empty-icon">🔍</div>
            <h3 style="margin-bottom:6px;">No Matching Expenses</h3>
            <p style="font-size:0.9rem; color:var(--text-muted);">
              No records match your search filter "${escapeHtml(searchQuery)}".
            </p>
          </div>
        `;
      }
      return;
    }

    expenseItemsContainer.innerHTML = '';

    filteredExpenses.forEach(exp => {
      const row = document.createElement('div');
      row.className = 'expense-row';
      const icon = CATEGORY_ICONS[exp.category] || '🏷️';

      row.innerHTML = `
        <div class="expense-meta-col">
          <div class="expense-cat-icon">${icon}</div>
          <div class="expense-details">
            <span class="expense-title">${escapeHtml(exp.name)}</span>
            <span class="expense-submeta">
              <span class="badge badge-primary" style="padding: 2px 6px; font-size: 0.68rem;">${escapeHtml(exp.category)}</span>
              <span>📅 ${exp.date}</span>
            </span>
          </div>
        </div>
        <div class="expense-amount-col">
          <span class="expense-cost">-$${Number(exp.amount).toFixed(2)}</span>
          <button 
            type="button" 
            class="btn-delete-item" 
            data-delete-id="${exp.id}" 
            title="Delete this expense"
            aria-label="Delete ${escapeHtml(exp.name)}"
          >
            🗑️
          </button>
        </div>
      `;

      expenseItemsContainer.appendChild(row);
    });

    // Attach delete listeners
    expenseItemsContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-delete-id');
        const deleted = ExpenseDB.deleteExpense(currentUser.id, id);
        if (deleted) {
          ExpenseDB.showToast('Expense removed from database.', 'info');
          renderLedger();
        }
      });
    });
  }

  // ==========================================
  // Add Expense Form Submission
  // ==========================================
  addExpenseForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = expenseNameInput?.value.trim();
    const amount = parseFloat(expenseAmountInput?.value);
    const date = expenseDateInput?.value;
    const category = expenseCategoryInput?.value || 'Other';

    if (!name || isNaN(amount) || amount <= 0 || !date) {
      ExpenseDB.showToast('Please enter a valid expense title, amount, and date.', 'error');
      return;
    }

    try {
      ExpenseDB.addExpense(currentUser.id, {
        name,
        amount,
        date,
        category
      });

      ExpenseDB.showToast(`Added "$${amount.toFixed(2)} - ${name}" to database!`, 'success');

      // Reset fields
      if (expenseNameInput) expenseNameInput.value = '';
      if (expenseAmountInput) expenseAmountInput.value = '';
      if (expenseNameInput) expenseNameInput.focus();

      renderLedger();
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
    }
  });

  // ==========================================
  // Search & Filter Listeners
  // ==========================================
  searchInput?.addEventListener('input', () => {
    renderLedger();
  });

  categoryFilter?.addEventListener('change', () => {
    renderLedger();
  });

  // ==========================================
  // Sign Out
  // ==========================================
  btnLogout?.addEventListener('click', () => {
    AuthService.logout();
    ExpenseDB.showToast('You have signed out.', 'info');
    setTimeout(() => {
      window.location.href = '../home/index.html';
    }, 400);
  });

  // Initial render
  renderLedger();

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
});
