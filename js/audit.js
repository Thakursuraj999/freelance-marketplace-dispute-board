
/**
 * ==========================================================================
 * APEXARBITRI CRYPTOGRAPHIC AUDIT LEDGER MODULE
 * GLA University Mini Project-1
 *
 * Handles audit logging, SHA-256 hashing, hash chaining, persistence,
 * and statistics updates.
 * ==========================================================================
 */

const AuditModule = (() => {
  const entries = [];
  const STORAGE_KEY = "apex_audit_ledger";
  const MAX_ENTRIES = 1000;
  const GENESIS_HASH = "GENESIS";

  let initialized = false;
  let processingQueue = Promise.resolve();

  // Escape dynamic HTML to prevent XSS.
  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  }

  /**
   * Generate a genuine SHA-256 hash using Web Crypto.
   * Never return a fake hash if cryptographic hashing fails.
   */
  async function generateSHA256(message) {
    if (!globalThis.crypto?.subtle || !globalThis.TextEncoder) {
      throw new Error(
        "Web Crypto unavailable. Run the application using HTTPS or localhost."
      );
    }

    const buffer = new TextEncoder().encode(message);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);

    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Validate records restored from localStorage.
   */
  function validateEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    return (
      typeof entry.timestamp === "string" &&
      Number.isFinite(Date.parse(entry.timestamp)) &&
      typeof entry.action === "string" &&
      typeof entry.actor === "string" &&
      typeof entry.details === "string" &&
      typeof entry.hash === "string" &&
      /^[a-f0-9]{64}$/i.test(entry.hash)
    );
  }

  /**
   * Stable serialization for the hash payload.
   */
  function createPayload(entry, previousHash) {
    return JSON.stringify({
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      details: entry.details,
      previousHash
    });
  }

  /**
   * Restore records and rebuild the hash chain.
   *
   * Existing records are rehashed because legacy entries did not
   * contain previousHash links.
   */
  async function restoreEntries(storedEntries) {
    entries.length = 0;

    const validEntries = storedEntries
      .filter(validateEntry)
      .reverse()
      .slice(-MAX_ENTRIES);

    const rebuilt = [];
    let previousHash = GENESIS_HASH;

    for (const entry of validEntries) {
      const record = {
        timestamp: entry.timestamp,
        action: entry.action,
        actor: entry.actor,
        details: entry.details
      };

      const hash = await generateSHA256(
        createPayload(record, previousHash)
      );

      rebuilt.push({
        ...record,
        previousHash,
        hash
      });

      previousHash = hash;
    }

    entries.push(...rebuilt.reverse());
  }

  /**
   * Persist audit records.
   * localStorage persistence alone does not guarantee immutability.
   */
  function persistToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn("Audit ledger persistence failed:", error);
    }
  }

  /**
   * Render the existing five-column audit table.
   */
  function render() {
    const tableBody = document.getElementById("audit-table-body");
    const statCount = document.getElementById("audit-stat-count");

    if (statCount) {
      statCount.textContent = String(entries.length);
    }

    if (!tableBody) return;

    if (entries.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-5"
              style="font-family: var(--font-sans);">
            <i class="ti ti-database-off d-block mb-2"
               style="font-size: 2rem; color: var(--color-soft-slate);"></i>
            No system actions or escrow audits recorded in this session.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = entries.map(entry => {
      let badgeClass = "badge-persona-client";

      if (/ERROR|FAIL|DISPUTE/i.test(entry.action)) {
        badgeClass = "bg-danger text-white";
      } else if (/RELEASE|FUND|SUCCESS/i.test(entry.action)) {
        badgeClass = "bg-success text-white";
      } else if (/AUTH|LOGIN/i.test(entry.action)) {
        badgeClass = "bg-primary text-white";
      }

      const date = new Date(entry.timestamp);

      const timeText = Number.isNaN(date.getTime())
        ? "Invalid date"
        : date.toLocaleString("en-IN", {
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
          <td class="fw-bold"
              style="font-family: var(--font-mono); font-size: 0.75rem;">
            ${escapeHtml(timeText)}
          </td>
          <td>
            <span class="badge ${badgeClass}"
                  style="font-family: var(--font-mono); font-size: 0.65rem; padding: 4px 8px;">
              ${escapeHtml(entry.action)}
            </span>
          </td>
          <td class="small fw-semibold text-dark">
            ${escapeHtml(entry.actor)}
          </td>
          <td class="small text-muted">
            ${escapeHtml(entry.details)}
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.7rem;
                     color: var(--text-muted); word-break: break-all;">
            <code class="text-dark bg-light px-1 rounded"
                  title="${escapeHtml(entry.hash)}">
              ${escapeHtml(entry.hash.slice(0, 32))}...
            </code>
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Process events sequentially to avoid hash-ordering problems.
   */
  async function processEvent(detail) {
    const action =
      typeof detail.action === "string" && detail.action.trim()
        ? detail.action.trim()
        : "SYSTEM_EVENT";

    const actor =
      typeof detail.actor === "string" && detail.actor.trim()
        ? detail.actor.trim()
        : "anonymous@apex.com";

    const details =
      typeof detail.details === "string"
        ? detail.details
        : "System status event updated.";

    const timestamp =
      typeof detail.timestamp === "string" &&
      Number.isFinite(Date.parse(detail.timestamp))
        ? detail.timestamp
        : new Date().toISOString();

    const record = { timestamp, action, actor, details };

    const previousHash = entries.length
      ? entries[0].hash
      : GENESIS_HASH;

    const hash = await generateSHA256(
      createPayload(record, previousHash)
    );

    entries.unshift({
      ...record,
      previousHash,
      hash
    });

    if (entries.length > MAX_ENTRIES) {
      entries.length = MAX_ENTRIES;
    }

    persistToStorage();
    render();
  }

  /**
   * Global auditLogged event listener.
   */
  function handleAuditLoggedEvent(event) {
    const detail = event.detail || {};

    processingQueue = processingQueue
      .then(() => processEvent(detail))
      .catch(error => {
        console.error("Audit event processing failed:", error);
      });
  }

  /**
   * Initialize once and restore the saved ledger.
   */
  function init() {
    if (initialized) {
      render();
      return;
    }

    initialized = true;

    let storedEntries = [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw !== null) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          storedEntries = parsed;
        } else {
          console.warn("Invalid audit ledger format.");
        }
      }
    } catch (error) {
      console.warn("Audit ledger restoration failed:", error);
    }

    // Restore first; queued events will be processed afterward.
    processingQueue = restoreEntries(storedEntries)
      .then(() => {
        persistToStorage();
        render();
      })
      .catch(error => {
        console.error("Audit ledger initialization failed:", error);
        entries.length = 0;
        render();
      });

    window.addEventListener("auditLogged", handleAuditLoggedEvent);
  }

  /**
   * Verify the in-memory hash chain.
   */
  async function verifyChain() {
    await processingQueue;

    try {
      let previousHash = GENESIS_HASH;

      for (const entry of [...entries].reverse()) {
        if (entry.previousHash !== previousHash) {
          return false;
        }

        const expectedHash = await generateSHA256(
          createPayload(entry, previousHash)
        );

        if (expectedHash !== entry.hash) {
          return false;
        }

        previousHash = entry.hash;
      }

      return true;
    } catch (error) {
      console.error("Hash chain verification failed:", error);
      return false;
    }
  }

  return {
    init,
    render,
    getEntries: () => entries.map(entry => ({ ...entry })),
    verifyChain
  };
})();

window.AuditModule = AuditModule;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => AuditModule.init());
} else {
  AuditModule.init();
}

