const MarketplaceModule = (() => {
  // Storage key for state persistence
  const STORAGE_KEY = "apex_marketplace_jobs";

  // In-memory jobs repository with university-grade demo defaults
  let jobs = [
    {
      id: "JOB-101",
      title: "Cross-Platform Fintech Mobile App",
      budget: 4200,
      deadline: 21,
      skills: ["Flutter", "Node.js", "Stripe API", "PostgreSQL"],
      description: "Design and implement a high-performance escrow and wallet application with biometric authentication and automated milestone verification.",
      clientEmail: "client@veritas.com",
      status: "OPEN",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      bids: [
        {
          id: "BID-901",
          jobId: "JOB-101",
          freelancerName: "Devin Vance",
          freelancerEmail: "devin@apex.com",
          amount: 4000,
          days: 18,
          pitch: "I have 5+ years building fintech Flutter apps with robust WebSockets and Stripe integration. I can deliver milestone 1 within 5 days.",
          createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
          status: "PENDING"
        }
      ]
    },
    {
      id: "JOB-102",
      title: "Automated Dispute Arbitration Engine",
      budget: 3500,
      deadline: 15,
      skills: ["TypeScript", "Next.js", "Web Crypto API"],
      description: "Build an evidentiary review portal where disputed contracts can undergo cryptographically verified arbitrator judgments and multi-sig payouts.",
      clientEmail: "client@veritas.com",
      status: "OPEN",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      bids: []
    }
  ];

  // Currently selected job for the Freelancer proposal form
  let selectedJobId = "JOB-101";

  /**
   * Secure HTML string escaper preventing XSS in dynamically injected cards
   */
  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  }

  /**
   * Save state to localStorage
   */
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.warn("⚠️ Marketplace localStorage persistence error: ", e);
    }
  }

  /**
   * Load state from localStorage or fallback to initial seed
   */
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          jobs = parsed;
        }
      }
    } catch (e) {
      console.warn("⚠️ Failed to load marketplace state from storage: ", e);
    }
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
   * Live calculation of 10% platform fee and net take-home pay
   */
  function updateFeePreview() {
    const amountInput = document.getElementById("bid-amount");
    const feeEl = document.getElementById("fee-deduction");
    const takeHomeEl = document.getElementById("take-home-pay");

    if (!amountInput || !feeEl || !takeHomeEl) return;

    const amount = parseFloat(amountInput.value) || 0;
    const fee = amount * 0.10;
    const takeHome = Math.max(0, amount - fee);

    feeEl.textContent = `-$${fee.toFixed(2)}`;
    takeHomeEl.textContent = `$${takeHome.toFixed(2)}`;
  }

  /**
   * Selects a job for bidding from the Freelancer feed
   */
  function selectJobForBidding(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    selectedJobId = jobId;

    const targetInput = document.getElementById("bid-target-job-id");
    const targetLabel = document.getElementById("active-selected-job-label");
    const submitBtn = document.getElementById("submit-proposal-btn");
    const amountInput = document.getElementById("bid-amount");
    const daysInput = document.getElementById("estimated-days");

    if (targetInput) targetInput.value = job.id;
    if (targetLabel) {
      targetLabel.innerHTML = `Targeting: <strong>${escapeHtml(job.title)}</strong> (${formatUSD(job.budget)})`;
    }
    if (submitBtn) submitBtn.disabled = false;

    // Suggest default budget and days based on client request
    if (amountInput && (!amountInput.value || parseFloat(amountInput.value) === 0)) {
      amountInput.value = job.budget;
    }
    if (daysInput && (!daysInput.value || parseInt(daysInput.value) === 0)) {
      daysInput.value = job.deadline;
    }

    updateFeePreview();

    // Smooth scroll down to bidding card on mobile/narrow layouts
    const bidFormCard = document.querySelector(".bids-column");
    if (bidFormCard && window.innerWidth < 1200) {
      bidFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Render Client-Facing View: Active Requisitions and Received Bids
   */
  function renderClientView() {
    const container = document.getElementById("client-posted-jobs-container");
    if (!container) return;

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="glass-card text-center py-5">
          <i class="ti ti-briefcase-off mb-2" style="font-size: 2.2rem; color: var(--color-soft-slate);"></i>
          <p class="text-muted">You have no active project requisitions. Create one on the left to start receiving competitive proposals.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(job => {
      const isAwarded = job.status === "AWARDED";
      const statusBadge = isAwarded
        ? `<span class="badge" style="background: var(--color-forest-emerald); color: white; font-family: var(--font-mono); font-size: 0.65rem;">CONTRACT AWARDED</span>`
        : `<span class="badge" style="background: var(--color-royal-blue); color: white; font-family: var(--font-mono); font-size: 0.65rem;">RECEIVING BIDS</span>`;

      // Render bids submitted on this specific job
      const bidsMarkup = job.bids.length > 0
        ? job.bids.map(bid => {
            const isBidAccepted = bid.status === "ACCEPTED";
            return `
              <div class="p-3 mt-3 rounded" style="background: var(--color-warm-alabaster); border: 1px solid var(--color-soft-slate);">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div class="d-flex align-items-center gap-2">
                    <span class="profile-initials" style="width: 24px; height: 24px; font-size: 0.6rem;">
                      ${escapeHtml(bid.freelancerName.slice(0, 2).toUpperCase())}
                    </span>
                    <strong style="font-size: 0.85rem;">${escapeHtml(bid.freelancerName)}</strong>
                    <small class="text-muted">(${escapeHtml(bid.freelancerEmail)})</small>
                  </div>
                  <div>
                    <span class="badge bg-light text-dark border me-2" style="font-family: var(--font-mono);">
                      ${formatUSD(bid.amount)} / ${bid.days} days
                    </span>
                    ${
                      isBidAccepted
                        ? `<span class="badge bg-success"><i class="ti ti-check"></i> Awarded</span>`
                        : `<button class="btn btn-sm btn-primary award-contract-btn" 
                              data-job-id="${job.id}" 
                              data-bid-id="${bid.id}"
                              ${isAwarded ? "disabled" : ""}
                              style="font-size: 0.72rem; padding: 4px 10px; background: var(--color-royal-blue);">
                              <i class="ti ti-award"></i> Award Contract
                           </button>`
                    }
                  </div>
                </div>
                <p class="small text-muted mb-0" style="line-height: 1.5;">${escapeHtml(bid.pitch)}</p>
              </div>
            `;
          }).join("")
        : `
          <div class="p-3 mt-3 rounded text-center text-muted small" style="background: var(--color-warm-alabaster); border: 1px dashed var(--color-soft-slate);">
            No freelancer proposals submitted yet for this requisition.
          </div>
        `;

      return `
        <article class="glass-card mb-3" style="border-left: 4px solid ${isAwarded ? 'var(--color-forest-emerald)' : 'var(--color-royal-blue)'};">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                ${statusBadge}
                <small class="text-muted" style="font-family: var(--font-mono);">${job.id}</small>
              </div>
              <h3 class="mb-1" style="font-size: 1.15rem;">${escapeHtml(job.title)}</h3>
            </div>
            <div class="text-end">
              <strong style="font-size: 1.15rem; color: var(--color-royal-blue); font-family: var(--font-mono);">${formatUSD(job.budget)}</strong>
              <small class="d-block text-muted">${job.deadline} Days Delivery</small>
            </div>
          </div>
          <p class="small text-muted mb-3">${escapeHtml(job.description)}</p>
          <div class="d-flex flex-wrap gap-1 mb-3">
            ${job.skills.map(s => `<span class="badge bg-light text-dark border" style="font-size: 0.68rem;">${escapeHtml(s)}</span>`).join("")}
          </div>
          
          <div class="border-top pt-2">
            <span class="overline" style="font-size: 0.65rem;"><i class="ti ti-users"></i> Submitted Proposals (${job.bids.length})</span>
            ${bidsMarkup}
          </div>
        </article>
      `;
    }).join("");
  }

  /**
   * Render Freelancer-Facing View: Requisitions Feed
   */
  function renderFreelancerView() {
    const container = document.getElementById("freelancer-job-feed");
    if (!container) return;

    if (jobs.length === 0) {
      container.innerHTML = `
        <div class="glass-card text-center py-5">
          <i class="ti ti-briefcase-off mb-2" style="font-size: 2.2rem; color: var(--color-soft-slate);"></i>
          <p class="text-muted">No open requisitions available across the marketplace right now.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = jobs.map(job => {
      const isSelected = job.id === selectedJobId;
      const isAwarded = job.status === "AWARDED";

      return `
        <article class="glass-card mb-3" style="border-color: ${isSelected ? 'var(--color-royal-blue)' : 'var(--color-soft-slate)'}; box-shadow: ${isSelected ? '0 0 0 2px var(--color-royal-blue)' : 'var(--shadow-soft)'};">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge ${isAwarded ? 'bg-secondary' : 'bg-primary'}" style="font-family: var(--font-mono); font-size: 0.65rem;">
                  ${isAwarded ? 'CLOSED' : 'OPEN REQUISITION'}
                </span>
                <small class="text-muted" style="font-family: var(--font-mono);">${job.id}</small>
              </div>
              <h3 class="mb-1" style="font-size: 1.15rem;">${escapeHtml(job.title)}</h3>
            </div>
            <div class="text-end">
              <strong style="font-size: 1.15rem; color: var(--color-royal-blue); font-family: var(--font-mono);">${formatUSD(job.budget)}</strong>
              <small class="d-block text-muted">Timeline: ${job.deadline} Days</small>
            </div>
          </div>
          
          <p class="small text-muted mb-3">${escapeHtml(job.description)}</p>
          
          <div class="d-flex flex-wrap gap-1 mb-3">
            ${job.skills.map(skill => `<span class="badge bg-light text-dark border" style="font-size: 0.68rem;">${escapeHtml(skill)}</span>`).join("")}
          </div>

          <div class="d-flex justify-content-between align-items-center border-top pt-3">
            <span class="small text-muted"><i class="ti ti-user-check"></i> Posted by ${escapeHtml(job.clientEmail)}</span>
            <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-primary'} select-job-bid-btn" 
              data-job-id="${job.id}" 
              ${isAwarded ? "disabled" : ""}
              style="font-size: 0.75rem; padding: 6px 14px;">
              ${isSelected ? '<i class="ti ti-check"></i> Selected to Bid' : '<i class="ti ti-pencil"></i> Select to Bid'}
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  /**
   * Unified render loop
   */
  function render() {
    renderClientView();
    renderFreelancerView();
  }

  /**
   * Event Listener Bindings
   */
  function initEventListeners() {
    // 1. Live Fee Calculation on proposal form
    const bidAmountInput = document.getElementById("bid-amount");
    if (bidAmountInput) {
      bidAmountInput.addEventListener("input", updateFeePreview);
    }

    // 2. Client Post Job Form Submission
    const clientJobForm = document.getElementById("client-job-form");
    if (clientJobForm) {
      clientJobForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const titleInput = document.getElementById("job-title-input");
        const budgetInput = document.getElementById("job-budget-input");
        const deadlineInput = document.getElementById("job-deadline-input");
        const skillsInput = document.getElementById("job-skills-input");
        const descInput = document.getElementById("job-desc-input");

        const title = titleInput.value.trim();
        const budget = parseFloat(budgetInput.value);
        const deadline = parseInt(deadlineInput.value);
        const skills = skillsInput.value.split(",").map(s => s.trim()).filter(Boolean);
        const description = descInput.value.trim();

        if (!title || isNaN(budget) || isNaN(deadline) || !description) return;

        const newJob = {
          id: `JOB-${Math.floor(100 + Math.random() * 900)}`,
          title,
          budget,
          deadline,
          skills: skills.length > 0 ? skills : ["General Development"],
          description,
          clientEmail: "client@veritas.com",
          status: "OPEN",
          createdAt: new Date().toISOString(),
          bids: []
        };

        jobs.unshift(newJob);
        saveState();
        render();

        // Dispatch audit trace
        window.dispatchEvent(new CustomEvent("auditLogged", {
          detail: {
            action: "JOB_POSTED",
            actor: "client@veritas.com",
            details: `Created requisition '${newJob.title}' with protected budget ${formatUSD(newJob.budget)}.`,
            timestamp: new Date().toISOString()
          }
        }));

        clientJobForm.reset();
        alert(` Requisition published to escrow network successfully under ${newJob.id}!`);
      });
    }

    // 3. Freelancer Proposal Form Submission
    const bidForm = document.getElementById("bid-form");
    if (bidForm) {
      bidForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const targetJobId = document.getElementById("bid-target-job-id").value;
        const freelancerName = document.getElementById("freelancer-name").value.trim();
        const amount = parseFloat(document.getElementById("bid-amount").value);
        const days = parseInt(document.getElementById("estimated-days").value);
        const coverLetter = document.getElementById("cover-letter").value.trim();

        const job = jobs.find(j => j.id === targetJobId);
        if (!job) {
          alert("Please select a valid job requisition to submit your proposal against.");
          return;
        }

        const newBid = {
          id: `BID-${Math.floor(100 + Math.random() * 900)}`,
          jobId: job.id,
          freelancerName: freelancerName || "Devin Vance",
          freelancerEmail: "devin@apex.com",
          amount,
          days,
          pitch: coverLetter,
          createdAt: new Date().toISOString(),
          status: "PENDING"
        };

        job.bids.unshift(newBid);
        saveState();
        render();

        // Dispatch audit trace
        window.dispatchEvent(new CustomEvent("auditLogged", {
          detail: {
            action: "PROPOSAL_SUBMITTED",
            actor: "devin@apex.com",
            details: `Submitted proposal of ${formatUSD(newBid.amount)} for '${job.title}'.`,
            timestamp: new Date().toISOString()
          }
        }));

        document.getElementById("cover-letter").value = "";
        alert(` Proposal successfully locked and submitted for ${job.title}!`);
      });
    }

    // 4. Delegate click on Freelancer Job Selection button
    const freelancerFeed = document.getElementById("freelancer-job-feed");
    if (freelancerFeed) {
      freelancerFeed.addEventListener("click", (e) => {
        const btn = e.target.closest(".select-job-bid-btn");
        if (!btn) return;
        const jobId = btn.getAttribute("data-job-id");
        selectJobForBidding(jobId);
        render();
      });
    }

    // 5. Delegate click on Client "Award Contract" button
    const clientJobsContainer = document.getElementById("client-posted-jobs-container");
    if (clientJobsContainer) {
      clientJobsContainer.addEventListener("click", (e) => {
        const awardBtn = e.target.closest(".award-contract-btn");
        if (!awardBtn) return;

        const jobId = awardBtn.getAttribute("data-job-id");
        const bidId = awardBtn.getAttribute("data-bid-id");

        const job = jobs.find(j => j.id === jobId);
        if (!job) return;

        const bid = job.bids.find(b => b.id === bidId);
        if (!bid) return;

        if (!confirm(`Are you sure you want to award this contract to ${bid.freelancerName} for ${formatUSD(bid.amount)}? This will securely fund the Escrow Safehold.`)) {
          return;
        }

        // Update states
        job.status = "AWARDED";
        bid.status = "ACCEPTED";
        saveState();
        render();

        const contractId = `CON-${Math.floor(1000 + Math.random() * 9000)}`;

        // Dispatch CustomEvent 'contractAwarded' for EscrowModule consumption
        window.dispatchEvent(new CustomEvent("contractAwarded", {
          detail: {
            contractId: contractId,
            jobId: job.id,
            projectTitle: job.title,
            clientEmail: job.clientEmail,
            freelancerEmail: bid.freelancerEmail,
            freelancerName: bid.freelancerName,
            totalBudget: bid.amount,
            deadlineDays: bid.days,
            timestamp: new Date().toISOString()
          }
        }));

        // Dispatch audit log
        window.dispatchEvent(new CustomEvent("auditLogged", {
          detail: {
            action: "CONTRACT_AWARDED",
            actor: job.clientEmail,
            details: `Contract ${contractId} awarded to ${bid.freelancerName} (${bid.freelancerEmail}) for ${formatUSD(bid.amount)}. Escrow funded.`,
            timestamp: new Date().toISOString()
          }
        }));

        // Seamlessly switch user view to the Milestone Escrow tab
        const escrowTab = document.getElementById("escrow-tab");
        if (escrowTab) {
          escrowTab.click();
        }
      });
    }
  }

  /**
   * Module initialization
   */
  function init() {
    loadState();
    initEventListeners();
    if (jobs.length > 0) {
      selectJobForBidding(jobs[0].id);
    }
    render();
  }

  return {
    init,
    render,
    getJobs: () => [...jobs]
  };
})();

window.MarketplaceModule = MarketplaceModule;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => MarketplaceModule.init());
} else {
  MarketplaceModule.init();
}
