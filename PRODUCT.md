# Product Context: ShiftOps

ShiftOps is a modern, real-time store operations command and workforce management platform designed for multi-branch retail, food service, and hospitality environments.

---

## 1. Core Purpose & Value Proposition

- **The Problem:** Shift operations in retail and hospitality suffer from disconnected punch clocks, chaotic shift handovers, uncoordinated task checklists, and delayed incident responses.
- **The Solution:** A unified, real-time operational cockpit that integrates digital attendance, shift roster scheduling, daily checklist compliance, dual-signature shift handover debriefs, and urgent safety/maintenance incident radar into a single cohesive interface.
- **Differentiating Mechanism:** Real-time bi-directional operational sync (WebSocket STOMP + Spring Boot JPA) paired with a high-density, anti-slop, zero-mock UI designed for rapid scanning and one-touch execution.

---

## 2. Target Users & Operating Modes

| Role | Operational Context | Primary Jobs | Primary Device |
| :--- | :--- | :--- | :--- |
| **Store Owner** | Headquarters / Multi-Unit Oversight | Cross-branch labor budgeting, roster publishing, store-level analytics, exception oversight | Desktop (1440px) |
| **Shift Manager** | On-Floor Store Supervision | Shift floor attendance supervision, punch adjustments, task delegation, till cash float reconciliation, dual-signature handover sign-offs, incident escalation | Tablet (768px) & Desktop (1440px) |
| **Staff Member** | Floor Service / Kitchen / Counter | Self-service check-in/out punches, viewing assigned shifts, completing shift tasks, reporting equipment or safety incidents | Mobile (390px) & Store Terminal |

---

## 3. Core Operational Modules

1. **Operations Overview (`/` or `/dashboard`):** Real-time store status, on-floor headcount, upcoming shift handovers, and active incident alerts.
2. **Shift Roster & Scheduling (`/shifts`):** Weekly timeline matrix, shift allocation, unassigned slot triage, and floor coverage equilibrium.
3. **Staff Attendance & Punch Station (`/attendance`):** 
   - *Staff Mode:* Clean punch terminal, shift confirmation, late delta tracker.
   - *Manager Mode:* Store presence roster, punctuality metrics, live exception callouts (absences/tardiness), and CSV payroll timecard export.
4. **Shift Handover & Manager Turnover (`/handovers`):** 
   - Outgoing supervisor shift briefing, till cash float audit (`¥45,000`), task carryover triage, linked incident tags, and dual-signature sign-off ledger.
5. **Checklists & Daily Tasks (`/tasks`):** Operational task boards, category filters, and assignment tracking.
6. **Incident Radar (`/issues`):** Equipment breakdown alerts (e.g. espresso group head pressure, refrigeration HACCP temperatures), priority triage, and resolution lifecycles.
7. **Team Directory (`/staff` or `/team`):** Staff profiles, branch assignments, wage tiers, and scheduling preferences.

---

## 4. Technical Architecture (Zero Mock Commitment)

- **Backend:** Spring Boot 3.4.1 + Java 21 (`com.shiftops.*`), Spring Data JPA, Hibernate, PostgreSQL, Flyway migrations.
- **Real-Time Communication:** Spring WebSocket with STOMP message broker (`/topic/branches/{branchId}/**`).
- **Frontend Stack:** React 18, TypeScript 5.7, Vite 6, TanStack Query v5, Tailwind CSS v4, Lucide SVG icons.
- **Design System & Typography:** IBM Plex Sans (primary text & UI) + IBM Plex Mono (tabular numerals for currency `¥`, timestamps, durations, and counts).
- **Aesthetic Direction:** Linear/Stripe-grade modern operational density. Flat 1px hairlines (`#e8eaec`), zero muddy drop shadows, zero emoji as chrome, monochromatic quiet rows with purposeful amber/red alerts.

---

## 5. Constraints & Compliance Standards

- **Zero Mock Policy:** All UI interactions map to real REST endpoints and DTO records in `com.shiftops.*`.
- **Accessibility:** WCAG 2.2 AA compliance, $\ge 44\text{px}$ touch targets for mobile/terminal use, 4.5:1 text contrast ratio, visible focus rings.
- **Performance:** 60/120fps micro-motion budget (compositor-only properties: `transform` and `opacity`).
