
/**
 * ==========================================================================
 * APEXARBITRI CENTRAL APPLICATIONS ORCHESTRATOR
 * GLA University Mini Project-1
 *
 * Manages identity authentication, dynamic RBAC views, tab panel navigation,
 * and global event routing synchronization.
 * ==========================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Centralized login and layout DOM elements
  const loginForm = document.getElementById("login-form");
  const loginUserId = document.getElementById("login-user-id");
  const loginPassword = document.getElementById("login-password");
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  const errorAlert = document.getElementById("login-error-alert");

  // ApexArbitri-specific storage keys
  const SESSION_KEYS = ["apex_user_email", "apex_user_role"];

  // Dynamic user data matrix (preserved for demo compatibility)
  const USERS = {
    "client@veritas.com": {
      pass: "admin123",
      role: "client",
      name: "Veritas Enterprises",
      initials: "CLI"
    },
    "devin@apex.com": {
      pass: "dev123",
      role: "freelancer",
      name: "Devin Vance",
      initials: "DEV"
    },
    "admin@apex.com": {
      pass: "super123",
      role: "authority",
      name: "Apex Arbitrator",
      initials: "ARB"
    }
  };

  const MODULES = {
    marketplace: "MarketplaceModule",
    escrow: "EscrowModule",
    dispute: "DisputeModule",
    audit: "AuditModule"
  };

  const PANEL_CONTENT = {
    marketplace: {
      title: "Marketplace <em>&amp; Bidding</em>",
      description:
        "Source exceptional talent, secure every milestone, and keep each agreement transparent."
    },
    escrow: {
      title: "Milestone <em>Escrow Safeholds</em>",
      description:
        "Monitor protected contracts, execute payments, and handle deliverables under fiduciary safety."
    },
    dispute: {
      title: "Dispute <em>Tribunal Board</em>",
      description:
        "Inspect open cases, submit evidentiary arguments, and execute binding arbitrator awards."
    },
    audit: {
      title: "Audit <em>Ledger Logs</em>",
      description:
        "Cryptographically inspect immutable hashes, verification keys, and system wide trails."
    }
  };

  /**
   * Safely read a session from one storage source.
   * Invalid or inaccessible storage returns null.
   */
  function readStoredSession(storage) {
    try {
      const email = storage.getItem("apex_user_email");
      const role = storage.getItem("apex_user_role");

      if (!email || !role || !USERS[email]) return null;

      // Never trust a stored role over the configured user role.
      if (USERS[email].role !== role) return null;

      return { email, role };
    } catch (error) {
      console.warn("Unable to read ApexArbitri session storage.", error);
      return null;
    }
  }

  /**
   * Safely remove only ApexArbitri-owned session keys.
   */
  function clearStoredSession() {
    [localStorage, sessionStorage].forEach(storage => {
      SESSION_KEYS.forEach(key => {
        try {
          storage.removeItem(key);
        } catch (error) {
          console.warn(`Unable to remove session key: ${key}`, error);
        }
      });
    });
  }

  /**
   * Safely render a module without blocking other modules.
   * Existing module interfaces remain unchanged.
   */
  function renderModule(moduleName) {
    const globalName = MODULES[moduleName];
    if (!globalName) return;

    try {
      const module = window[globalName];

      if (module && typeof module.render === "function") {
        module.render();
      }
    } catch (error) {
      console.error(`Failed to render ${moduleName} module:`, error);
    }
  }

  /**
   * Render all existing modules after authentication.
   */
  function renderAllModules() {
    Object.keys(MODULES).forEach(renderModule);
  }

  /**
   * Update the session header without rebuilding its existing DOM.
   */
  function updateSessionHeader(user) {
    const nameEl = document.getElementById("session-user-name");
    const initialsEl = document.getElementById("session-initials");
    const badgeEl = document.getElementById("session-user-badge");

    if (nameEl) nameEl.textContent = user.name;
    if (initialsEl) initialsEl.textContent = user.initials;

    if (badgeEl) {
      // Update an existing role badge instead of replacing the whole header.
      let roleBadge = badgeEl.querySelector('[class*="badge-persona-"]');

      if (roleBadge) {
        roleBadge.classList.remove(
          "badge-persona-client",
          "badge-persona-freelancer",
          "badge-persona-authority"
        );

        roleBadge.classList.add(`badge-persona-${user.role}`);
        roleBadge.textContent = user.role.toUpperCase();
      } else {
        // Fallback for existing HTML that does not contain a role badge.
        roleBadge = document.createElement("span");
        roleBadge.className = `badge-persona-${user.role}`;
        roleBadge.textContent = user.role.toUpperCase();
        badgeEl.appendChild(roleBadge);
      }
    }
  }

  /**
   * Log authentication and logout events through the existing audit event.
   */
  function logAuditEvent(action, actor, details) {
    try {
      window.dispatchEvent(
        new CustomEvent("auditLogged", {
          detail: {
            action,
            actor,
            details,
            timestamp: new Date().toISOString()
          }
        })
      );
    } catch (error) {
      console.warn("Unable to dispatch audit event.", error);
    }
  }

  /**
   * Evaluates and applies user session permissions across the global DOM.
   */
  function applyUserSession(user, email) {
    if (!appShell || !loginScreen) return;

    loginScreen.classList.add("d-none");
    appShell.classList.remove("d-none");
    appShell.classList.remove("is-locked");

    // Apply role-based presentation classes.
    document.body.classList.remove(
      "role-client",
      "role-freelancer",
      "role-authority"
    );

    document.body.classList.add(`role-${user.role}`);

    // Update the existing header elements.
    updateSessionHeader(user);

    // Re-render modules independently.
    renderAllModules();

    // Record successful authentication.
    logAuditEvent(
      "USER_AUTHENTICATED",
      email,
      `Secure session initialized for role level: '${user.role.toUpperCase()}'.`
    );
  }

  /**
   * Resume a valid session from localStorage or sessionStorage.
   */
  function resumeActiveSession() {
    // Prefer a valid remembered session.
    let cachedSession = readStoredSession(localStorage);

    if (!cachedSession) {
      cachedSession = readStoredSession(sessionStorage);
    }

    if (cachedSession) {
      applyUserSession(
        USERS[cachedSession.email],
        cachedSession.email
      );
    } else {
      // Remove stale or mismatched ApexArbitri session information.
      clearStoredSession();
    }
  }

  /**
   * Validate credentials and initialize the session.
   */
  function handleLogin(email, password, remember) {
    const user = USERS[email];

    // Do not trim the password; spaces may be part of a valid password.
    if (!user || user.pass !== password) {
      if (errorAlert) {
        errorAlert.classList.remove("d-none");
        errorAlert.classList.add("is-visible");
      }

      const card = document.querySelector(".login-card");

      if (card) {
        card.classList.add("shake-animation");

        setTimeout(() => {
          card.classList.remove("shake-animation");
        }, 400);
      }

      return;
    }

    if (errorAlert) {
      errorAlert.classList.add("d-none");
      errorAlert.classList.remove("is-visible");
    }

    // Clear previous sessions to prevent conflicting stored identities.
    clearStoredSession();

    // Persist the session in the selected storage only.
    try {
      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("apex_user_email", email);
      storage.setItem("apex_user_role", user.role);
    } catch (error) {
      // The current login can still proceed if storage is unavailable.
      console.warn("Session could not be persisted.", error);
    }

    applyUserSession(user, email);
  }

  /**
   * Terminal logout processing.
   */
  function executeLogout() {
    let activeEmail = "anonymous@apex.com";

    const activeSession =
      readStoredSession(localStorage) ||
      readStoredSession(sessionStorage);

    if (activeSession) {
      activeEmail = activeSession.email;
    }

    logAuditEvent(
      "SESSION_TERMINATED",
      activeEmail,
      "User signed out. Clearing ApexArbitri session state."
    );

    clearStoredSession();

    document.body.classList.remove(
      "role-client",
      "role-freelancer",
      "role-authority"
    );

    if (appShell) {
      appShell.classList.add("d-none");
      appShell.classList.remove("is-locked");
    }

    if (loginScreen) {
      loginScreen.classList.remove("d-none");
    }

    if (loginForm) loginForm.reset();

    if (errorAlert) {
      errorAlert.classList.add("d-none");
      errorAlert.classList.remove("is-visible");
    }
  }

  // Bind standard login form submission.
  if (loginForm) {
    loginForm.addEventListener("submit", event => {
      event.preventDefault();

      if (!loginUserId || !loginPassword) return;

      const email = loginUserId.value.trim().toLowerCase();
      const password = loginPassword.value;
      const remember =
        document.getElementById("remember-session")?.checked || false;

      handleLogin(email, password, remember);
    });
  }

  // Bind logout button.
  const logoutBtn = document.getElementById("logout-button");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", executeLogout);
  }

  // Bind interactive demo login buttons.
  const demoAccounts = {
    "demo-client-btn": {
      email: "client@veritas.com",
      password: "admin123"
    },
    "demo-freelancer-btn": {
      email: "devin@apex.com",
      password: "dev123"
    },
    "demo-authority-btn": {
      email: "admin@apex.com",
      password: "super123"
    }
  };

  Object.entries(demoAccounts).forEach(([buttonId, account]) => {
    const button = document.getElementById(buttonId);

    if (button) {
      button.addEventListener("click", () => {
        if (loginUserId) loginUserId.value = account.email;
        if (loginPassword) loginPassword.value = account.password;

        handleLogin(account.email, account.password, false);
      });
    }
  });

  // Bind dynamic tab switching controls.
  const tabButtons = document.querySelectorAll(".module-tab");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Ignore unknown tab names.
      if (!Object.prototype.hasOwnProperty.call(MODULES, targetTab)) {
        return;
      }

      // Update selected tab state.
      tabButtons.forEach(tab => {
        const isCurrent = tab.getAttribute("data-tab") === targetTab;

        tab.classList.toggle("active", isCurrent);
        tab.setAttribute("aria-selected", isCurrent ? "true" : "false");
      });

      // Update visible workspace panels.
      document.querySelectorAll(".workspace-panel").forEach(panel => {
        const isCurrentPanel = panel.id === `${targetTab}-panel`;

        panel.classList.toggle("active", isCurrentPanel);
        panel.classList.toggle("d-none", !isCurrentPanel);
      });

      // Update workspace header.
      const pageTitle = document.getElementById("active-panel-title");
      const pageDesc = document.getElementById("active-panel-desc");
      const content = PANEL_CONTENT[targetTab];

      if (pageTitle && content) {
        pageTitle.innerHTML = content.title;
      }

      if (pageDesc && content) {
        pageDesc.textContent = content.description;
      }

      // Re-render the selected module using its existing interface.
      renderModule(targetTab);
    });
  });

  /**
   * Global helper for cross-panel navigation.
   * Supports both "marketplace" and "marketplace-panel".
   */
  window.showWorkspacePanel = function(panelName) {
    if (typeof panelName !== "string") return;

    const normalizedName = panelName.replace(/-panel$/, "");

    if (!Object.prototype.hasOwnProperty.call(MODULES, normalizedName)) {
      return;
    }

    const targetTabBtn = document.querySelector(
      `.module-tab[data-tab="${normalizedName}"]`
    );

    if (targetTabBtn) {
      targetTabBtn.click();
    }
  };

  // Run initial boot routine.
  resumeActiveSession();
});


