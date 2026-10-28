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

  // Dynamic user data matrix
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

  /**
   * Evaluates and applies user session permissions across the global DOM
   */
  function applyUserSession(user, email) {
    if (!appShell || !loginScreen) return;

    // Remove old state locks and display the application shell
    loginScreen.classList.add("d-none");
    appShell.classList.remove("d-none");
    appShell.classList.remove("is-locked");

    // Enforce Role-Based Access Control (RBAC) classes on the document body
    document.body.classList.remove("role-client", "role-freelancer", "role-authority");
    document.body.classList.add(`role-${user.role}`);

    // Update session header visual components
    const nameEl = document.getElementById("session-user-name");
    const initialsEl = document.getElementById("session-initials");
    const badgeEl = document.getElementById("session-user-badge");

    if (nameEl) nameEl.textContent = user.name;
    if (initialsEl) initialsEl.textContent = user.initials;

    if (badgeEl) {
      // Re-style and populate role badge
      badgeEl.innerHTML = `
        <span class="profile-initials" id="session-initials">${user.initials}</span>
        <span id="session-user-name" class="me-2">${user.name}</span>
        <span class="badge-persona-${user.role}">${user.role.toUpperCase()}</span>
      `;
    }

    // Trigger re-renders across all active sub-panels to update conditional role elements
    if (window.MarketplaceModule) window.MarketplaceModule.render();
    if (window.EscrowModule) window.EscrowModule.render();
    if (window.DisputeModule) window.DisputeModule.render();
    if (window.AuditModule) window.AuditModule.render();

    // Log authentication event
    window.dispatchEvent(new CustomEvent("auditLogged", {
      detail: {
        action: "USER_AUTHENTICATED",
        actor: email,
        details: `Secure session locked for role level: '${user.role.toUpperCase()}'.`,
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * Auto-resumes active session if cached in local storage
   */
  function resumeActiveSession() {
    try {
      const cachedEmail = localStorage.getItem("apex_user_email") || sessionStorage.getItem("apex_user_email");
      const cachedRole = localStorage.getItem("apex_user_role") || sessionStorage.getItem("apex_user_role");

      if (cachedEmail && cachedRole && USERS[cachedEmail]) {
        applyUserSession(USERS[cachedEmail], cachedEmail);
      }
    } catch (e) {
      console.warn("⚠️ Failed to parse auto-resume user session storage.", e);
    }
  }

  /**
   * Validates submitted credentials
   */
  function handleLogin(email, password, remember) {
    const user = USERS[email];

    if (user && user.pass === password) {
      if (errorAlert) errorAlert.classList.add("d-none");

      // Cache details in storage
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem("apex_user_email", email);
      storage.setItem("apex_user_role", user.role);

      applyUserSession(user, email);
    } else {
      // Access Denied: Trigger shake animations
      if (errorAlert) {
        errorAlert.classList.remove("d-none");
        errorAlert.classList.add("is-visible");
      }
      
      const card = document.querySelector(".login-card");
      if (card) {
        card.classList.add("shake-animation");
        setTimeout(() => card.classList.remove("shake-animation"), 400);
      }
    }
  }

  /**
   * Terminal logout processing
   */
  function executeLogout() {
    const activeEmail = localStorage.getItem("apex_user_email") || sessionStorage.getItem("apex_user_email") || "anonymous@apex.com";

    // Track closed session state
    window.dispatchEvent(new CustomEvent("auditLogged", {
      detail: {
        action: "SESSION_TERMINATED",
        actor: activeEmail,
        details: "User signed out. Purging state descriptors.",
        timestamp: new Date().toISOString()
      }
    }));

    // Clear system settings
    localStorage.removeItem("apex_user_email");
    localStorage.removeItem("apex_user_role");
    sessionStorage.clear();

    document.body.classList.remove("role-client", "role-freelancer", "role-authority");

    if (appShell) appShell.classList.add("d-none");
    if (loginScreen) loginScreen.classList.remove("d-none");
    if (loginForm) loginForm.reset();
    if (errorAlert) errorAlert.classList.add("d-none");
  }

  // Bind Standard Login Form Submission
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginUserId.value.trim().toLowerCase();
      const password = loginPassword.value.trim();
      const remember = document.getElementById("remember-session")?.checked || false;

      handleLogin(email, password, remember);
    });
  }

  // Bind Logout Button Actions
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", executeLogout);
  }

  // Bind Interactive Demo Keys click handlers
  const demoClient = document.getElementById("demo-client-btn");
  const demoFreelancer = document.getElementById("demo-freelancer-btn");
  const demoAuthority = document.getElementById("demo-authority-btn");

  if (demoClient) {
    demoClient.addEventListener("click", () => {
      if (loginUserId && loginPassword) {
        loginUserId.value = "client@veritas.com";
        loginPassword.value = "admin123";
        handleLogin("client@veritas.com", "admin123", false);
      }
    });
  }

  if (demoFreelancer) {
    demoFreelancer.addEventListener("click", () => {
      if (loginUserId && loginPassword) {
        loginUserId.value = "devin@apex.com";
        loginPassword.value = "dev123";
        handleLogin("devin@apex.com", "dev123", false);
      }
    });
  }

  if (demoAuthority) {
    demoAuthority.addEventListener("click", () => {
      if (loginUserId && loginPassword) {
        loginUserId.value = "admin@apex.com";
        loginPassword.value = "super123";
        handleLogin("admin@apex.com", "super123", false);
      }
    });
  }

  // Bind Dynamic Tab Switching Controls
  const tabButtons = document.querySelectorAll(".module-tab");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      // Update active tabs
      tabButtons.forEach(b => {
        const isCurrent = b.getAttribute("data-tab") === targetTab;
        b.classList.toggle("active", isCurrent);
        b.setAttribute("aria-selected", isCurrent ? "true" : "false");
      });

      // Update active panels
      const panels = document.querySelectorAll(".workspace-panel");
      panels.forEach(p => {
        const isCurrentPanel = p.id === `${targetTab}-panel`;
        p.classList.toggle("active", isCurrentPanel);
        p.classList.toggle("d-none", !isCurrentPanel);
      });

      // Swap Workspace Header Titles and Sub-titles
      const pageTitle = document.getElementById("active-panel-title");
      const pageDesc = document.getElementById("active-panel-desc");

      if (pageTitle && pageDesc) {
        if (targetTab === "marketplace") {
          pageTitle.innerHTML = "Marketplace <em>&amp; Bidding</em>";
          pageDesc.textContent = "Source exceptional talent, secure every milestone, and keep each agreement transparent.";
        } else if (targetTab === "escrow") {
          pageTitle.innerHTML = "Milestone <em>Escrow Safeholds</em>";
          pageDesc.textContent = "Monitor protected contracts, execute payments, and handle deliverables under fiduciary safety.";
        } else if (targetTab === "dispute") {
          pageTitle.innerHTML = "Dispute <em>Tribunal Board</em>";
          pageDesc.textContent = "Inspect open cases, submit evidentiary arguments, and execute binding arbitrator awards.";
        } else if (targetTab === "audit") {
          pageTitle.innerHTML = "Audit <em>Ledger Logs</em>";
          pageDesc.textContent = "Cryptographically inspect immutable hashes, verification keys, and system wide trails.";
        }
      }

      // Re-trigger visual sub-render blocks to sync views instantly
      if (targetTab === "marketplace" && window.MarketplaceModule) window.MarketplaceModule.render();
      if (targetTab === "escrow" && window.EscrowModule) window.EscrowModule.render();
      if (targetTab === "dispute" && window.DisputeModule) window.DisputeModule.render();
      if (targetTab === "audit" && window.AuditModule) window.AuditModule.render();
    });
  });

  // Global helper namespace declaration to support cross-panel navigation jumps
  window.showWorkspacePanel = function(panelName) {
    const targetTabBtn = document.querySelector(`.module-tab[data-tab="${panelName.replace("-panel", "")}"]`);
    if (targetTabBtn) {
      targetTabBtn.click();
    }
  };

  // Run initial boot routine
  resumeActiveSession();
});
