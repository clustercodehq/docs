---
branch: docs/p1-187-consolidated
pr: [21, 22]
spec: core:docs/superpowers/specs/2026-08-13-P1.187-consolidated-handoff.md
driver: playwright
worker_mode: none
test_user_tier: any
execution_mode: interactive
---

# P1.187 docs — consolidated visual review (#21 + #22)

Consolidated branch `docs/p1-187-consolidated` = `origin/main` + `5ddaca9` (#21) + `dcc6187` (#22),
cherry-picked clean. #22 was already stacked on #21, so the two commits are the whole series.

Static docs site — no worker, no DB, no auth. Boot with `pnpm dev --port 4321`.

## 1. Golden path — a naive reader lands on the docs and must not be misled  [SANITY]

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 1.1 | Site boots | `pnpm dev --port 4321`, navigate `/` | 200, homepage renders | ✅ pass |
| 1.2 | Homepage no longer promises the autonomous outcome on the manual link `[SANITY]` | Read the entry cards on `/` | Two distinct cards: **Ticket → PR** → `/guides/run-on-demand`, **Launch a DevBox** → `/guides/launch-from-ticket` | ✅ pass |
| 1.3 | The "does a launch start an agent?" question is answerable in one hop `[SANITY]` | `/concepts/containers` → read Lifecycle | Caution aside: "Launching a DevBox does not start an AI agent."; table has an **Is an agent running?** column | ✅ pass |
| 1.4 | Reader can reach the disambiguation page from where the confusion starts | Sidebar under Concepts | **Launch or Run?** sits immediately after **DevBoxes** | ✅ pass |

## 2. The nine truthfulness corrections (#21)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 2.1 | Lifecycle table rebuilt `[SANITY]` | Read rendered table on `/concepts/containers` | 5 rows: Launching/Ready/Running/Stopped/**Removed**. No "Complete" phase. Stopped ≠ Removed | ✅ pass |
| 2.2 | Launch guide states the three real ways to start work | `/guides/launch-from-ticket` | Table: drive yourself (`claude`) / Post-Launch Workflow / start a Run. No "the AI agent starts working" | ✅ pass |
| 2.3 | Quickstart no longer claims the agent is working | `/getting-started/quickstart` | "Your AI agent is now working on the ticket" absent; "now start the agent" present | ✅ pass |
| 2.4 | Tickets page no longer claims autonomous work | `/concepts/tickets` | "works on the ticket autonomously" absent | ✅ pass |
| 2.5 | Getting Started is no longer circular `[SANITY]` | Expand the Getting Started nav group | Introduction → Install CLI → Register a Worker → **Agent sign-in** → Your first DevBox | ✅ pass |
| 2.6 | Agent sign-in is in the setup path, not 13 items deep in Guides | Expand Guides | `Agent sign-in` absent from Guides; Quickstart step 4 is "Sign your agents in on that worker", **before** the launch step | ✅ pass |
| 2.7 | Guides leads with the delegated flow | Expand Guides | 1. Run an agent on demand, 2. Launch from Ticket (adjacent) | ✅ pass |

## 3. Target resolution + Launch vs Run (#22)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 3.1 | New page renders and is navigable `[SANITY]` | `/concepts/launch-vs-run` | H1 "Launch or Run?"; three-workflow table with **Does an agent start automatically?** = No / Yes / Yes when triggered; "Which one do I want?" maps all 5 primitives | ✅ pass |
| 3.2 | Canonical target section exists | `/concepts/schedules#how-a-target-is-chosen` | Section documents eligibility → capacity → priority buffer → **"best fit, not least loaded"**, plus cloud-worker affinity exception | ✅ pass |
| 3.3 | The launch-from-ticket ↔ tickets contradiction is resolved by a single source `[SANITY]` | Click the "how a target is chosen" link on `/guides/launch-from-ticket` | Navigates to `/concepts/schedules#how-a-target-is-chosen` and lands on the heading (top ≈ 72px, not 0/undefined). `/concepts/tickets` links to the same anchor | ✅ pass |
| 3.4 | Skip-reason vocabulary is user-facing | Same section | Table names `worker_offline`, `worker_not_found`, `container_not_found`, `cloud_worker_inactive` | ✅ pass |
| 3.5 | Auto-select re-pick warning present | Same section | Aside: auto-select re-picks per firing; pin a target if the run depends on machine-local state | ✅ pass |

## 4. Build & theme

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 4.1 | Production build clean `[SANITY]` | `pnpm build` | **62 pages built**, Complete. (`/404` router collision warning is pre-existing on `main`) | ✅ pass |
| 4.2 | Dark theme | Set `starlight-theme=dark` on `/concepts/launch-vs-run` | Table + caution aside legible; no hardcoded-color breakage | ✅ pass |
| 4.3 | Light theme | Default theme on `/concepts/containers` | Lifecycle table + amber caution aside render correctly | ✅ pass |

## Findings

| # | Finding | Severity |
|---|---------|----------|
| F1 | Sidebar label is **"Your first DevBox"** but the page H1 and `<title>` are still **"Quickstart"**. Nav promise ≠ page header. | cosmetic — not fixed, needs a call |

## Not covered

- Portal/marketing copy (`/how-it-works`, homepage cards, `website-copy.md`) — lives in `clustercodehq/core`, not this repo, and is not started.
- The `CLAUDE.md` vs `CLAUDE.local.md` docs inaccuracy — known, deliberately outside the nine corrections.
