document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  const loginForm = document.getElementById("login-form");
  const loginErrorAlert = document.getElementById("login-error-alert");
  const rememberSession = document.getElementById("remember-session");

  const credentials = {
    "client@veritas.com": {
      password: "admin123",
      role: "client"
    },
    "devin@apex.com": {
      password: "dev123",
      role: "freelancer"
    }
  };

  function recordAuditAction(username) {
    const auditEntries = JSON.parse(localStorage.getItem("apex_audit_ledger") || "[]");

    auditEntries.unshift({
      action: "USER_LOGGED_IN",
      username,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem("apex_audit_ledger", JSON.stringify(auditEntries.slice(0, 50)));
  }

  function applyUserSession(role) {
    loginScreen.setAttribute("hidden", "");
    appShell.classList.remove("is-locked");
    document.body.dataset.userRole = role;
  }

  window.applyUserSession = applyUserSession;

  const savedRole = localStorage.getItem("apex_user_role");

  if (savedRole === "client" || savedRole === "freelancer") {
    applyUserSession(savedRole);
  } else {
    loginScreen.removeAttribute("hidden");
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loginErrorAlert.classList.remove("is-visible");

    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    const username = document.getElementById("login-user-id").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    const account = credentials[username];

    if (!account || account.password !== password) {
      loginErrorAlert.classList.remove("is-visible");
      void loginErrorAlert.offsetWidth;
      loginErrorAlert.classList.add("is-visible");
      return;
    }

    if (rememberSession.checked) {
      localStorage.setItem("apex_user_role", account.role);
    } else {
      sessionStorage.setItem("apex_user_role", account.role);
    }

    recordAuditAction(username);
    applyUserSession(account.role);
  });
});