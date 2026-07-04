# Docs: Build Image From Container & Fleet Worker Direct Launch — Design

**Date:** 2026-06-07
**Issue:** [Crops-Code/core#460 — [P1.098] Docs: Build Image From Container & Fleet Worker Direct Launch](https://github.com/Crops-Code/core/issues/460)
**Repo:** `docs` (docs.cropscode.io — Astro + Starlight)
**Documents features shipped in:** core #329 (`P1.013.17`) + PR #415 (fleet direct launch)
**Source specs (in `core`):**
- `docs/superpowers/specs/2026-05-13-greenhouse-fleet-image-from-container-design.md`
- `docs/superpowers/specs/2026-06-01-fleet-worker-direct-launch-design.md`
- Test plan: `docs/superpowers/test-plans/2026-05-31-images-from-container.md`

## TL;DR

Two shipped capabilities have no end-user docs on docs.cropscode.io. We add **one new guide page** that tells the whole story as a single workflow — *snapshot a running container into a reusable image, then launch from it on the fleet worker that holds it* — plus a **concept addition** to the Workers page so fleet-as-launch-target is discoverable on its own, plus targeted cross-links from existing pages. All content is verified against the shipped orchestrator/worker code (not just the design specs, which the team's own test plan found drifted in places — e.g. max **10** custom capabilities, not 32; no Description field).

## Problem

The golden-image workflow (build an image from a running container) and ownership-gated fleet direct launch both shipped via #329 / PR #415 but are invisible to users. Without docs, users can't discover the **Create Image → From Container** flow or understand why a red **Fleet** group now appears in the launch target picker. Docs are a prerequisite for adoption of the bare-metal fleet golden-image workflow.

These are not two unrelated features — they are two halves of one loop:

> tune a container → **snapshot it as a golden image** (Feature A) → it lands on one fleet worker → **launch from that worker via the red Fleet group** (Feature B).

The documentation should make that loop legible, while still letting each half be found independently.

## Goals

- A user on Pro/Enterprise can read one page and successfully: pick a source container, name + tag an image, add custom capabilities, snapshot it, and relaunch from the result.
- A user understands *why* a fleet worker appears (or doesn't) in their launch target picker, and that selecting it pins the launch to that worker.
- Reference-grade accuracy for the gating rules, validation limits, OCI label schema, and the Linux-vs-Windows difference — taken from shipped code, not the design spec.
- Discoverable: linked from Containers, Custom Containerfile, Greenhouse, Workers, and Plans & Limits.

## Non-goals

- **Documenting internal API request/response bodies as a public API reference.** docs.cropscode.io is end-user product documentation, not an HTTP API reference. We mention endpoint names lightly in one "Under the hood" aside (the issue asks the picker API be documented) but do not publish full request schemas.
- **The AI-agent fleet-launch path.** It deliberately stays greenhouse-only; we document that boundary in one sentence and do not write an agent workflow for it.
- **Cross-worker image replication, ACR/registry publish, CI image builds.** Out of scope upstream; we state the single-worker reality where it affects the user (an image lives on exactly one worker) and move on.
- **A separate standalone "Fleet Launch" page.** Feature B is documented as a section of the new guide plus a Workers-concept subsection. A thin standalone page would fragment a single workflow.
- **New Starlight components or a screenshot pipeline.** See "Screenshots" — the existing site is text/table/`Aside`/`Card` only; we stay within that convention.

## Approaches considered

**A — One combined guide + a Workers concept note (recommended).**
A single guide, `guides/build-image-from-container`, carries Feature A end-to-end and a "Launch from your golden image" section for Feature B's user-facing flow. The Workers concept page gets a short "Fleet workers as launch targets" subsection (ownership model + red group + agent caveat). *Pro:* mirrors the real one-loop workflow; one place to maintain; fleet-as-target still discoverable from Workers. *Con:* the guide is the longer of the two halves' "homes."

**B — Two standalone guides** (`build-image-from-container` + `fleet-launch`). *Pro:* maps 1:1 to the two acceptance bullets. *Con:* the fleet page is thin and duplicates launch context already in the golden-image flow; readers bounce between pages to follow one task.

**C — Fold everything into existing pages** (extend Custom Containerfile + Workers). *Pro:* no new page. *Con:* From-Container is a distinct enough workflow that burying it in "Custom Containerfile" (a Dockerfile-authoring page) hides it; loses a clean URL to link from the product.

**Recommendation: A.** It matches how the feature is actually used, keeps maintenance in one place, and still satisfies both acceptance bullets ("page" for A, "section" for B — the issue explicitly allows a section). The Workers note gives Feature B an independent discovery path.

## Design

### Page inventory

| Action | Path | Sidebar (Guides) | Status |
|---|---|---|---|
| **New** | `src/content/docs/guides/build-image-from-container.mdx` | "Build from Container" | primary deliverable |
| **Edit** | `src/content/docs/concepts/workers.mdx` | (existing) | add "Fleet workers as launch targets" section |
| **Edit** | `src/content/docs/concepts/containers.mdx` | (existing) | link from "Runtime Images" |
| **Edit** | `src/content/docs/guides/custom-containerfile.mdx` | (existing) | "or snapshot a running container" pointer |
| **Edit** | `src/content/docs/guides/greenhouse.mdx` | (existing) | link Windows golden-image angle |
| **Edit** | `src/content/docs/reference/plans-and-limits.mdx` | (existing) | note `images.publish` is Pro+ |
| **Edit** | `astro.config.mjs` | — | add new guide to the Guides `sidebar` array |

Sidebar insertion: add `{ label: 'Build from Container', slug: 'guides/build-image-from-container' }` to the **Guides** group, placed directly after **Custom Containerfile** (its natural neighbor).

### New guide: `guides/build-image-from-container.mdx`

Frontmatter:
```yaml
---
title: Build an Image from a Container
description: Snapshot a running container into a reusable golden image, then launch from it.
---
```
Imports: `import { Aside, Steps } from '@astrojs/starlight/components';` (`Steps` is the one new-to-this-page component; it ships with Starlight and renders an ordered walkthrough — appropriate here and consistent with the site's component-only-from-Starlight convention).

Section outline (each section scaled to need):

1. **Intro (2–3 sentences).** What a "golden image" is and the problem it solves: you've tuned a container — installed tools, cloned a repo, pasted credentials, finished the Windows first-boot install — and want every future launch to start from that exact state instead of re-running a build. Lead with the value, not the mechanism.

2. **`<Aside type="note">` — plan/role gate.** "Building an image from a container requires a **Pro or Enterprise** plan and the **owner**, **admin**, or **member** role. Starter users see an upgrade prompt in place of the form." (Backed by `images.publish`: `_requires: plan !== 'starter'`, roles `owner|admin|member`.)

3. **Before you start.** A short bullet list of source-container eligibility — the picker only shows containers that are **all** of:
   - **yours** (you launched it — `launchedBy === you`),
   - **running**,
   - **not part of a Greenhouse** (greenhouse-managed containers are excluded).
   This is the user-facing translation of `GET /api/containers?picker=image-source`.

4. **Build the image (`<Steps>`).** The From-Container walkthrough on `/images` → Create Image:
   1. Open **Create Image**, choose the **From Container** segment.
   2. Pick the **target worker** (the image is built on, and stays on, this one worker).
   3. Pick the **source container** (filterable list; only eligible containers per §3).
   4. Enter an **image name** — *rules:* lowercase, must start alphanumeric, 2–64 chars, `[a-z0-9._-]` only.
   5. Enter a **tag** (optional, defaults to `latest`) — 1–63 chars, `[a-zA-Z0-9._-]`.
   6. Optionally add **custom capabilities** (chips) — up to **10**, each ≤40 chars, no commas.
   7. Submit. Linux finishes in well under a minute; Windows can take **several minutes** (up to a ~30-minute budget).

5. **Inherited vs custom capabilities.** Inherited capabilities are auto-derived from the source container and shown read-only. Custom capabilities are stored on the image with a `custom:` prefix (e.g. `custom:tax-prep-2025`) and render as chips in the launch picker beside the built-in capability badges. Note dedup: re-declaring a capability the source already carries won't double it.

6. **Linux vs Windows.** Two short subsections:
   - **Linux** — captured directly from the container's filesystem; fast; includes files you added (e.g. a cloned repo persists in the image).
   - **Windows** — the container is **stopped briefly** to capture a consistent disk, so the snapshot is slower, and the resulting image **only runs on workers that support Windows VMs**. The payoff: launches from a Windows golden image skip dockur's 20–30-minute first-boot install and reach a working desktop in seconds. (Verbatim alignment with the in-product warning string.) Use `<Aside type="caution">` for the stop-and-Windows-only caveat.

7. **Launch from your golden image (Feature B).** This is the second half of the loop:
   - After the build, the image lives on exactly **one** worker.
   - In the launch target picker, that worker appears in a red **Fleet** group (mirroring the green **Greenhouses** group) **when it belongs to your tenant**. Selecting it **pins the launch to that worker**, so it can find the image.
   - `<Steps>`: open Launch → open the target picker → select the worker under **Fleet** → pick your golden image (filter by name/tag/capability) → launch.
   - The same red Fleet group appears in **Quick Launch** and the **Schedule** create panel.
   - `<Aside type="note">`: shared/foreign fleet workers never appear here — only fleet workers owned by your tenant. And launching directly on a fleet worker from **CropPilot (the AI agent)** is not supported yet; the agent still routes fleet capacity through a Greenhouse.

8. **Reference.** Compact, scannable:
   - **Eligibility & gating** recap table (plan, role, source-container rules).
   - **Validation limits** table (name, tag, custom-cap count/length/charset).
   - **Image labels** table — the OCI labels written on every snapshot:

     | Label | Value | Meaning |
     |---|---|---|
     | `io.cropscode.managed` | `true` | Produced by CropsCode; shown in pickers |
     | `io.cropscode.os` | `linux` \| `windows` | Drives OS badges / size hints |
     | `io.cropscode.owner` | your user id | Who created it |
     | `io.cropscode.source` | `container-commit` | Distinguishes snapshots from snippet builds |
     | `io.cropscode.capabilities` | CSV incl. `custom:` entries | Renders as chips |

   - **Under the hood** `<Aside>` (one short paragraph): the source-container list comes from `GET /api/containers?picker=image-source`; the snapshot is `POST /api/images/commit`; image metadata lives in the OCI labels above (there is no server-side image table), so an image is only visible while its worker is online.

9. **Related** links: Containers · Custom Containerfile · Workers · Greenhouse · Plans & Limits.

### Edit: `concepts/workers.mdx` — "Fleet workers as launch targets"

A short new section (≈120 words) covering Feature B at the concept level, independent of images:
- Fleet = CropsCode-managed shared workers. Normally you reach fleet capacity through a Greenhouse.
- **New:** a fleet worker that belongs to **your tenant** is now a direct launch target — it shows in a red **Fleet** group in the launch picker, alongside your own (BYOM) workers and green Greenhouses. The ownership rule in one line: a worker is launchable if it's in your tenant; shared/foreign fleet workers are never shown.
- Selecting it pins the launch to that worker (so it can serve images that live only there).
- One-line caveat: the AI agent path stays greenhouse-only for now.
- Link out to the new guide for the build-then-launch flow.

### Cross-link edits (one line each)

- `concepts/containers.mdx` "Runtime Images" → "You can also snapshot a running container into a reusable image — see [Build an Image from a Container](/guides/build-image-from-container)."
- `guides/custom-containerfile.mdx` near the top → "Prefer to capture a container you've already set up by hand? See [Build an Image from a Container](/guides/build-image-from-container)."
- `guides/greenhouse.mdx` Windows section → note Windows golden images make managed Windows launches near-instant; link the guide.
- `reference/plans-and-limits.mdx` → add a row/line: building an image from a container (`images.publish`) requires Pro/Enterprise.

### Screenshots

The acceptance criteria ask for three screenshots (From-Container segment, custom-cap chips in the launch picker, the red Fleet group). **Constraint discovered:** no page on the current site uses images — it is entirely text/tables/`Aside`/`Card`. Decision:

- Write the page so it is **complete and correct without screenshots** (text + `Steps` + tables carry the walkthrough). This keeps the page useful immediately and matches the established house style.
- Treat screenshots as an **enhancement applied during implementation if a running orchestrator is available**. If captured: store under `src/assets/` (Starlight optimizes assets there) and reference with standard MDX image syntax; cover exactly the three required shots. If no environment is available at implementation time, ship text-first and track screenshots as a follow-up rather than block the page. The implementation plan will call this out as an explicit, separable task.

## Voice & conventions (match existing docs)

- Second person, imperative, concise. Value-first sentences, then mechanism.
- Tables for anything enumerable (limits, labels, eligibility) — the site leans heavily on tables.
- `Aside` for plan gates, cautions, and the "under the hood" note; `Steps` for the two ordered walkthroughs; `Card`/`CardGrid` only if a landing-style summary helps (optional).
- Internal links use root-relative slugs (`/guides/...`, `/concepts/...`) as existing pages do.
- Use the product's own wording where the UI is quoted (e.g. the Windows warning), so docs and UI agree.

## Accuracy notes (verified against shipped code, 2026-06-07)

These override the older design spec where they differ (the team's test plan flagged the drift):

- Custom capabilities: **max 10**, each **≤40** chars, no commas, `custom:` prefix. (`commit-helpers.ts` `CommitBodySchema`; UI `MAX_CUSTOM_CAPS=10`, `MAX_CUSTOM_CAP_LEN=40`.)
- Image **name** regex `^[a-z0-9][a-z0-9._-]{1,63}$`; **tag** regex `^[a-zA-Z0-9._-]{1,63}$`, default `latest`.
- **No Description field** in the From-Container form (the earlier spec's "Description textarea" was never shipped).
- Permission `images.publish`: `plan !== 'starter'`, roles `owner|admin|member`. (`permissions/registry.ts`.)
- Windows commit budget ~**30 min** server-side; Linux < 1 min. (`COMMIT_TIMEOUT_MS`.)
- OCI labels actually written: `managed`, `os`, `owner`, `source=container-commit`, `capabilities`. (Per issue + worker `parse.go`.)
- Fleet ownership gate is tenant-scoped (`getByTenants`); `/api/launch` no longer passes `byomOnly`; foreign worker → "not found or not accessible to your tenant."

## Testing / acceptance

This is a docs change; "testing" = build + accuracy review.

- `pnpm build` (Astro) succeeds — no broken internal links, new sidebar entry resolves.
- Every claim in the Reference section traceable to shipped code (table above).
- Acceptance criteria mapping:
  - [x] Page "Build an image from a running container" (Linux + Windows, walkthrough, custom caps, inherited caps + label reference) → new guide §1–§8.
  - [x] "Launching on a fleet worker" page/section (red Fleet group, ownership model, golden-image launch flow) → guide §7 + Workers concept section.
  - [x] `images.publish` plan/role gate + source-container eligibility documented → guide §2, §3, §8.
  - [x] OCI label schema (`managed/os/owner/source/capabilities` + `custom:` prefix) → guide §8 table.
  - [~] Screenshots (3) → enhancement during implementation if an environment is available; text-first otherwise (see Screenshots).
  - [x] Cross-links from Greenhouses/Images/related docs → cross-link edits.

## Implementation order

1. Write `guides/build-image-from-container.mdx` (§1–§9).
2. Add the sidebar entry in `astro.config.mjs`.
3. Add the "Fleet workers as launch targets" section to `concepts/workers.mdx`.
4. Apply the four one-line cross-links.
5. `pnpm build`; fix any link/sidebar issues.
6. (If environment available) capture the three screenshots into `src/assets/` and reference them; else leave as a tracked follow-up.

## Out of scope (explicit)

- Public HTTP API reference pages.
- AI-agent fleet-launch documentation (feature not shipped).
- Cross-worker replication / registry / CI-build docs.
- Any change to the orchestrator/worker product itself.
