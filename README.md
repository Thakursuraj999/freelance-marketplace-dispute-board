# ApexArbitri

## Secure Freelance Marketplace & Trustless Escrow Protocol

> **Mini Project–1**  
> **GLA University — Lucknow/Mathura, Uttar Pradesh**  
> **Industry Alliance Partner:** IntegraMinds  
> **Project Mentor:** Mr. Satyam Kumar Jha

ApexArbitri is a high-fidelity client-side prototype for a transparent freelance marketplace. It combines competitive bidding, deterministic escrow state transitions, a three-party dispute workflow, and a client-side audit ledger simulation into one role-aware workspace.

The project is intentionally implemented as a pure frontend prototype so that the team can demonstrate the complete product experience without requiring a backend, database, payment gateway, or external arbitration service during the academic presentation.

---

## 1. Project Identity and Team Composition

### Project objective

Traditional freelance platforms frequently combine marketplace discovery, payment custody, contract enforcement, and dispute resolution inside one opaque intermediary. ApexArbitri separates these concerns into visible, testable interface modules:

- **Marketplace:** clients publish requisitions and freelancers submit competitive bids.
- **Escrow:** agreed funds move through visible milestone states.
- **Dispute Board:** disputed work is reviewed through a structured three-party workflow.
- **Audit Ledger:** significant actions are appended to a chronological activity record.

### Team

| Member | Roll / responsibility | Primary contribution |
|---|---|---|
| **SURAJ KUMAR THAKUR** | Module Lead — Bidding & Marketplace | Premium marketplace UI, job requisition view, form validation, live bid slip, 10% fee calculator, dynamic proposal cards |
| **TRIMOHAN** | Module Lead — Shared State Engine | Shared state engine, client-side session routing, navigation coordination, and tab state management |
| **SUJAL** | Module Lead — Milestone Escrow | Escrow tracker, milestone state transitions, funding indicators, and visual progress animations |
| **UDDALAK** | Module Lead — Dispute Resolution | Dispute Board, evidence dialogues, arbitrator settlement controls, and verdict presentation |

### Academic context

This work is submitted as **Mini Project–1** at **GLA University, Lucknow/Mathura, Uttar Pradesh**, in collaboration with **IntegraMinds** and under the guidance of **Mr. Satyam Kumar Jha**.

---

## 2. Problem Statement

Freelance marketplaces solve discovery but often leave trust and settlement concerns unresolved:

1. Platform fees can be difficult to understand before a freelancer submits a proposal.
2. Payment release may be delayed because contract, milestone, and approval states are not visible.
3. Disputes can be resolved by a centralized intermediary without a sufficiently transparent decision trail.
4. Participants cannot always reconstruct who performed which action, when it occurred, or what state changed.
5. Marketplace, escrow, and dispute data are often tightly coupled to one opaque workflow.

The result is a trust deficit between clients, freelancers, and platform operators.

## 3. ApexArbitri Solution

ApexArbitri decouples marketplace interaction, contract funding, dispute handling, and audit visibility into coordinated frontend modules. The prototype models the platform as a **deterministic client-side state machine**:

```text
Marketplace event
      |
      v
Bid accepted / contract created
      |
      v
Escrow funded -> milestone active -> submitted -> approved
      |                                  |
      |                                  v
      +---------------------------> settlement
      |
      v
Dispute raised -> evidence locked -> arbitrator verdict -> refund / release
```

Each transition is intended to be explicit. A participant should be able to see the current state, the action that caused it, the responsible role, and the next permitted action.

### Important prototype boundary

The current repository is a browser-based prototype:

- Demo authentication is client-side and is not suitable for production secrets.
- Local storage is used as a presentation-time persistence layer.
- No real funds are transferred.
- No cryptographic immutability is created by browser storage alone.
- The terms **trustless**, **immutable**, and **cryptographic ledger** describe the target protocol and simulation model; production deployment would require a backend, secure identity provider, signed events, and audited storage.

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Document structure | HTML5 | Semantic layout, forms, accessibility labels, and role-oriented panels |
| Visual system | CSS3 | Custom design tokens, glassmorphism, responsive grids, focus states, and animations |
| Responsive utilities | Bootstrap 5 CDN | Grid utilities, spacing helpers, and responsive layout support |
| Application logic | Vanilla JavaScript ES6+ | Form events, fee calculation, session routing, local persistence, and DOM updates |
| Iconography | Tabler Icons Webfont | Consistent vector icons without image assets |
| Typography | Outfit + JetBrains Mono | Modern UI typography and technical financial/status values |
| Prototype persistence | `localStorage` / `sessionStorage` | Demo role persistence and audit-event simulation |
| Presentation tooling | VS Code + Live Server | Local browser execution and classroom demonstration |

### Repository structure

```text
ApexArbitri/
├── index.html                 # Login gateway and marketplace workspace
├── README.md                  # Technical documentation
├── PROJECT-REPORT.md          # Academic project report
├── Freelance_Marketplace_Dispute_Board_Synopsis.pdf
├── css/
│   ├── style.css              # Global design system and login screen
│   ├── marketplace.css         # Marketplace, bidding, and proposal cards
│   ├── escrow.css              # Escrow module extension point
│   └── dispute.css             # Dispute module extension point
└── js/
    ├── app.js                 # Demo authentication and session routing
    ├── marketplace.js          # Fee calculation and proposal insertion
    ├── escrow.js               # Escrow module extension point
    ├── dispute.js              # Dispute module extension point
    └── audit.js               # Audit module extension point
```

---

## 5. System Architecture Blueprint

### Decoupled event architecture

The intended application architecture separates responsibilities into modules rather than allowing every page component to mutate every other component:

```text
┌───────────────────────────────┐
│ Suraj: Marketplace Form        │
│ name, bid, timeline, pitch     │
└───────────────┬───────────────┘
                │ submit proposal
                v
┌───────────────────────────────┐
│ Marketplace Controller         │
│ validate -> calculate fee      │
│ create proposal -> emit event  │
└───────────────┬───────────────┘
                │ CustomEvent: bid:submitted
                v
┌───────────────────────────────┐
│ Trimohan: Shared State Engine  │
│ session, active role, tab      │
│ contract and state coordination│
└───────┬───────────────┬───────┘
        │               │
        │ contract      │ audit event
        v               v
┌───────────────┐   ┌────────────────────┐
│ Sujal: Escrow │   │ Audit Ledger       │
│ funded        │   │ append transition  │
│ milestone     │   │ actor + timestamp  │
│ released      │   │ event + payload    │
└───────┬───────┘   └────────────────────┘
        │ dispute trigger
        v
┌───────────────────────────────┐
│ Uddalak: Dispute Board         │
│ evidence -> freeze -> verdict  │
└───────────────┬───────────────┘
                │ settlement decision
                v
┌───────────────────────────────┐
│ Escrow settlement              │
│ release / refund / split       │
└───────────────┬───────────────┘
                │ append final event
                v
         Audit Ledger record
```

### Suggested event contract

The module boundaries can communicate with browser `CustomEvent` objects:

```js
window.dispatchEvent(new CustomEvent("apex:bid-submitted", {
  detail: {
    bidId,
    projectId,
    freelancerId,
    amount,
    deliveryDays,
    submittedAt
  }
}));
```

The shared state engine can listen for this event, update the active contract state, and dispatch the next event:

```js
window.addEventListener("apex:bid-submitted", (event) => {
  // Transition: MARKETPLACE_BID_SUBMITTED
  // Next: CONTRACT_PENDING_CLIENT_APPROVAL
});
```

This event-driven approach reduces direct coupling between Suraj's form and the escrow/dispute modules.

---

## 6. Module Specifications

### 6.1 Bidding & Marketplace Module — Suraj

#### Job requisition view

The requisition view presents the information required before a freelancer submits an offer:

- Project title: **Cross-Platform Fintech Mobile App**
- Budget: **$4,200**
- Experience level: **Intermediate**
- Milestone count: **3**
- Skills: Flutter, Node.js, Stripe API, and Biometric Authentication
- Trust indicators: escrow guaranteed and dispute protected
- Client profile, verification marker, and review score

The interface uses custom glassmorphic cards, translucent borders, layered shadows, indigo focus states, and technical monospace treatment for money and status values.

#### Bid form

The form captures:

1. Freelancer full name
2. Bid amount in USD
3. Delivery timeline in days
4. Proposal pitch / cover letter

Native browser validity checks prevent incomplete values from being submitted. The script then reads the form values, escapes user-entered text, creates a proposal card, and inserts it at the top of the proposal feed.

#### Fee calculation

The platform fee is currently modeled as 10%:

```text
fee = bidAmount × 0.10
takeHome = bidAmount − fee
```

The calculation runs on the bid amount input event, so the freelancer sees the platform deduction and estimated take-home value before submitting the proposal.

#### Dynamic bid slip

`js/marketplace.js` uses `insertAdjacentHTML("afterbegin", proposalCard)` to place the newest proposal before existing cards. Each generated proposal includes:

- Freelancer name
- Randomized demo avatar from `pravatar.cc`
- Bid amount
- Delivery duration
- Proposal pitch
- Review status
- Award contract action

User-controlled name and pitch values are HTML-escaped before insertion to reduce markup injection risk in the prototype.

#### Planned custom event

The next integration step is to broadcast a structured event after insertion:

```text
apex:bid-submitted
```

Trimohan's shared state engine can consume this event and coordinate the contract, escrow, and audit modules.

### 6.2 Shared State and Session Routing — Trimohan

The shared state engine is responsible for:

- Active user role
- Current module tab
- Active project and contract identifiers
- Current escrow state
- Current dispute state
- Cross-module event routing

The login prototype currently stores `apex_user_role` in browser storage and routes the user into the shared application shell.

### 6.3 Milestone Escrow Tracker — Sujal

The escrow tracker is designed to expose a milestone lifecycle:

```text
UNFUNDED
  -> FUNDED
  -> IN_PROGRESS
  -> SUBMITTED
  -> APPROVED
  -> RELEASED
```

When a dispute is opened, the active milestone must transition to:

```text
DISPUTED / FROZEN
```

The visual tracker should show the current state, completed states, pending states, and the role authorized to perform the next transition.

### 6.4 Dispute Resolution Board — Uddalak

The dispute module is designed around a three-party review:

- Client statement
- Freelancer response
- Arbitrator decision

Evidence dialogues should preserve:

- Evidence title
- Submitting role
- Timestamp
- Description
- Review status

The arbitrator control can produce one of three settlement outcomes:

1. Release funds to freelancer
2. Refund funds to client
3. Split settlement according to the verdict

### 6.5 Audit Ledger

Every important state transition should append a structured record:

| Field | Example |
|---|---|
| Event | `USER_LOGGED_IN` |
| Actor | `devin@apex.com` |
| Role | `freelancer` |
| Timestamp | ISO 8601 timestamp |
| Entity | Contract, milestone, dispute, or session |
| Previous state | `SUBMITTED` |
| New state | `DISPUTED` |

The current login prototype records authenticated login actions under `apex_audit_ledger` in local storage. In a production system, audit records would require append-only server storage, integrity signatures, access control, and independent verification.

---

## 7. Demo Authentication

The login gateway is a client-side demonstration mechanism for role routing. It is not a production authentication system.

| Role | Demo User ID | Demo password | Workspace |
|---|---|---|---|
| Client | `client@veritas.com` | `admin123` | Client requisitions, bid review, escrow approval |
| Freelancer | `devin@apex.com` | `dev123` | Marketplace bids, fee preview, proposal submission |

Successful authentication:

1. Validates the form.
2. Matches the email and password against the demo credential map.
3. Stores `apex_user_role` in `localStorage` when **Remember Session** is selected.
4. Stores the role in `sessionStorage` for a browser-session-only login otherwise.
5. Records `USER_LOGGED_IN` and the authenticated username in `apex_audit_ledger`.
6. Reveals the application shell through `applyUserSession(role)`.

Invalid authentication displays:

```text
Access Denied: Invalid Security Hash or Password Code.
```

with a red shake micro-animation.

---

## 8. Presentation and Evaluation Timeline

| Progress check | Academic / product deliverable | Evaluation outcome |
|---|---|---|
| **Synopsis Submission — Completed in September** | Project synopsis, problem definition, proposed modules, and solution direction | Synopsis approval by **Mr. Satyam Kumar Jha** |
| **First Progress Presentation — 20–26 September** | Basic workspace, initial layout grids, responsive structure, and glassmorphic CSS variables | Demonstration of visual foundation and team module boundaries |
| **Second Progress Presentation — 26–31 October** | Session logins, dynamic bidding forms, live 10% fee calculation, validation, and DOM proposal appends | Demonstration of role-aware access and marketplace interaction |
| **Third Progress Presentation — 23–28 November** | Escrow triggers, dispute room verdicts, frozen milestones, and local-storage audit ledger caching | Demonstration of end-to-end deterministic state transitions |

---

## 9. Installation and Running Instructions

### Prerequisites

- Visual Studio Code
- A modern browser such as Chrome, Edge, or Firefox
- VS Code **Live Server** extension
- Internet access for Bootstrap, Google Fonts, Tabler Icons, and demo avatars

### Run locally

1. Open Visual Studio Code.
2. Select **File → Open Folder**.
3. Open the `ApexArbitri` directory.
4. Install the **Live Server** extension if it is not already installed.
5. Open [index.html](./index.html).
6. Right-click the file and select **Open with Live Server**.
7. The browser will open the local application URL.

Do not open the file only through `file://` when testing storage and browser behavior. Live Server provides a predictable local origin.

### Test the login gateway

#### Client route

```text
Email / User ID: client@veritas.com
Security Password: admin123
```

#### Freelancer route

```text
Email / User ID: devin@apex.com
Security Password: dev123
```

Test an invalid credential once to verify the red error alert and shake animation.

### Test the marketplace

1. Sign in with the freelancer demo account.
2. Enter a name, bid amount, delivery days, and cover letter.
3. Observe the 10% escrow fee and take-home estimate update while typing.
4. Submit the proposal.
5. Confirm that a new proposal card appears at the top of the feed.
6. Confirm that the form resets and the success notification appears.
7. Inspect the proposal card for the generated avatar and submitted values.

### Demonstrate the future escrow workflow

For the third presentation, the planned demonstration sequence is:

```text
Award contract
  -> create contract
  -> fund milestone
  -> mark milestone in progress
  -> submit milestone
  -> open dispute
  -> freeze funds
  -> submit evidence
  -> issue arbitrator verdict
  -> release, refund, or split
```

The escrow, dispute, and audit files are intentionally separated so those modules can be implemented without rewriting the marketplace UI.

### Verify local audit records

Open browser developer tools and run:

```js
localStorage.getItem("apex_user_role");
localStorage.getItem("apex_audit_ledger");
sessionStorage.getItem("apex_user_role");
```

After a successful remembered login, the ledger should contain an entry similar to:

```json
{
  "action": "USER_LOGGED_IN",
  "username": "devin@apex.com",
  "timestamp": "2026-10-27T00:00:00.000Z"
}
```

To reset the demo:

```js
localStorage.removeItem("apex_user_role");
localStorage.removeItem("apex_audit_ledger");
sessionStorage.removeItem("apex_user_role");
location.reload();
```

---

## 10. Verification Checklist

- [x] Complete HTML5 document structure
- [x] Responsive Bootstrap utility integration
- [x] Outfit and JetBrains Mono typography
- [x] Tabler icon integration
- [x] Glassmorphic dark dashboard
- [x] Client and freelancer demo login credentials
- [x] Invalid credential error animation
- [x] Remembered session routing
- [x] Client-side 10% fee calculator
- [x] Dynamic proposal card insertion
- [x] Randomized proposal avatars
- [x] Initial `USER_LOGGED_IN` audit record
- [ ] Production identity provider
- [ ] Server-side escrow custody
- [ ] Signed append-only audit storage
- [ ] Backend dispute evidence storage

---

## 11. Academic and Production Considerations

This project demonstrates system design, interface engineering, event-driven decomposition, and state-machine thinking. It should not be interpreted as a payment or identity system suitable for production without additional controls.

For production hardening, the team would add:

- Server-side password hashing and session management
- Multi-factor authentication
- Role-based authorization enforced by the server
- Payment provider webhooks and escrow reconciliation
- Signed event envelopes and tamper-evident audit storage
- Server-side evidence retention and access control
- Rate limiting, CSRF protection, and content security policy
- Automated unit, integration, and accessibility testing

---

## 12. Team Presentation Summary

ApexArbitri demonstrates how a freelance platform can be decomposed into transparent, independently testable services at the interface level. Suraj's marketplace module establishes the commercial intent through bids and fee visibility. Trimohan coordinates shared state and routing. Sujal makes financial custody visible through milestone states. Uddalak introduces a structured dispute process. The Audit Ledger connects each stage into a traceable record.

The central architectural principle is:

> **Every meaningful action should produce an explicit state transition that can be observed, explained, and audited.**

