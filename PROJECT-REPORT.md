# ApexArbitri

## Secure Freelance Marketplace & Trustless Escrow Protocol

### Academic Project Report — Mini Project–1

**Institution:** GLA University, Mathura, Uttar Pradesh  
**Industry Alliance Partner:** IntegraMinds  
**Project Mentor:** Mr. Satyam Kumar Jha  
**Module Lead for Bidding & Marketplace:** SURAJ KUMAR THAKUR  
**Roll Number:** 2415001634

---

## Abstract

ApexArbitri is a client-side prototype for a secure freelance marketplace and trustless escrow protocol. The system addresses three recurring weaknesses in conventional freelance platforms: unclear platform fees, delayed milestone settlement, and opaque dispute resolution. The proposed solution decomposes the workflow into a marketplace module, a milestone escrow tracker, a dispute resolution board, and an audit ledger simulation.

The frontend is implemented using HTML5, CSS3, Bootstrap 5, Vanilla JavaScript ES6+, and Tabler Icons. A deterministic client-side state-machine model describes how a bid can become a contract, how a funded milestone can progress to approval, and how a dispute can freeze settlement until an arbitrator verdict is recorded. Browser storage provides controlled persistence for the academic demonstration.

The project demonstrates the engineering value of decoupled event architectures: each module owns a bounded responsibility, while structured events communicate state transitions between modules. Although the current system is a frontend prototype rather than a production payment network, its architecture establishes a clear path toward server-side authentication, signed ledger events, payment-provider integration, and auditable dispute settlement.

**Keywords:** freelance marketplace, escrow, deterministic state machine, dispute resolution, client-side cryptographic ledger simulations, decoupled event architecture, audit trail, glassmorphism.

---

## 1. Introduction

Digital freelancing depends on trust between parties who may never meet physically. A client wants confidence that the freelancer can deliver. A freelancer wants confidence that approved work will be paid. Both parties need a fair process when requirements, timelines, or deliverables are disputed.

Most marketplace products place discovery, payment custody, contract state, and dispute decisions behind one centralized intermediary. This creates a difficult question: if the intermediary controls the money and the evidence, how can the participants independently understand the decision?

ApexArbitri approaches the issue through visible state transitions. The interface does not treat the marketplace, escrow, dispute room, and audit record as one undifferentiated screen. Instead, it presents them as coordinated modules with explicit responsibilities.

### 1.1 Project identity

The name **ApexArbitri** combines the ideas of an apex decision point and a neutral arbitrator. The project is designed as a secure, transparent workspace for freelance contracting, not merely as a job board.

### 1.2 Team contribution

| Team member | Assigned module | Scope |
|---|---|---|
| SURAJ KUMAR THAKUR, 2415001634 | Bidding & Marketplace | Job requisition UI, form validation, fee calculator, live bid slip, proposal rendering |
| TRIMOHAN | Shared State Engine | Role routing, shared state, tab coordination, event communication |
| SUJAL | Milestone Escrow | Funding states, milestone progression, release animations |
| UDDALAK | Dispute Resolution Board | Evidence dialogues, arbitrator controls, settlement verdicts |

---

## 2. Problem Definition

### 2.1 Existing challenges

The project identifies the following issues in existing freelance workflows:

- Platform fees may not be visible at the moment of proposal submission.
- Payment status is often represented by vague labels rather than a precise state.
- Milestone approval, release, and refund actions may not be clearly separated.
- Dispute outcomes may be difficult to explain after the decision.
- Audit data may be unavailable to the people affected by a transaction.

### 2.2 Problem statement

There is a need for a freelance marketplace prototype that makes bid economics, escrow states, dispute handling, and audit actions understandable through a single, consistent interface while reducing direct coupling between modules.

### 2.3 Objectives

1. Build a high-fidelity dark-themed marketplace interface.
2. Provide role-aware demo authentication for client and freelancer spaces.
3. Calculate a transparent 10% platform fee before bid submission.
4. Render submitted bids dynamically without a page refresh.
5. Model escrow and dispute workflows as deterministic state transitions.
6. Record meaningful actions in a local audit ledger simulation.
7. Establish an architecture that can later be connected to secure backend services.

---

## 3. Proposed Solution

ApexArbitri uses a modular frontend architecture:

```text
Authentication
     |
     v
Marketplace -> Contract -> Escrow -> Milestone settlement
     |                         |
     |                         v
     +--------------------> Dispute freeze
                               |
                               v
                       Arbitrator verdict
                               |
                               v
                  Release / refund / split settlement
                               |
                               v
                         Audit Ledger
```

The architecture is deterministic because each action has a defined precondition, transition, and next permitted action. For example, a milestone cannot be released before it is approved, and a disputed milestone cannot be released until the dispute is settled.

### 3.1 State-machine representation

```text
Marketplace:
OPEN -> BID_SUBMITTED -> CONTRACT_PENDING -> AWARDED

Escrow:
UNFUNDED -> FUNDED -> IN_PROGRESS -> SUBMITTED -> APPROVED -> RELEASED

Dispute:
NONE -> OPENED -> EVIDENCE_LOCKED -> UNDER_REVIEW -> RESOLVED

Settlement:
PENDING -> RELEASED_TO_FREELANCER
PENDING -> REFUNDED_TO_CLIENT
PENDING -> SPLIT_SETTLEMENT
```

Invalid transitions should be rejected by the shared state engine and should generate an explicit validation message rather than silently changing the UI.

---

## 4. Technical Architecture

### 4.1 Frontend stack

- **HTML5:** semantic page hierarchy and form controls.
- **CSS3:** custom variables, responsive grids, glassmorphic surfaces, focus states, animations, and dark theme.
- **Bootstrap 5:** responsive utility classes and layout support through CDN.
- **Vanilla JavaScript ES6+:** event listeners, form validation, DOM insertion, storage, and state routing.
- **Tabler Icons:** consistent vector iconography.
- **Outfit:** modern display and body typography.
- **JetBrains Mono:** technical treatment for amounts, identifiers, and state labels.

### 4.2 Application layers

| Layer | Responsibility |
|---|---|
| Presentation | Login screen, job requisition, proposal form, cards, metrics, and module tabs |
| Interaction | Form submission, fee calculation, error states, hover states, and dynamic DOM updates |
| Session | Demo role verification, local/session storage, application-shell routing |
| Domain state | Contract, escrow, dispute, and settlement transitions |
| Audit | Chronological action records with actor and timestamp |

### 4.3 Decoupled event architecture

The intended module contract uses browser custom events:

```js
window.dispatchEvent(new CustomEvent("apex:bid-submitted", {
  detail: {
    bidId,
    projectId,
    amount,
    deliveryDays,
    submittedAt
  }
}));
```

This enables Trimohan's shared state engine to consume marketplace events without making the marketplace form directly depend on the escrow implementation.

---

## 5. Bidding & Marketplace Module

### 5.1 Job requisition

The requisition view provides the commercial context required for a bid:

- Cross-Platform Fintech Mobile App
- Fixed escrow budget of $4,200
- Three planned milestones
- Intermediate experience requirement
- Flutter, Node.js, Stripe API, and biometric authentication
- Escrow and dispute-protection indicators

### 5.2 Proposal input

The bidder enters:

- Full name
- Bid amount
- Delivery days
- Cover letter

The browser's native validity API rejects empty or invalid required values. The prototype also escapes text before creating HTML to reduce the risk of user-entered content being interpreted as markup.

### 5.3 Fee model

The live fee calculator uses:

```text
Platform fee = bid amount × 10%
Estimated take-home = bid amount − platform fee
```

For a bid of `$4,000`:

```text
Platform fee = $400
Estimated take-home = $3,600
```

The calculation runs on the `input` event and updates the fee preview without a page reload.

### 5.4 Dynamic rendering

When the form is submitted:

1. The default browser submission is prevented.
2. Form validity is checked.
3. Values are read and normalized.
4. The proposal HTML is constructed.
5. A randomized demo avatar is selected.
6. The proposal is inserted at the top of the feed.
7. The form is reset.
8. The fee preview returns to zero.
9. A success state is displayed.

---

## 6. Authentication and Role Routing

The prototype includes two demonstration identities:

| Identity | Password | Role |
|---|---|---|
| `client@veritas.com` | `admin123` | Client |
| `devin@apex.com` | `dev123` | Freelancer |

The authentication routine:

- validates the email and password form;
- displays an animated access-denied state for invalid credentials;
- writes `apex_user_role` to `localStorage` when the user selects Remember Session;
- uses `sessionStorage` for a session-only login when the checkbox is not selected;
- invokes `applyUserSession(role)` to reveal the application shell;
- appends a `USER_LOGGED_IN` record with the specific username to `apex_audit_ledger`.

This mechanism is explicitly for classroom demonstration. It does not provide password security because the credentials are visible in frontend source code.

---

## 7. Escrow and Dispute Design

### 7.1 Milestone escrow

The escrow module should show:

1. Funding confirmation
2. Active milestone
3. Freelancer submission
4. Client approval
5. Release confirmation

Each milestone should show the current state and the action available to the authorized role.

### 7.2 Dispute freeze

When either party raises a dispute:

- the milestone becomes frozen;
- settlement controls are disabled;
- evidence submission becomes available;
- the audit ledger receives a dispute-opened record;
- the dispute board becomes the authorized decision surface.

### 7.3 Arbitrator verdict

The arbitrator can choose:

- release to freelancer;
- refund to client;
- split settlement.

The verdict must include a reason and timestamp. The escrow module then consumes the decision and displays the resulting terminal state.

---

## 8. Audit Ledger Design

The audit ledger is a client-side cryptographic ledger simulation in the academic prototype. It is designed to make transitions explainable:

```json
{
  "action": "USER_LOGGED_IN",
  "username": "devin@apex.com",
  "timestamp": "2026-10-27T00:00:00.000Z"
}
```

A fuller production event would contain:

```json
{
  "eventId": "evt_001",
  "action": "MILESTONE_APPROVED",
  "actor": "client@veritas.com",
  "role": "client",
  "entityId": "contract_001",
  "previousState": "SUBMITTED",
  "newState": "APPROVED",
  "timestamp": "2026-11-28T11:45:00.000Z",
  "previousHash": "sha256:...",
  "eventHash": "sha256:..."
}
```

Browser local storage alone is not immutable or cryptographically trustworthy. A production implementation would move event creation and verification to a controlled backend or distributed ledger service.

---

## 9. Verification Plan

### Functional verification

| Test | Expected result |
|---|---|
| Submit empty login form | Native validation prevents submission |
| Submit incorrect credentials | Red alert appears with shake animation |
| Submit client credentials | Client role is stored and application shell is shown |
| Submit freelancer credentials | Freelancer role is stored and application shell is shown |
| Select Remember Session | Role survives page reload through local storage |
| Enter bid amount | Fee and take-home update immediately |
| Submit valid bid | New proposal card appears at the top |
| Submit malicious-looking text | Text is escaped before insertion |
| Clear role storage and reload | Login gateway appears again |

### Non-functional verification

- Responsive layout at desktop, tablet, and mobile widths.
- Visible keyboard focus indicators.
- Sufficient contrast for primary text and status values.
- No dependency on a build pipeline.
- Clear separation between UI modules.

---

## 10. Execution Procedure

1. Open the project folder in VS Code.
2. Install and start Live Server.
3. Open `index.html`.
4. Test the client login:
   - `client@veritas.com`
   - `admin123`
5. Clear storage and test the freelancer login:
   - `devin@apex.com`
   - `dev123`
6. Submit a bid and observe the fee calculator.
7. Inspect generated proposal cards.
8. Open developer tools and inspect:

```js
localStorage.getItem("apex_user_role");
localStorage.getItem("apex_audit_ledger");
sessionStorage.getItem("apex_user_role");
```

9. Reset the prototype:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 11. Timeline

| Period | Milestone | Expected evidence |
|---|---|---|
| September | Synopsis submission | Approved synopsis under mentor review |
| 20–26 September | First progress presentation | Workspace layout, responsive grid, glassmorphic variables |
| 26–31 October | Second progress presentation | Demo login, dynamic bidding, fee calculation, DOM append |
| 23–28 November | Third progress presentation | Escrow triggers, dispute verdicts, and cached audit ledger |

---

## 12. Limitations and Future Scope

### Current limitations

- Credentials are hard-coded for demonstration.
- No server-side authorization exists.
- Storage is browser-local and can be edited by the user.
- Escrow values are simulated and do not represent real money.
- Evidence and dispute records are not persisted to a backend.

### Future scope

- Secure identity provider and password hashing.
- Multi-factor authentication.
- Backend contract and milestone APIs.
- Stripe or equivalent payment webhooks.
- Signed append-only event ledger.
- Role-based authorization middleware.
- Evidence file storage with access policies.
- Automated accessibility and security testing.
- Database-backed analytics and dispute reporting.

---

## Conclusion

ApexArbitri presents a structured alternative to opaque freelance marketplace workflows. Its key contribution is not only the visual interface but the separation of commercial, financial, dispute, and audit responsibilities into understandable modules.

The project demonstrates that a frontend prototype can communicate serious systems architecture when each visible interaction maps to a deterministic state transition. Suraj's marketplace module establishes the bid and fee foundation; the shared state, escrow, dispute, and audit modules extend that foundation toward a transparent trust protocol.

