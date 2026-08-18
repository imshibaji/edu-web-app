```mermaid
flowchart TD
    %% Student Side
    A[Student browses tutors] --> B[Books trial lesson]
    B --> C[Payment via Stripe Checkout]
    C --> D{Payment successful?}
    D -->|No| E[Payment failed notification]
    D -->|Yes| F[Funds held in Platform Escrow]
    F --> G[Transaction recorded with fee breakdown]
    G --> H[Booking status: CONFIRMED]
    H --> I[Slot marked as booked]
    I --> J[Notifications sent to Student & Tutor]

    %% Fee Calculation
    F --> K[Fee Calculation]
    K --> L[Gross Amount]
    L --> M[Platform Fee 15%]
    L --> N[Processing Fee 2.9% + 30¢]
    M --> O[Total Platform Revenue]
    N --> P[Stripe Cost Recovery]
    M --> Q[Tutor Net Amount]
    N --> Q

    %% Admin Dashboard
    J --> R[Admin Payout Dashboard]
    R --> S[View pending payouts]
    S --> T{Filter by status/period/tutor}
    T --> U[Ready to Pay]
    T --> V[Waiting for Tutor Stripe Connect]

    %% Payout Process
    U --> W{Release trigger}
    W -->|Manual| X[Admin clicks Release Now]
    W -->|Scheduled| Y[Weekly/Monthly cron]
    X --> Z[Bulk payout release]
    Y --> Z
    Z --> AA[Stripe Transfer to Tutor Connect Account]
    AA --> AB{Transfer successful?}
    AB -->|Yes| AC[Payout marked PAID]
    AB -->|No| AD[Payout marked FAILED]
    AC --> AE[Tutor notification: Payout received]
    AD --> AF[Tutor notification: Payout failed]
    AF --> AG[Admin alert]

    %% Tutor Side
    V --> AH[Tutor connects Stripe via /tutor/connect]
    AH --> AI[Stripe Connect Express onboarding]
    AI --> AJ[Webhook: account.updated]
    AJ --> AK[Payout ready = true]

    %% Admin Settings
    R --> AL[Payment Settings]
    AL --> AM[Platform Fee %]
    AL --> AN[Processing Fee %]
    AL --> AO[Processing Fee Fixed]
    AM --> AP[Live fee preview]
    AN --> AP
    AO --> AP

    %% Notifications Flow
    J --> AQ[Booking Request → Tutor]
    H --> AR[Booking Confirmed → Student & Tutor]
    AC --> AS[Payout Completed → Tutor]
    AD --> AT[Payout Failed → Tutor + Admin]
    E --> AU[Payment Failed → Student & Tutor]

    %% Styling
    classDef student fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef platform fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef tutor fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef admin fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef stripe fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef notify fill:#f1f8e9,stroke:#689f38,stroke-width:2px;
    classDef fee fill:#fbe9e7,stroke:#bf360c,stroke-width:2px;

    class A,B,C,D,E,G,H,I,J,AQ,AR,AU student;
    class F,K,L,M,N,O,P,Q,R,S,T,AL,AM,AN,AO,AP,AL fee;
    class U,V,W,X,Y,Z,AA,AB,AC,AD,AE,AF,AG,AH,AI,AJ,AK tutor;
    class R,S,T,U,V,W,X,Y,Z admin;
    class C,F,AA,AI,AJ stripe;
    class AQ,AR,AS,AT,AU notify;
```

### Payment Flow Summary

| Stage | Actor | Action | Data Stored |
|-------|-------|--------|-------------|
| **1. Booking** | Student | Books lesson, pays via Stripe | `Booking` (PENDING_PAYMENT), `Transaction` (SUCCESS) |
| **2. Escrow** | Platform | Holds funds, calculates fees | Fee breakdown in `Transaction` |
| **3. Completion** | Tutor/Student | Lesson completes | `Booking` (COMPLETED) |
| **4. Payout** | Admin | Releases funds to tutor | `Payout` record, Stripe Transfer |
| **5. Settlement** | Stripe | Transfers to tutor Connect | `Transfer` webhook updates `Payout` |

### Key Features Implemented
- ✅ **Escrow**: Student payments go to platform first
- ✅ **Multi-fee**: Platform % + Processing % + Fixed
- ✅ **Admin control**: Weekly/monthly bulk releases
- ✅ **Stripe Connect**: Tutor onboarding for payouts
- ✅ **Notifications**: All events trigger in-app alerts
- ✅ **Audit trail**: Complete `Transaction` + `Payout` history
- ✅ **Configurable fees**: Live preview in admin settings