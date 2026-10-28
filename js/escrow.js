const EscrowModule = (() => {
  const STATES = {
    PENDING_FUNDING: "pending_funding",
    IN_ESCROW: "in_escrow",
    UNDER_REVIEW: "under_review",
    DISPUTED: "disputed",
    RELEASED: "released"
  };

  const MILESTONE_TEMPLATE = [
    { id: "M-1", title: "UI Architecture & Figma Slicing", ratio: 0.3 },
    { id: "M-2", title: "Plaid & Stripe API Payment Orchestration", ratio: 0.4 },
    { id: "M-3", title: "Biometric Hardware Vault Integration", ratio: 0.3 }
  ];

  let contract = {
    id: "AA-2026-001",
    project: "Cross-Platform Fintech Mobile App",
    client: "Aetheric Digital Ltd.",
    freelancer: "Arjun Mehta",
    totalBudget: 4200,
    milestones: [
      { id: "M-1", title: MILESTONE_TEMPLATE[0].title, amount: 1200, status: STATES.RELEASED },
      { id: "M-2", title: MILESTONE_TEMPLATE[1].title, amount: 1500, status: STATES.IN_ESCROW },
      { id: "M-3", title: MILESTONE_TEMPLATE[2].title, amount: 1500, status: STATES.PENDING_FUNDING }
    ]
  };

  const escapeHtml = (value) => {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  };

  const formatAmount = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  function getRole() {
    return document.body.dataset.userRole || "client";
  }

  function emitAudit(action, details, milestone) {
    window.dispatchEvent(new CustomEvent("auditLogged", {
      detail: {
        action,
        details,
        milestoneId: milestone.id,
        timestamp: new Date().toISOString()
      }
    }));
  }

  function getStatusLabel(status) {
    return {
      [STATES.PENDING_FUNDING]: "Pending funding",
      [STATES.IN_ESCROW]: "In escrow",
      [STATES.UNDER_REVIEW]: "Under review",
      [STATES.DISPUTED]: "Disputed",
      [STATES.RELEASED]: "Released"
    }[status] || status;
  }

  function getStatusClass(status) {
    return {
      [STATES.IN_ESCROW]: "badge-escrow",
      [STATES.PENDING_FUNDING]: "badge-pending",
      [STATES.UNDER_REVIEW]: "badge-review",
      [STATES.DISPUTED]: "badge-disputed",
      [STATES.RELEASED]: "badge-released"
    }[status] || "badge-pending";
  }

  function getProgress(status) {
    return {
      [STATES.PENDING_FUNDING]: 0,
      [STATES.IN_ESCROW]: 33,
      [STATES.UNDER_REVIEW]: 66,
      [STATES.DISPUTED]: 66,
      [STATES.RELEASED]: 100
    }[status] || 0;
  }

  function getMilestoneAction(milestone) {
    const role = getRole();

    if (milestone.status === STATES.PENDING_FUNDING && role === "client") {
      return { label: `Deposit ${formatAmount(milestone.amount)} to Escrow`, next: STATES.IN_ESCROW };
    }

    if (milestone.status === STATES.IN_ESCROW && role === "freelancer") {
      return { label: "Submit Work Deliverable", next: STATES.UNDER_REVIEW };
    }

    if (milestone.status === STATES.UNDER_REVIEW && role === "client") {
      return { label: `Approve & Release ${formatAmount(milestone.amount)}`, next: STATES.RELEASED };
    }

    return null;
  }

  function renderProgress(status) {
    const states = [STATES.PENDING_FUNDING, STATES.IN_ESCROW, STATES.UNDER_REVIEW, STATES.RELEASED];
    const currentIndex = states.indexOf(status);

    return states.map((state, index) => {
      const completed = index < currentIndex;
      const active = index === currentIndex || (status === STATES.DISPUTED && index === 2);
      const color = completed ? "#047857" : active ? "#b45309" : "#e2e8f0";
      return `<span class="escrow-step ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}" style="--step-color:${color}" title="${escapeHtml(getStatusLabel(state))}"></span>`;
    }).join("");
  }

  function renderMilestone(milestone) {
    const action = getMilestoneAction(milestone);
    const disputedAction = milestone.status === STATES.UNDER_REVIEW && getRole() === "client";
    return `
      <article class="milestone-card p-4 rounded-4">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <span class="text-secondary small font-monospace">${escapeHtml(milestone.id)}</span>
            <h3 class="text-primary fw-bold h5 mt-1 mb-0">${escapeHtml(milestone.title)}</h3>
          </div>
          <span class="status-badge ${getStatusClass(milestone.status)}">${escapeHtml(getStatusLabel(milestone.status))}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-4">
          <span class="text-secondary small">Milestone escrow value</span>
          <strong class="font-monospace text-success fw-bold">${formatAmount(milestone.amount)}</strong>
        </div>
        <div class="escrow-progress mt-3" aria-label="${escapeHtml(milestone.id)} progress">
          ${renderProgress(milestone.status)}
        </div>
        <div class="d-flex justify-content-between mt-2">
          <span class="text-secondary small">Lifecycle progress</span>
          <strong class="font-monospace text-success fw-bold">${getProgress(milestone.status)}%</strong>
        </div>
        ${action || disputedAction ? `
          <div class="d-grid gap-2 mt-4">
            ${action ? `<button class="btn btn-primary-custom fw-bold" type="button" data-milestone-id="${milestone.id}" data-next-state="${action.next}">${escapeHtml(action.label)}</button>` : ""}
            ${disputedAction ? `<button class="btn btn-outline-danger fw-bold" type="button" data-dispute-id="${milestone.id}">Raise Dispute</button>` : ""}
          </div>
        ` : milestone.status === STATES.RELEASED ? `<p class="text-success fw-bold small mt-4 mb-0"><i class="ti ti-circle-check me-1"></i>Funds released to freelancer.</p>` : ""}
      </article>
    `;
  }

  function render() {
    const panel = document.getElementById("escrow-panel");
    if (!panel) return;

    const released = contract.milestones.filter((item) => item.status === STATES.RELEASED)
      .reduce((sum, item) => sum + item.amount, 0);
    const active = contract.milestones.filter((item) => item.status !== STATES.RELEASED).length;
    const locked = contract.milestones.filter((item) => [STATES.IN_ESCROW, STATES.UNDER_REVIEW, STATES.DISPUTED].includes(item.status))
      .reduce((sum, item) => sum + item.amount, 0);

    panel.innerHTML = `
      <div class="module-intro mb-4">
        <p class="overline"><i class="ti ti-lock"></i> Protected settlement layer</p>
        <h2 class="text-primary fw-bold mb-1">Milestone Escrow</h2>
        <p class="text-secondary mb-0">Every release is traceable, role-gated, and secured by a verifiable lifecycle.</p>
      </div>
      <article class="escrow-summary p-4 rounded-4 mb-4">
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <span class="text-secondary small font-monospace">${escapeHtml(contract.id)}</span>
            <h3 class="text-primary fw-bold h4 mt-1 mb-1">${escapeHtml(contract.project)}</h3>
            <p class="text-secondary small mb-0">${escapeHtml(contract.client)} <span class="mx-1">·</span> ${escapeHtml(contract.freelancer)}</p>
          </div>
          <span class="status-badge badge-escrow">Role: ${escapeHtml(getRole())}</span>
        </div>
        <div class="row g-3 mt-3">
          <div class="col-6 col-lg-3"><span class="text-secondary small d-block">Total escrow</span><strong class="font-monospace text-success fw-bold fs-5">${formatAmount(contract.totalBudget)}</strong></div>
          <div class="col-6 col-lg-3"><span class="text-secondary small d-block">Currently locked</span><strong class="font-monospace text-success fw-bold fs-5">${formatAmount(locked)}</strong></div>
          <div class="col-6 col-lg-3"><span class="text-secondary small d-block">Disbursed</span><strong class="font-monospace text-success fw-bold fs-5">${formatAmount(released)}</strong></div>
          <div class="col-6 col-lg-3"><span class="text-secondary small d-block">Active milestones</span><strong class="font-monospace text-success fw-bold fs-5">${active} / ${contract.milestones.length}</strong></div>
        </div>
      </article>
      <div id="milestone-list-container" class="row g-4">${contract.milestones.map((milestone) => `<div class="col-12 col-lg-4">${renderMilestone(milestone)}</div>`).join("")}</div>
    `;

    panel.querySelectorAll("[data-milestone-id]").forEach((button) => {
      button.addEventListener("click", () => transitionMilestone(button.dataset.milestoneId, button.dataset.nextState));
    });
    panel.querySelectorAll("[data-dispute-id]").forEach((button) => {
      button.addEventListener("click", () => raiseDispute(button.dataset.disputeId));
    });
  }

  function transitionMilestone(id, nextState) {
    const milestone = contract.milestones.find((item) => item.id === id);
    if (!milestone) return;

    const transitions = {
      [STATES.PENDING_FUNDING]: STATES.IN_ESCROW,
      [STATES.IN_ESCROW]: STATES.UNDER_REVIEW,
      [STATES.UNDER_REVIEW]: STATES.RELEASED
    };
    if (transitions[milestone.status] !== nextState) return;

    milestone.status = nextState;
    const audit = {
      [STATES.IN_ESCROW]: ["ESCROW_FUNDED", `Deposited ${formatAmount(milestone.amount)} into secure escrow lock for ${contract.freelancer}.`],
      [STATES.UNDER_REVIEW]: ["WORK_SUBMITTED", `${contract.freelancer} commenced milestone build cycles under security monitoring.`],
      [STATES.RELEASED]: ["ESCROW_RELEASED", `Milestone successfully verified. Disbursed escrow payment ${formatAmount(milestone.amount)} to ${contract.freelancer}.`]
    }[nextState];
    emitAudit(audit[0], audit[1], milestone);
    render();
  }

  function raiseDispute(id) {
    const milestone = contract.milestones.find((item) => item.id === id);
    if (!milestone) return;
    milestone.status = STATES.DISPUTED;
    emitAudit("DISPUTE_FILED", `Dispute filed for ${milestone.id}: ${milestone.title}.`, milestone);
    window.dispatchEvent(new CustomEvent("disputeInitiated", {
      detail: {
        milestoneId: milestone.id,
        title: milestone.title,
        amount: milestone.amount,
        contractId: contract.id
      }
    }));
    render();
    window.showWorkspacePanel?.("dispute-panel");
  }

  function configureFromAward(event) {
    const data = event.detail || {};
    const totalBudget = Number(String(data.totalBudget ?? 4200).replace(/[^\d.-]/g, "")) || 4200;
    let allocated = 0;
    const milestones = MILESTONE_TEMPLATE.map((item, index) => {
      const amount = index === MILESTONE_TEMPLATE.length - 1
        ? totalBudget - allocated
        : Math.round(totalBudget * item.ratio);
      allocated += amount;
      return { id: item.id, title: item.title, amount, status: STATES.PENDING_FUNDING };
    });
    contract = {
      ...contract,
      freelancer: data.freelancerName || "Awarded freelancer",
      totalBudget,
      milestones
    };
    render();
  }

  function resolveDispute(event) {
    const data = event.detail || {};
    const milestone = contract.milestones.find((item) => item.id === data.milestoneId);
    if (!milestone) return;
    milestone.status = data.outcome === "refund" ? STATES.PENDING_FUNDING : STATES.RELEASED;
    render();
  }

  function init() {
    window.addEventListener("contractAwarded", configureFromAward);
    window.addEventListener("disputeResolved", resolveDispute);
    render();
  }

  return { init, render, getContract: () => JSON.parse(JSON.stringify(contract)) };
})();

window.EscrowModule = EscrowModule;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => EscrowModule.init());
} else {
  EscrowModule.init();
}
