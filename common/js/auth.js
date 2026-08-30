/**
 * Expense List - User Authentication & Session Manager
 * Manages user logins, registration, session persistence, and authorization guards.
 */

const AuthService = {
  /**
   * Get current authenticated user session
   */
  getCurrentUser() {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!sessionData) return null;
      const parsed = JSON.parse(sessionData);
      
      // Verify user still exists in database
      const user = ExpenseDB.getUserById(parsed.id);
      return user || null;
    } catch (e) {
      console.error('Failed to get current user session', e);
      return null;
    }
  },

  /**
   * Check if any user is currently authenticated
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Authenticate user with email and password
   */
  login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email address and password.');
    }

    const user = ExpenseDB.getUserByEmail(email);
    if (!user) {
      throw new Error('No user account found with this email address.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    // Set active session
    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    return user;
  },

  /**
   * Register a new user and log them in
   */
  register({ name, email, password, accountType }) {
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const newUser = ExpenseDB.createUser({
      name,
      email,
      password,
      accountType
    });

    // Auto-login newly registered user
    this.login(email, password);
    return newUser;
  },

  /**
   * Quick-login helper for demo accounts only
   */
  demoLogin(demoEmail) {
    const user = ExpenseDB.getUserByEmail(demoEmail);
    if (!user) {
      throw new Error(`Demo user ${demoEmail} not found.`);
    }
    const isDemoAccount = user.isDemo || user.id === 'user_alex_demo' || user.id === 'user_sarah_demo';
    if (!isDemoAccount) {
      throw new Error('Access Denied: Password verification is required for private user databases.');
    }
    return this.login(user.email, user.password);
  },

  /**
   * Log out active user
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  },

  /**
   * Guard for protected pages (e.g., App Dashboard)
   */
  requireAuth(redirectUrl = '../home/index.html') {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = redirectUrl;
      return null;
    }
    return user;
  },

  /**
   * Guard for guest-only pages (e.g., redirect to dashboard if already logged in)
   */
  redirectIfAuthenticated(targetUrl = '../app/index.html') {
    const user = this.getCurrentUser();
    if (user) {
      window.location.href = targetUrl;
    }
  }
};

// Export to window
window.AuthService = AuthService;
