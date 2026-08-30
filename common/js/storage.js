/**
 * Expense List - Multi-User Storage & Database Engine
 * Handles user persistence, isolated per-user expense stores, and sample data seeding.
 */

const STORAGE_KEYS = {
  USERS: 'expenselist_users_db',
  ACTIVE_SESSION: 'expenselist_active_session',
  EXPENSES_PREFIX: 'expenselist_user_expenses_'
};

// Default seed demo users
const SEED_USERS = [
  {
    id: 'user_alex_demo',
    email: 'alex@example.com',
    name: 'Alex Vance',
    password: 'password123',
    accountType: 'Personal Account',
    avatar: '👨‍💻',
    isDemo: true,
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'user_sarah_demo',
    email: 'sarah@example.com',
    name: 'Sarah Connor',
    password: 'password123',
    accountType: 'Freelance Studio',
    avatar: '👩‍🎨',
    isDemo: true,
    createdAt: '2026-02-15T14:30:00.000Z'
  }
];

// Seed expenses per user
const SEED_EXPENSES = {
  'user_alex_demo': [
    {
      id: 'exp_alex_1',
      name: 'MacBook Pro Stand',
      amount: 49.99,
      date: '2026-08-15',
      category: 'Electronics',
      createdAt: '2026-08-15T09:12:00.000Z'
    },
    {
      id: 'exp_alex_2',
      name: 'Whole Foods Groceries',
      amount: 132.50,
      date: '2026-08-20',
      category: 'Groceries',
      createdAt: '2026-08-20T17:45:00.000Z'
    },
    {
      id: 'exp_alex_3',
      name: 'Equinox Gym Membership',
      amount: 85.00,
      date: '2026-08-01',
      category: 'Health & Fitness',
      createdAt: '2026-08-01T08:00:00.000Z'
    },
    {
      id: 'exp_alex_4',
      name: 'Espresso & Artisan Pastry',
      amount: 14.80,
      date: '2026-08-28',
      category: 'Food & Dining',
      createdAt: '2026-08-28T10:30:00.000Z'
    }
  ],
  'user_sarah_demo': [
    {
      id: 'exp_sarah_1',
      name: 'Figma Professional License',
      amount: 15.00,
      date: '2026-08-05',
      category: 'Software',
      createdAt: '2026-08-05T11:00:00.000Z'
    },
    {
      id: 'exp_sarah_2',
      name: 'Client Strategy Lunch',
      amount: 92.40,
      date: '2026-08-18',
      category: 'Business',
      createdAt: '2026-08-18T13:15:00.000Z'
    },
    {
      id: 'exp_sarah_3',
      name: 'Adobe Creative Cloud Suite',
      amount: 54.99,
      date: '2026-08-10',
      category: 'Software',
      createdAt: '2026-08-10T15:20:00.000Z'
    },
    {
      id: 'exp_sarah_4',
      name: 'Ergonomic Herman Miller Chair',
      amount: 380.00,
      date: '2026-08-22',
      category: 'Office',
      createdAt: '2026-08-22T16:00:00.000Z'
    }
  ]
};

const ExpenseDB = {
  /**
   * Initialize and seed database if empty
   */
  init() {
    try {
      const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!existingUsers) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
        
        // Seed default expenses for demo users
        Object.keys(SEED_EXPENSES).forEach(userId => {
          const key = `${STORAGE_KEYS.EXPENSES_PREFIX}${userId}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(SEED_EXPENSES[userId]));
          }
        });
      }
    } catch (e) {
      console.error('Failed to initialize ExpenseDB in localStorage', e);
    }
  },

  /**
   * Get all registered users
   */
  getUsers() {
    this.init();
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.error('Error fetching users', e);
      return [];
    }
  },

  /**
   * Find a user by email
   */
  getUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  /**
   * Find user by ID
   */
  getUserById(id) {
    if (!id) return null;
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  },

  /**
   * Create a new user account
   */
  createUser(userData) {
    const users = this.getUsers();
    if (this.getUserByEmail(userData.email)) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      email: userData.email.trim().toLowerCase(),
      name: userData.name.trim() || 'New User',
      password: userData.password,
      accountType: userData.accountType || 'Personal Account',
      avatar: userData.avatar || '✨',
      isDemo: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Initialize an empty expense database for this user
    const userExpensesKey = `${STORAGE_KEYS.EXPENSES_PREFIX}${newUser.id}`;
    localStorage.setItem(userExpensesKey, JSON.stringify([]));

    return newUser;
  },

  /**
   * Get all expenses for a specific user database
   */
  getUserExpenses(userId) {
    if (!userId) return [];
    try {
      const key = `${STORAGE_KEYS.EXPENSES_PREFIX}${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading user expenses', e);
      return [];
    }
  },

  /**
   * Save expenses for a specific user database
   */
  saveUserExpenses(userId, expenses) {
    if (!userId) return false;
    try {
      const key = `${STORAGE_KEYS.EXPENSES_PREFIX}${userId}`;
      localStorage.setItem(key, JSON.stringify(expenses));
      return true;
    } catch (e) {
      console.error('Error saving user expenses', e);
      return false;
    }
  },

  /**
   * Add a new expense item to the user's database
   */
  addExpense(userId, { name, amount, date, category }) {
    if (!userId) throw new Error('User authentication required.');
    if (!name || isNaN(amount) || amount <= 0 || !date) {
      throw new Error('Please provide valid name, amount, and date.');
    }

    const expenses = this.getUserExpenses(userId);
    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      date: date,
      category: category || 'General',
      createdAt: new Date().toISOString()
    };

    // Prepend new expense
    expenses.unshift(newExpense);
    this.saveUserExpenses(userId, expenses);
    return newExpense;
  },

  /**
   * Delete an expense by ID from the user's database
   */
  deleteExpense(userId, expenseId) {
    if (!userId || !expenseId) return false;
    let expenses = this.getUserExpenses(userId);
    const initialLen = expenses.length;
    expenses = expenses.filter(e => e.id !== expenseId);
    if (expenses.length !== initialLen) {
      this.saveUserExpenses(userId, expenses);
      return true;
    }
    return false;
  },

  /**
   * Calculate total expenses for a user
   */
  calculateTotal(userId) {
    const expenses = this.getUserExpenses(userId);
    const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return parseFloat(total.toFixed(2));
  },

  /**
   * Utility helper to display toast notifications
   */
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <div style="flex: 1; line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Initialize DB immediately
ExpenseDB.init();

// Export to window for global access across scripts
window.ExpenseDB = ExpenseDB;
window.STORAGE_KEYS = STORAGE_KEYS;
