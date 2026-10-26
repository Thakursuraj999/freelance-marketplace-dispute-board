document.addEventListener("DOMContentLoaded", () => {
  const bidForm = document.getElementById("bid-form");
  const bidAmountInput = document.getElementById("bid-amount");
  const feeDeduction = document.getElementById("fee-deduction");
  const takeHomePay = document.getElementById("take-home-pay");
  const bidsContainer = document.getElementById("bids-container");
  const proposalTotal = document.getElementById("proposal-total");
  const successAlert = document.getElementById("success-alert");

  const avatarNumbers = [5, 14, 21, 32, 44, 52, 61, 70];

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value;
    return element.innerHTML;
  }

  function updateFeePreview() {
    const amount = Number.parseFloat(bidAmountInput.value) || 0;
    const fee = amount * 0.1;

    feeDeduction.textContent = `-$${fee.toFixed(2)}`;
    takeHomePay.textContent = `$${(amount - fee).toFixed(2)}`;
  }

  function showSuccessAlert() {
    successAlert.classList.add("show");
    window.setTimeout(() => successAlert.classList.remove("show"), 3200);
  }

  bidAmountInput.addEventListener("input", updateFeePreview);

  bidForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!bidForm.checkValidity()) {
      bidForm.reportValidity();
      return;
    }

    const name = escapeHtml(document.getElementById("freelancer-name").value.trim());
    const amount = Number(document.getElementById("bid-amount").value).toLocaleString("en-US");
    const days = Number(document.getElementById("estimated-days").value);
    const pitch = escapeHtml(document.getElementById("cover-letter").value.trim());
    const avatarNumber = avatarNumbers[Math.floor(Math.random() * avatarNumbers.length)];
    const totalProposals = bidsContainer.querySelectorAll(".proposal-card").length + 1;

    const proposalCard = `
      <article class="proposal-card new-proposal">
        <div class="proposal-header">
          <span class="verified-label"><i class="ti ti-sparkles"></i> New proposal</span>
          <time>Just now</time>
        </div>
        <div class="proposal-person">
          <img src="https://i.pravatar.cc/80?img=${avatarNumber}" alt="${name} avatar">
          <div>
            <h3>${name}</h3>
            <span>Independent Freelancer <b>·</b> New bidder</span>
          </div>
        </div>
        <p>${pitch}</p>
        <div class="proposal-metrics">
          <div><span>Bid amount</span><strong>$${amount}</strong></div>
          <div><span>Delivery</span><strong>${days} days</strong></div>
          <div><span>Status</span><strong>Under review</strong></div>
        </div>
        <button class="award-button" type="button">Award contract <i class="ti ti-arrow-up-right"></i></button>
      </article>
    `;

    bidsContainer.insertAdjacentHTML("afterbegin", proposalCard);
    proposalTotal.textContent = `(${totalProposals})`;
    bidForm.reset();
    updateFeePreview();
    showSuccessAlert();
  });
});
