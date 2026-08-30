/**
 * Expense List - Dashboard Application Logic
 * Manages user authentication state, CRUD operations on the isolated user database,
 * date/timestamp filtering, user-preset monthly cycle calculations, and real-time statistics.
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

  // DOM Elements - Profile & Header
  const userAvatarDisplay = document.getElementById('user-avatar-display');
  const userNameDisplay = document.getElementById('user-name-display');
  const userDbTagDisplay = document.getElementById('user-dbtag-display');
  const btnLogout = document.getElementById('btn-logout');

  // DOM Elements - Stats
  const statTotalTitle = document.getElementById('stat-total-title');
  const statTotalExpenses = document.getElementById('stat-total-expenses');
  const statFilterLabel = document.getElementById('stat-filter-label');
  const statMonthlyCycleTotal = document.getElementById('stat-monthly-cycle-total');
  const statCycleDayBadge = document.getElementById('stat-cycle-day-badge');
  const statCycleRangeLabel = document.getElementById('stat-cycle-range-label');
  const statItemCount = document.getElementById('stat-item-count');
  const statItemSubtext = document.getElementById('stat-item-subtext');
  const statMaxExpense = document.getElementById('stat-max-expense');
  const statMaxSubtext = document.getElementById('stat-max-subtext');

  // DOM Elements - Form
  const addExpenseForm = document.getElementById('add-expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseDateInput = document.getElementById('expense-date');
  const expenseCategoryInput = document.getElementById('expense-category');

  // DOM Elements - Ledger & Filters
  const expenseItemsContainer = document.getElementById('expense-items-container');
  const searchInput = document.getElementById('ledger-search-input');
  const categoryFilter = document.getElementById('ledger-cat-filter');
  const timeFilter = document.getElementById('ledger-time-filter');

  // Dynamic Date Input Boxes
  const singleDateBox = document.getElementById('single-date-box');
  const filterSingleDate = document.getElementById('filter-single-date');
  const rangeDateBox = document.getElementById('range-date-box');
  const filterStartDate = document.getElementById('filter-start-date');
  const filterEndDate = document.getElementById('filter-end-date');
  const monthDateBox = document.getElementById('month-date-box');
  const filterMonthDate = document.getElementById('filter-month-date');
  const btnClearFilters = document.getElementById('btn-clear-filters');

  // Active Filter Banner
  const activeFilterBanner = document.getElementById('active-filter-banner');
  const activeFilterText = document.getElementById('active-filter-text');
  const activeFilterTotalBadge = document.getElementById('active-filter-total-badge');
  const btnClearFilterBanner = document.getElementById('btn-clear-filter-banner');

  // Ledger Summary
  const bottomTotalLabel = document.getElementById('bottom-total-label');
  const ledgerBottomTotal = document.getElementById('ledger-bottom-total');
  const displayedCount = document.getElementById('displayed-count');

  // Cycle Preset Modal Elements
  const btnOpenCycleSettings = document.getElementById('btn-open-cycle-settings');
  const cycleModal = document.getElementById('cycle-modal');
  const btnCloseCycleModal = document.getElementById('btn-close-cycle-modal');
  const btnCancelCycle = document.getElementById('btn-cancel-cycle');
  const cycleSettingsForm = document.getElementById('cycle-settings-form');
  const cycleDaySelect = document.getElementById('cycle-day-select');
  const cyclePreviewRange = document.getElementById('cycle-preview-range');

  // Set default form date to today
  const today = new Date();
  const todayStr = formatYMD(today);
  if (expenseDateInput) {
    expenseDateInput.value = todayStr;
  }
  if (filterSingleDate) {
    filterSingleDate.value = todayStr;
  }
  if (filterStartDate) {
    filterStartDate.value = todayStr;
  }
  if (filterEndDate) {
    filterEndDate.value = todayStr;
  }
  if (filterMonthDate) {
    filterMonthDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  // Populate User Profile
  if (userAvatarDisplay) userAvatarDisplay.textContent = currentUser.avatar || '👤';
  if (userNameDisplay) userNameDisplay.textContent = currentUser.name;
  if (userDbTagDisplay) userDbTagDisplay.textContent = `DB: ${currentUser.accountType || 'Personal'} (${currentUser.email})`;

  // Initialize Cycle Day Select Options (1 to 31)
  initCycleDayOptions();

  // ==========================================
  // Date Helpers
  // ==========================================
  function formatYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  }

  function formatDisplayDate(ymdString) {
    if (!ymdString) return '';
    const parts = ymdString.split('-');
    if (parts.length !== 3) return ymdString;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDisplayMonth(yearMonthStr) {
    if (!yearMonthStr) return '';
    const parts = yearMonthStr.split('-');
    if (parts.length !== 2) return yearMonthStr;
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ==========================================
  // Render User Database Expenses & Stats
  // ==========================================
  function renderLedger() {
    const allExpenses = ExpenseDB.getUserExpenses(currentUser.id);
    const searchQuery = searchInput?.value.trim().toLowerCase() || '';
    const selectedCategory = categoryFilter?.value || 'ALL';
    const selectedTime = timeFilter?.value || 'THIS_CYCLE';

    // 1. Calculate User Monthly Preset Cycle
    const userCycleDay = ExpenseDB.getUserCycleDay(currentUser.id);
    const cycleRange = ExpenseDB.getCycleDateRange(userCycleDay, new Date());

    if (statCycleDayBadge) statCycleDayBadge.textContent = `Day ${userCycleDay}`;
    if (statCycleRangeLabel) statCycleRangeLabel.textContent = `${cycleRange.startDisplay} – ${cycleRange.endDisplay}`;

    const cycleExpenses = allExpenses.filter(item => item.date >= cycleRange.startDate && item.date <= cycleRange.endDate);
    const monthlyCycleTotal = cycleExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (statMonthlyCycleTotal) statMonthlyCycleTotal.textContent = `$${monthlyCycleTotal.toFixed(2)}`;

    // 2. Filter by Timeframe / Timestamp / Date
    let timeFilteredExpenses = allExpenses;
    let timeFilterDesc = 'Current Monthly Cycle';

    const now = new Date();
    const todayYMD = formatYMD(now);

    if (selectedTime === 'THIS_CYCLE') {
      timeFilteredExpenses = cycleExpenses;
      timeFilterDesc = `Monthly Cycle (${cycleRange.startDisplay} – ${cycleRange.endDisplay})`;
    } else if (selectedTime === 'ALL') {
      timeFilteredExpenses = allExpenses;
      timeFilterDesc = 'All-Time Records';
    } else if (selectedTime === 'TODAY') {
      timeFilteredExpenses = allExpenses.filter(item => item.date === todayYMD);
      timeFilterDesc = `Today (${formatDisplayDate(todayYMD)})`;
    } else if (selectedTime === 'DAY') {
      const pickedDate = filterSingleDate?.value || todayYMD;
      timeFilteredExpenses = allExpenses.filter(item => item.date === pickedDate);
      timeFilterDesc = `Date: ${formatDisplayDate(pickedDate)}`;
    } else if (selectedTime === 'RANGE') {
      const start = filterStartDate?.value || '1970-01-01';
      const end = filterEndDate?.value || '2099-12-31';
      timeFilteredExpenses = allExpenses.filter(item => item.date >= start && item.date <= end);
      timeFilterDesc = `Range: ${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
    } else if (selectedTime === 'LAST_7_DAYS') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 6);
      const past7YMD = formatYMD(past7);
      timeFilteredExpenses = allExpenses.filter(item => item.date >= past7YMD && item.date <= todayYMD);
      timeFilterDesc = `Last 7 Days (${formatDisplayDate(past7YMD)} – ${formatDisplayDate(todayYMD)})`;
    } else if (selectedTime === 'LAST_30_DAYS') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 29);
      const past30YMD = formatYMD(past30);
      timeFilteredExpenses = allExpenses.filter(item => item.date >= past30YMD && item.date <= todayYMD);
      timeFilterDesc = `Last 30 Days (${formatDisplayDate(past30YMD)} – ${formatDisplayDate(todayYMD)})`;
    } else if (selectedTime === 'SPECIFIC_MONTH') {
      const ym = filterMonthDate?.value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      timeFilteredExpenses = allExpenses.filter(item => item.date && item.date.startsWith(ym));
      timeFilterDesc = `Month of ${formatDisplayMonth(ym)}`;
    }

    // 3. Filter by Search Query & Category
    const filteredExpenses = timeFilteredExpenses.filter(item => {
      const matchesSearch = searchQuery === '' || 
                            item.name.toLowerCase().includes(searchQuery) ||
                            item.category.toLowerCase().includes(searchQuery);
      const matchesCat = (selectedCategory === 'ALL') || (item.category === selectedCategory);
      return matchesSearch && matchesCat;
    });

    // 4. Calculate Totals & Update Stat Cards
    const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (statTotalExpenses) statTotalExpenses.textContent = `$${filteredTotal.toFixed(2)}`;
    if (statFilterLabel) statFilterLabel.textContent = timeFilterDesc;
    if (statTotalTitle) {
      statTotalTitle.textContent = selectedTime === 'ALL' ? 'All-Time Grand Total' : 'Filtered Period Total';
    }

    if (statItemCount) statItemCount.textContent = filteredExpenses.length.toString();
    if (statItemSubtext) {
      statItemSubtext.textContent = `Showing ${filteredExpenses.length} of ${allExpenses.length} total entries`;
    }

    const maxSingle = filteredExpenses.reduce((max, item) => Math.max(max, Number(item.amount) || 0), 0);
    if (statMaxExpense) statMaxExpense.textContent = `$${maxSingle.toFixed(2)}`;
    if (statMaxSubtext) {
      statMaxSubtext.textContent = filteredExpenses.length > 0 ? 'Highest in selection' : 'No records';
    }

    // Update Bottom Summary
    if (ledgerBottomTotal) ledgerBottomTotal.textContent = `$${filteredTotal.toFixed(2)}`;
    if (displayedCount) displayedCount.textContent = filteredExpenses.length.toString();
    if (bottomTotalLabel) {
      bottomTotalLabel.textContent = isFilterActive() ? 'Filtered Selection Total:' : 'Monthly Cycle Total:';
    }

    // 5. Update Active Filter Banner & Clear Button
    updateFilterBanner(filteredExpenses.length, filteredTotal, timeFilterDesc, selectedCategory, searchQuery);

    // 6. Render Ledger Rows
    renderLedgerRows(filteredExpenses, allExpenses.length, searchQuery);
  }

  function isFilterActive() {
    const selectedCategory = categoryFilter?.value || 'ALL';
    const selectedTime = timeFilter?.value || 'THIS_CYCLE';
    const searchQuery = searchInput?.value.trim() || '';
    return selectedCategory !== 'ALL' || selectedTime !== 'THIS_CYCLE' || searchQuery !== '';
  }

  function updateFilterBanner(count, total, timeDesc, category, search) {
    const active = isFilterActive();

    if (btnClearFilters) {
      btnClearFilters.style.display = active ? 'inline-flex' : 'none';
    }

    if (!activeFilterBanner) return;

    if (!active) {
      activeFilterBanner.style.display = 'none';
      return;
    }

    activeFilterBanner.style.display = 'flex';

    let parts = [timeDesc];
    if (category !== 'ALL') parts.push(`Category: ${category}`);
    if (search) parts.push(`Search: "${search}"`);

    if (activeFilterText) {
      activeFilterText.innerHTML = `Active Filter: <strong>${escapeHtml(parts.join(' • '))}</strong> (${count} items)`;
    }
    if (activeFilterTotalBadge) {
      activeFilterTotalBadge.textContent = `Total: $${total.toFixed(2)}`;
    }
  }

  function renderLedgerRows(filteredExpenses, totalAllExpenses, searchQuery) {
    if (!expenseItemsContainer) return;

    if (filteredExpenses.length === 0) {
      if (totalAllExpenses === 0) {
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
            <h3 style="margin-bottom:6px;">No Matching Expenses Found</h3>
            <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:12px;">
              No records match your selected date, timeframe, or category filters.
            </p>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-empty-reset">
              <span>✕ Reset Filters to Default</span>
            </button>
          </div>
        `;
        document.getElementById('btn-empty-reset')?.addEventListener('click', resetFilters);
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
      btn.addEventListener('click', () => {
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
  // Dynamic Date Controls Toggle
  // ==========================================
  function updateDateControlsVisibility() {
    const val = timeFilter?.value || 'THIS_CYCLE';

    if (singleDateBox) singleDateBox.style.display = (val === 'DAY') ? 'flex' : 'none';
    if (rangeDateBox) rangeDateBox.style.display = (val === 'RANGE') ? 'flex' : 'none';
    if (monthDateBox) monthDateBox.style.display = (val === 'SPECIFIC_MONTH') ? 'flex' : 'none';
  }

  timeFilter?.addEventListener('change', () => {
    updateDateControlsVisibility();
    renderLedger();
  });

  filterSingleDate?.addEventListener('input', () => {
    renderLedger();
  });

  filterStartDate?.addEventListener('input', () => {
    renderLedger();
  });

  filterEndDate?.addEventListener('input', () => {
    renderLedger();
  });

  filterMonthDate?.addEventListener('input', () => {
    renderLedger();
  });

  searchInput?.addEventListener('input', () => {
    renderLedger();
  });

  categoryFilter?.addEventListener('change', () => {
    renderLedger();
  });

  function resetFilters() {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'ALL';
    if (timeFilter) timeFilter.value = 'THIS_CYCLE';
    updateDateControlsVisibility();
    renderLedger();
  }

  btnClearFilters?.addEventListener('click', resetFilters);
  btnClearFilterBanner?.addEventListener('click', resetFilters);

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

      // Reset form fields
      if (expenseNameInput) expenseNameInput.value = '';
      if (expenseAmountInput) expenseAmountInput.value = '';
      if (expenseNameInput) expenseNameInput.focus();

      renderLedger();
    } catch (err) {
      ExpenseDB.showToast(err.message, 'error');
    }
  });

  // ==========================================
  // Monthly Preset Cycle Settings Modal
  // ==========================================
  function initCycleDayOptions() {
    if (!cycleDaySelect) return;
    cycleDaySelect.innerHTML = '';

    for (let day = 1; day <= 31; day++) {
      const opt = document.createElement('option');
      opt.value = day.toString();
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      else if (day === 2 || day === 22) suffix = 'nd';
      else if (day === 3 || day === 23) suffix = 'rd';

      opt.textContent = `Day ${day} (${day}${suffix} of every month)${day === 1 ? ' — Calendar Default' : ''}`;
      cycleDaySelect.appendChild(opt);
    }
  }

  function openCycleModal() {
    const currentDay = ExpenseDB.getUserCycleDay(currentUser.id);
    if (cycleDaySelect) {
      cycleDaySelect.value = currentDay.toString();
    }
    updateCyclePreview(currentDay);
    cycleModal?.classList.add('active');
  }

  function updateCyclePreview(day) {
    if (!cyclePreviewRange) return;
    const range = ExpenseDB.getCycleDateRange(day, new Date());
    cyclePreviewRange.textContent = `${range.startDisplay} – ${range.endDisplay}`;
  }

  btnOpenCycleSettings?.addEventListener('click', openCycleModal);

  cycleDaySelect?.addEventListener('change', () => {
    const day = parseInt(cycleDaySelect.value, 10) || 1;
    updateCyclePreview(day);
  });

  btnCloseCycleModal?.addEventListener('click', () => {
    cycleModal?.classList.remove('active');
  });

  btnCancelCycle?.addEventListener('click', () => {
    cycleModal?.classList.remove('active');
  });

  cycleModal?.addEventListener('click', (e) => {
    if (e.target === cycleModal) {
      cycleModal.classList.remove('active');
    }
  });

  cycleSettingsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const chosenDay = parseInt(cycleDaySelect?.value, 10) || 1;
    ExpenseDB.setUserCycleDay(currentUser.id, chosenDay);
    ExpenseDB.showToast(`Monthly cycle updated! Now starts on Day ${chosenDay} of each month.`, 'success');
    cycleModal?.classList.remove('active');
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
  updateDateControlsVisibility();
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
