

const EscrowModule = (() => {

    // Allowed payment stages
    const STATES = {
        PENDING: "pending",
        FUNDED: "funded",
        IN_PROGRESS: "in-progress",
        RELEASED: "released"
    };

    // Only these transitions are allowed
    const TRANSITIONS = {
        pending: ["funded"],
        funded: ["in-progress"],
        "in-progress": ["released"],
        released: []
    };

    // Demo payment data
    let payments = [
        {
            id: 1,
            project: "E-commerce Website",
            client: "Rahul Sharma",
            freelancer: "Amit Verma",
            amount: 15000,
            status: STATES.PENDING,
            history: [
                {
                    status: STATES.PENDING,
                    time: new Date().toISOString()
                }
            ]
        }
    ];

    // Progress percentage for each stage
    function getProgress(status) {
        const progress = {
            pending: 0,
            funded: 33,
            "in-progress": 66,
            released: 100
        };

        return progress[status] ?? 0;
    }

    // Format amount in Indian currency
    function formatAmount(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Safely move payment to the next allowed stage
    function transitionPayment(paymentId, nextState) {
        const payment = payments.find(
            item => item.id === paymentId
        );

        if (!payment) {
            return {
                success: false,
                message: "Payment not found."
            };
        }

        const allowed = TRANSITIONS[payment.status] || [];

        if (!allowed.includes(nextState)) {
            return {
                success: false,
                message: "This payment transition is not allowed."
            };
        }

        payment.status = nextState;

        payment.history.push({
            status: nextState,
            time: new Date().toISOString()
        });

        render();

        return {
            success: true,
            message: `Payment status updated to ${nextState}.`
        };
    }

    // Render the payment tracker
    function render() {
        const container = document.getElementById(
            "escrow-container"
        );

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="escrow-container">
                <h2 class="escrow-title">
                    Escrow & Payments
                </h2>

                ${payments.map(payment => {
                    const stages = [
                        ["pending", "Pending"],
                        ["funded", "Funded"],
                        ["in-progress", "In Progress"],
                        ["released", "Released"]
                    ];

                    const currentIndex = stages.findIndex(
                        stage => stage[0] === payment.status
                    );

                    const nextActions = {
                        pending: {
                            label: "Fund Payment",
                            next: STATES.FUNDED
                        },
                        funded: {
                            label: "Start Project",
                            next: STATES.IN_PROGRESS
                        },
                        "in-progress": {
                            label: "Complete & Release",
                            next: STATES.RELEASED
                        }
                    };

                    const action = nextActions[payment.status];

                    return `
                        <article class="escrow-card">

                            <h3>${payment.project}</h3>

                            <p>
                                <strong>Client:</strong>
                                ${payment.client}
                            </p>

                            <p>
                                <strong>Freelancer:</strong>
                                ${payment.freelancer}
                            </p>

                            <div class="escrow-amount">
                                ${formatAmount(payment.amount)}
                            </div>

                            <p>
                                Status:
                                <span class="escrow-status ${payment.status}">
                                    ${payment.status.replace("-", " ")}
                                </span>
                            </p>

                            <div class="escrow-progress"
                                 aria-label="Payment progress">

                                ${stages.map((stage, index) => {
                                    let className = "escrow-progress-step";

                                    if (index < currentIndex) {
                                        className += " completed";
                                    } else if (index === currentIndex) {
                                        className += " active";
                                    }

                                    return `
                                        <div
                                            class="${className}"
                                            title="${stage[1]}">
                                        </div>
                                    `;
                                }).join("")}

                            </div>

                            <p>
                                Progress: ${getProgress(payment.status)}%
                            </p>

                            <div class="escrow-actions">

                                ${action ? `
                                    <button
                                        class="escrow-btn"
                                        data-payment-id="${payment.id}"
                                        data-next-state="${action.next}">
                                        ${action.label}
                                    </button>
                                ` : `
                                    <p class="escrow-success">
                                        ✓ Payment released successfully!
                                    </p>
                                `}

                            </div>

                            <hr>

                            <h4>Transaction History</h4>

                            <ul>
                                ${payment.history.map(entry => `
                                    <li>
                                        ${entry.status.replace("-", " ")}
                                        —
                                        ${new Date(entry.time).toLocaleString("en-IN")}
                                    </li>
                                `).join("")}
                            </ul>

                        </article>
                    `;
                }).join("")}

                <p class="escrow-demo-notice">
                    Demo only: No real money is transferred.
                </p>
            </div>
        `;

        // Attach button events
        container.querySelectorAll("[data-next-state]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    const paymentId = Number(
                        button.dataset.paymentId
                    );

                    const nextState = button.dataset.nextState;

                    if (
                        nextState === STATES.RELEASED &&
                        !window.confirm(
                            "Confirm project completion and simulate payment release?"
                        )
                    ) {
                        return;
                    }

                    const result = transitionPayment(
                        paymentId,
                        nextState
                    );

                    if (!result.success) {
                        window.alert(result.message);
                    }
                });
            });
    }

    // Initialize the module
    function init() {
        render();
    }

    return {
        init,
        render,
        getPayments: () => payments.map(payment => ({
            ...payment,
            history: payment.history.map(entry => ({ ...entry }))
        })),
        transitionPayment
    };

})();

// Make the module available to other project scripts
window.EscrowModule = EscrowModule;

// Initialize when the page is ready
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        () => EscrowModule.init()
    );
} else {
    EscrowModule.init();
}
```
