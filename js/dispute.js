/**
 * ==========================================================================
 * APEXARBITRI DISPUTE TRIBUNAL BOARD MODULE
 * GLA University Mini Project-1
 * 
 * Manages evidentiary hearings, case timelines, arbitrator overrides, and verdicts.
 * Coupled via window CustomEvents: 'disputeInitiated' and 'disputeResolved'.
 * ==========================================================================
 */

const DisputeModule = (() => {
  const STORAGE_KEY = "apex_dispute_cases";

  const STATES = {
    EVIDENCE_GATHERING: "EVIDENCE_GATHERING",
    UNDER_ARBITRATION: "UNDER_ARBITRATION",
    RESOLVED_REFUND: "RESOLVED_REFUND",
    RESOLVED_RELEASE: "RESOLVED_RELEASE"
  };

  // Pre-seeded university presentation case file
  let cases = [
    {
      caseId: "DIS-404",
      contractId: "CON-7801",
      milestoneId: "M-2",
      projectTitle: "Cross-Platform Fintech Mobile App",
      clientEmail: "client@veritas.com",
      freelancerEmail: "devin@apex.com",
      freelancerName: "Devin Vance",
      contestedAmount: 1600,
      title: "Plaid & Stripe API Payment Orchestration",
      reason: "Structural delivery milestones disputed due to spec drift.",
      filedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: STATES.EVIDENCE_GATHERING,
      evidence: [
        {
          role: "Client",
          actor: "client@veritas.com",
          statement: "The freelancer failed to supply Stripe signature verification webhooks as requested in the initial Figma layout slicing.",
          attachment: "webhook-spec-drift.pdf",
          timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
        },
        {
          role: "Freelancer",
          actor: "devin@apex.com",
          statement: "Webhook requirements were added post-hoc. The API contract was fully fulfilled as defined in the original specification.",
          attachment: "stripe-build-success.log",
          timestamp: new Date(Date.now() - 3600000 * 10).toISOString()
        }
      ]
    }
  ];

  let selectedCaseId = "DIS-404";

  /**
   * Secure HTML string escaper preventing XSS
   */
  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  }

  /**
   * Helper to format currency
   */
  function formatUSD(num) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(num);
  }

  /**
   * Save and Load from localStorage
   */
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    } catch (e) {
      console.warn("⚠️ Dispute localStorage persistence error: ", e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cases = parsed;
        }
      }
    } catch (e) {
      console.warn("⚠️ Failed to load dispute cases from storage: ", e);
    }
  }

  /**
   * Resolves currently active user role
   */
  function getActiveRole() {
    if (document.body.classList.contains("role-client")) return "client";
    if (document.body.classList.contains("role-freelancer")) return "freelancer";
    if (document.body.classList.contains("role-authority")) return "authority";
    return "client"; // Default fallback
  }

  /**
   * Main module render coordinator
   */
  function render() {
    renderCasesList();
    renderCaseInspector();
  }

  /**
   * Renders Left Column: Active Disputes Case Files Ledger
   */
  function renderCasesList() {
    const container = document.getElementById("dispute-cases-container");
    if (!container) return;

    if (cases.length === 0) {
      container.innerHTML = `
        <div class="glass-card text-center py-5">
          <i class="ti ti-scale mb-2" style="font-size: 2.2rem; color: var(--color-soft-slate);"></i>
          <p class="text-muted">No disputed contracts found on the network. All escrow milestone accounts are operating normally.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = cases.map(c => {
      const isSelected = c.caseId === selectedCaseId;
      const isResolved = c.status.startsWith("RESOLVED_");
      
      let statusColor = "var(--color-crimson-red)";
      let statusBg = "var(--color-crimson-red-glow)";
      if (isResolved) {
        statusColor = "var(--color-forest-emerald)";
        statusBg = "var(--color-forest-emerald-glow)";
      } else if (c.status === STATES.UNDER_ARBITRATION) {
        statusColor = "var(--color-amber-gold)";
        statusBg = "var(--color-amber-gold-glow)";
      }

      return `
        <article class="glass-card mb-3 cursor-pointer select-case-btn" 
          data-case-id="${c.caseId}"
          style="border-color: ${isSelected ? 'var(--color-royal-blue)' : 'var(--color-soft-slate)'}; 
                 box-shadow: ${isSelected ? '0 0 0 2px var(--color-royal-blue)' : 'var(--shadow-soft)'};">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge" style="background: var(--color-royal-blue-glow); color: var(--color-royal-blue); font-family: var(--font-mono); font-size: 0.65rem;">
              ${c.caseId}
            </span>
            <span class="badge" style="color: ${statusColor}; background: ${statusBg}; font-size: 0.65rem;">
              ${c.status.replace("_", " ")}
            </span>
          </div>
          
          <h3 style="font-size: 1.1rem;" class="mb-1">${escapeHtml(c.title)}</h3>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="small text-muted">Contested: <strong style="font-family: var(--font-mono); color: var(--color-crimson-red);">${formatUSD(c.contestedAmount)}</strong></span>
            <span class="small text-muted" style="font-family: var(--font-mono); font-size: 0.7rem;">Ref: ${c.contractId}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  /**
   * Renders Right Column: Tribunal Inspector Console
   */
  function renderCaseInspector() {
    const emptyEl = document.getElementById("dispute-details-empty");
    const activeEl = document.getElementById("dispute-details-active");

    if (!emptyEl || !activeEl) return;

    const c = cases.find(item => item.caseId === selectedCaseId);
    if (!c) {
      emptyEl.classList.remove("d-none");
      activeEl.classList.add("d-none");
      return;
    }

    emptyEl.classList.add("d-none");
    activeEl.classList.remove("d-none");

    // Map inspector header references
    document.getElementById("dispute-inspect-id").textContent = c.caseId;
    document.getElementById("dispute-inspect-status").textContent = c.status.replace("_", " ");
    document.getElementById("dispute-inspect-title").textContent = c.title;
    document.getElementById("dispute-inspect-contract-ref").textContent = `Reference: Contract #${c.contractId} (Milestone: ${c.milestoneId})`;
    document.getElementById("dispute-inspect-amount").textContent = formatUSD(c.contestedAmount);
    
    // Assign initiator description
    document.getElementById("dispute-inspect-initiator").textContent = "Client Raised";

    // Set up correct status color styling on inspector
    const isResolved = c.status.startsWith("RESOLVED_");
    const statusBadge = document.getElementById("dispute-inspect-status");
    if (statusBadge) {
      if (isResolved) {
        statusBadge.style.background = "var(--color-forest-emerald)";
      } else {
        statusBadge.style.background = "var(--color-crimson-red)";
      }
    }

    // Dynamic arguments/evidence logging
    const timelineContainer = activeEl.querySelector(".arguments-timeline");
    if (timelineContainer) {
      if (c.evidence.length === 0) {
        timelineContainer.innerHTML = `
          <div class="text-center py-4 text-muted small">
            <i class="ti ti-file-analytics d-block mb-1" style="font-size: 1.5rem;"></i>
            Awaiting initial evidence submission from either client or freelancer.
          </div>
        `;
      } else {
        timelineContainer.innerHTML = c.evidence.map(e => {
          const localTimeStr = new Date(e.timestamp).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour12: true,
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          });

          const isClientEv = e.role.toLowerCase() === "client";
          const borderStyle = isClientEv ? "rgba(180, 83, 9, 0.15)" : "rgba(30, 64, 175, 0.15)";
          const initialsColor = isClientEv ? "var(--color-amber-gold)" : "var(--color-royal-blue)";

          return `
            <div class="timeline-item mb-3 pb-2 border-bottom" style="border-bottom-color: var(--color-soft-slate) !important;">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-bold" style="color: ${initialsColor};">
                  <i class="${isClientEv ? 'ti ti-building-bank' : 'ti ti-code'}"></i> ${escapeHtml(e.actor)}
                </span>
                <span class="text-muted" style="font-size: 0.72rem; font-family: var(--font-mono);">${localTimeStr}</span>
              </div>
              <p class="small text-muted mb-1" style="line-height: 1.4;">${escapeHtml(e.statement)}</p>
              ${e.attachment ? `
                <div class="small mt-1 px-2 py-0.5 rounded border bg-white d-inline-flex align-items-center gap-1" style="font-size: 0.7rem; font-family: var(--font-mono);">
                  <i class="ti ti-paperclip text-muted"></i>
                  <span class="text-secondary">${escapeHtml(e.attachment)}</span>
                </div>
              ` : ""}
            </div>
          `;
        }).join("");
      }
    }

    // Dynamic rendering of action forms and consoles based on status & role
    const rightControlArea = activeEl.querySelector(".arguments-timeline");
    if (rightControlArea) {
      // Clean up previous elements
      const existingPanel = activeEl.querySelector(".tribunal-actions-panel");
      if (existingPanel) existingPanel.remove();

      const actionsWrapper = document.createElement("div");
      actionsWrapper.className = "tribunal-actions-panel mt-4 pt-3 border-top";

      if (isResolved) {
        actionsWrapper.innerHTML = `
          <div class="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-0">
            <i class="ti ti-gavel" style="font-size: 1.25rem;"></i>
            <span><strong>Case Settled:</strong> This dispute file is closed. ${c.status === STATES.RESOLVED_REFUND ? 'Escrow refunded to Client.' : 'Escrow payout dispatched to Freelancer.'}</span>
          </div>
        `;
      } else {
        // Evidence Submission Area
        let evidenceFormHtml = `
          <form id="evidence-submission-form" class="mb-4">
            <h4 class="overline mb-3" style="font-size: 0.65rem;"><i class="ti ti-plus"></i> Append Evidence Statement</h4>
            <div class="form-field mb-2">
              <textarea class="form-control text-muted" id="tribunal-statement-input" rows="3" placeholder="State your technical facts, specifications drift, or timeline exceptions..." required style="font-size: 0.75rem; border: 1px solid var(--color-soft-slate);"></textarea>
            </div>
            <div class="form-row row g-2">
              <div class="col-8">
                <div class="input-shell">
                  <input type="text" class="form-control" id="tribunal-attachment-input" placeholder="e.g. webhook-failure.log" style="font-size: 0.75rem; border: 1px solid var(--color-soft-slate);">
                </div>
              </div>
              <div class="col-4">
                <button type="submit" class="btn btn-sm btn-primary w-100" style="background: var(--color-royal-blue); height: 100%; font-size: 0.75rem;">
                  Submit Statement
                </button>
              </div>
            </div>
          </form>
        `;

        // Verdict decisions console: visible only to Arbitrator Authority role
        let verdictConsoleHtml = `
          <div class="role-authority-only">
            <div class="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i class="ti ti-shield-alert"></i>
              <span>Select arbitrator settlement override option. Decision is binding.</span>
            </div>
            <div class="row g-2">
              <div class="col-6">
                <button class="btn btn-sm btn-outline-danger w-100 py-2 execute-verdict-btn" 
                  data-case-id="${c.caseId}" 
                  data-verdict="REFUND"
                  style="border-color: var(--color-crimson-red); color: var(--color-crimson-red); font-size: 0.72rem; font-weight: 700;">
                  <i class="ti ti-arrow-back-up"></i> Settle: Refund Client
                </button>
              </div>
              <div class="col-6">
                <button class="btn btn-sm btn-success w-100 py-2 execute-verdict-btn" 
                  data-case-id="${c.caseId}" 
                  data-verdict="RELEASE"
                  style="background-color: var(--color-forest-emerald); border-color: var(--color-forest-emerald); font-size: 0.72rem; font-weight: 700;">
                  <i class="ti ti-circle-check"></i> Settle: Payout Developer
                </button>
              </div>
            </div>
          </div>

          <div class="role-client-only role-freelancer-only">
            <div class="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-0">
              <i class="ti ti-hourglass"></i>
              <span>Evidentiary review phase. Awaiting terminal administrative arbitration.</span>
            </div>
          </div>
        `;

        actionsWrapper.innerHTML = evidenceFormHtml + verdictConsoleHtml;
      }

      rightControlArea.after(actionsWrapper);
    }
  }

  /**
   * Appends dynamic testimony statements
   */
  function handleEvidenceSubmission(e) {
    e.preventDefault();

    const c = cases.find(item => item.caseId === selectedCaseId);
    if (!c) return;

    const statementInput = document.getElementById("tribunal-statement-input");
    const attachmentInput = document.getElementById("tribunal-attachment-input");

    if (!statementInput) return;

    const statement = statementInput.value.trim();
    const attachment = attachmentInput ? attachmentInput.value.trim() : "";

    if (!statement) return;

    const isClient = getActiveRole() === "client";
    const userEmail = isClient ? "client@veritas.com" : "devin@apex.com";

    c.evidence.push({
      role: isClient ? "Client" : "Freelancer",
      actor: userEmail,
      statement: statement,
      attachment: attachment,
      timestamp: new Date().toISOString()
    });

    c.status = STATES.UNDER_ARBITRATION;
    saveState();
    render();

    // Fire audit trail
    window.dispatchEvent(new CustomEvent("auditLogged", {
      detail: {
        action: "EVIDENCE_SUBMITTED",
        actor: userEmail,
        details: `Submitted evidentiary testimony to tribunal for case ${c.caseId}.`,
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * Executes binding terminal verdict
   */
  function handleVerdictExecution(caseId, verdict) {
    const c = cases.find(item => item.caseId === caseId);
    if (!c || c.status.startsWith("RESOLVED_")) return;

    if (!confirm(`Are you sure you want to execute a binding ${verdict} decision? Contested funds will be immediately dispatched.`)) {
      return;
    }

    c.status = verdict === "REFUND" ? STATES.RESOLVED_REFUND : STATES.RESOLVED_RELEASE;
    saveState();
    render();

    // Trigger CustomEvent 'disputeResolved' to notify the safehold EscrowModule
    window.dispatchEvent(new CustomEvent("disputeResolved", {
      detail: {
        caseId: c.caseId,
        contractId: c.contractId,
        milestoneId: c.milestoneId,
        outcome: verdict,
        timestamp: new Date().toISOString()
      }
    }));

    // Audit dispatch
    window.dispatchEvent(new CustomEvent("auditLogged", {
      detail: {
        action: "TRIBUNAL_VERDICT",
        actor: "admin@apex.com",
        details: `Arbitrator closed case ${c.caseId} with binding verdict: ${verdict === 'REFUND' ? 'Refunded Client' : 'Paid Freelancer'}.`,
        timestamp: new Date().toISOString()
      }
    }));
  }

  /**
   * Consumes 'disputeInitiated' event to build a new dynamic dispute dossier
   */
  function buildDisputeFromInitiation(event) {
    const data = event.detail || {};

    const newCase = {
      caseId: data.disputeId || `DIS-${Math.floor(100 + Math.random() * 900)}`,
      contractId: data.contractId || "CON-999",
      milestoneId: data.milestoneId || "M-1",
      projectTitle: data.projectTitle || "Custom Freelance Requisition",
      clientEmail: data.clientEmail || "client@veritas.com",
      freelancerEmail: data.freelancerEmail || "devin@apex.com",
      freelancerName: data.freelancerName || "Devin Vance",
      contestedAmount: parseFloat(data.contestedAmount) || 1200,
      title: data.title || "Custom Milestone Deliverable",
      reason: "Structural delivery milestones disputed due to spec drift.",
      filedAt: data.timestamp || new Date().toISOString(),
      status: STATES.EVIDENCE_GATHERING,
      evidence: []
    };

    cases.unshift(newCase);
    selectedCaseId = newCase.caseId;
    saveState();
    render();
  }

  /**
   * Connects DOM delegate observers
   */
  function initEventListeners() {
    // Left side select list observer
    const casesCol = document.getElementById("dispute-cases-container");
    if (casesCol) {
      casesCol.addEventListener("click", (e) => {
        const btn = e.target.closest(".select-case-btn");
        if (!btn) return;
        selectedCaseId = btn.getAttribute("data-case-id");
        render();
      });
    }

    // Right side inspector delegates
    const inspectorCol = document.getElementById("dispute-details-active");
    if (inspectorCol) {
      inspectorCol.addEventListener("click", (e) => {
        // Verdict action buttons (Arbitrator authority only)
        const verdictBtn = e.target.closest(".execute-verdict-btn");
        if (verdictBtn) {
          const caseId = verdictBtn.getAttribute("data-case-id");
          const verdict = verdictBtn.getAttribute("data-verdict");
          handleVerdictExecution(caseId, verdict);
        }
      });

      // Handle submit dynamic evidence statement form
      inspectorCol.addEventListener("submit", (e) => {
        const form = e.target.closest("#evidence-submission-form");
        if (form) {
          handleEvidenceSubmission(e);
        }
      });
    }

    // Listen to incoming disputes from EscrowModule
    window.addEventListener("disputeInitiated", buildDisputeFromInitiation);
  }

  function init() {
    loadState();
    initEventListeners();
    render();
  }

  return {
    init,
    render,
    getCases: () => [...cases]
  };
})();

window.DisputeModule = DisputeModule;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => DisputeModule.init());
} else {
  DisputeModule.init();
}
