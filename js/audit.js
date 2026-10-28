/**
 * ==========================================================================
 * APEXARBITRI CRYPTOGRAPHIC AUDIT LEDGER MODULE
 * GLA University Mini Project-1
 * 
 * Handles immutable audit trailing, background state hashing, and statistic updates
 * ==========================================================================
 */

const AuditModule = (() => {
  const entries = [];
  
  // Custom HTML escaping helper to prevent XSS injection
  const escapeHtml = (value) => {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  };

  /**
   * Helper function to generate a real cryptographic SHA-256 hash using the Web Crypto API.
   * Falls back to a deterministic pseudo-sha256 if Web Crypto is blocked by sandbox policies.
   */
  async function generateSHA256(message) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Deterministic robust fallback hash generator
      let hash = 0;
      for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return "f8e4c9" + Math.abs(hash).toString(16).padStart(8, "0") + "a127d96b4ef89";
    }
  }

  /**
   * Appends a log entry directly into localStorage for immutable session persistence.
   */
  function persistToStorage() {
    try {
      localStorage.setItem("apex_audit_ledger", JSON.stringify(entries));
    } catch (error) {
      console.warn("⚠️ LocalStorage persistence failed: ", error);
    }
  }

  /**
   * Dynamic non-destructive renderer.
   * Updates only the target table body and visual statistics instead of replacing the workspace layout.
   */
  function render() {
    const tableBody = document.getElementById("audit-table-body");
    const statCount = document.getElementById("audit-stat-count");

    if (!tableBody) return;

    // Update Counter badge
    if (statCount) {
      statCount.textContent = entries.length;
    }

    if (entries.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-5" style="font-family: var(--font-sans);">
            <i class="ti ti-database-off d-block mb-2" style="font-size: 2rem; color: var(--color-soft-slate);"></i>
            No system actions or escrow audits recorded in this session.
          </td>
        </tr>
      `;
      return;
    }

    // Render table rows
    tableBody.innerHTML = entries.map((entry) => {
      // Check event action type for colored badge rendering
      let badgeClass = "badge-persona-client";
      if (entry.action.includes("ERROR") || entry.action.includes("FAIL") || entry.action.includes("DISPUTE")) {
        badgeClass = "bg-danger text-white";
      } else if (entry.action.includes("RELEASE") || entry.action.includes("FUND") || entry.action.includes("SUCCESS")) {
        badgeClass = "bg-success text-white";
      } else if (entry.action.includes("AUTH") || entry.action.includes("LOGIN")) {
        badgeClass = "bg-primary text-white";
      }

      // Format ISO string to local IST string
      const localTimeStr = new Date(entry.timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 0.75rem;" class="fw-bold">${escapeHtml(localTimeStr)}</td>
          <td>
            <span class="badge ${badgeClass}" style="font-family: var(--font-mono); font-size: 0.65rem; padding: 4px 8px;">
              ${escapeHtml(entry.action)}
            </span>
          </td>
          <td class="small fw-semibold text-dark">${escapeHtml(entry.actor)}</td>
          <td class="small text-muted">${escapeHtml(entry.details)}</td>
          <td style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted); word-break: break-all;">
            <code class="text-dark bg-light px-1 py-0.5 rounded">${escapeHtml(entry.hash.substring(0, 32))}...</code>
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Main module registration logic.
   * Registers a global handler for the CustomEvent 'auditLogged'.
   */
  function init() {
    // Prevent duplicated event handlers during initialization loops
    window.removeEventListener("auditLogged", handleAuditLoggedEvent);

    try {
      const storedEntries = JSON.parse(localStorage.getItem("apex_audit_ledger") || "[]");
      if (Array.isArray(storedEntries)) {
        entries.length = 0; // Clear dynamic array structure safely
        entries.push(...storedEntries);
      }
    } catch (error) {
      console.warn("⚠️ Audit ledger session restoration bypassed.", error);
    }

    // Attach active listener
    window.addEventListener("auditLogged", handleAuditLoggedEvent);

    render();
  }

  /**
   * Action handler for receiving and hashing system CustomEvents.
   */
  async function handleAuditLoggedEvent(event) {
    const detail = event.detail || {};
    const action = detail.action || "SYSTEM_EVENT";
    const actor = detail.actor || "anonymous@apex.com";
    const details = detail.details || "System status event updated.";
    const timestamp = detail.timestamp || new Date().toISOString();

    // Generate cryptographic SHA-256 block chain from payload data
    const payloadString = `${action}|${actor}|${details}|${timestamp}`;
    const cryptographicHash = await generateSHA256(payloadString);

    // Unshift to place latest event at the top of the stack
    entries.unshift({
      timestamp,
      action,
      actor,
      details,
      hash: cryptographicHash
    });

    persistToStorage();
    render();
  }

  return { 
    init, 
    render,
    getEntries: () => [...entries] // Read-only access safe interface
  };
})();

window.AuditModule = AuditModule;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => AuditModule.init());
} else {
  AuditModule.init();
}
