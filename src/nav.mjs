/**
 * Single source of truth for site navigation.
 *
 * Every nav surface reads from this file — the Starlight sidebar
 * (`astro.config.mjs`), the desktop header nav (`Header.astro`), the mobile
 * bottom-nav menu (`BottomNav.astro`), and the Ctrl+K command palette
 * (`CommandPalette.astro`).
 *
 * It used to be four hand-maintained copies, which drifted: the Automation
 * section reached the sidebar and the header but never the mobile menu or the
 * search index, and the palette still linked `/guides/cron-workflows/` long
 * after that page was renamed to `guides/recurring-work`. Adding a page here
 * now makes it appear on every surface at once.
 *
 * Plain `.mjs` (not `.ts`) so `astro.config.mjs` can import it directly.
 *
 * Group fields:
 *   label     — sidebar heading, palette group heading, mobile menu entry
 *   short     — compact label for the header nav + pinned bottom bar
 *   icon      — key into NAV_ICONS
 *   href      — landing page for the group (header / mobile menu target)
 *   collapsed — sidebar starts collapsed
 *   primary   — appears in the desktop header nav
 *   pinned    — appears in the always-visible mobile bottom bar
 *   external  — links off-site; excluded from search
 *
 * Item fields: label, slug, desc (palette subtitle), badge (sidebar only).
 */

const beta = { text: 'Beta', variant: 'default', class: 'beta-badge' };

export const nav = [
  {
    label: 'Getting Started',
    short: 'Start',
    icon: 'book',
    href: '/getting-started/quickstart/',
    collapsed: true,
    pinned: true,
    // Ordered so a reader going top-to-bottom never hits a page whose
    // prerequisites come later. Quickstart used to sit at position 2 while
    // depending on Install CLI + Register a Worker below it (and register-worker
    // linked back up to Quickstart) — a loop. Quickstart is now the payoff at the
    // end. 'Agent sign-in' moved here from Guides (was 13 items deep, linked from
    // no Getting Started page) because a worker without signed-in agents cannot
    // do agent work at all.
    items: [
      { label: 'Introduction', slug: 'getting-started/introduction', desc: 'What is ClusterCode' },
      { label: 'Install CLI', slug: 'getting-started/install-cli', desc: 'Install the CLI tool' },
      { label: 'Register a Worker', slug: 'getting-started/register-worker', desc: 'Connect your machine' },
      { label: 'Agent sign-in', slug: 'guides/agent-sign-in', desc: 'Sign AI engines into a worker' },
      { label: 'Your first DevBox', slug: 'getting-started/quickstart', desc: 'Get running in 5 minutes' },
    ],
  },
  {
    label: 'Concepts',
    icon: 'puzzle',
    href: '/concepts/workers/',
    collapsed: true,
    primary: true,
    pinned: true,
    items: [
      { label: 'Workers', slug: 'concepts/workers', desc: 'Machines that run DevBoxes' },
      { label: 'Cloud workers', slug: 'concepts/cloud-workers', desc: 'Managed compute, metered by the second' },
      { label: 'DevBoxes', slug: 'concepts/containers', desc: 'Isolated execution environments' },
      // Sits directly after DevBoxes: the "my launch didn't start an agent"
      // confusion is discovered on that page, so the answer is adjacent.
      { label: 'Launch or Run?', slug: 'concepts/launch-vs-run', desc: 'Who starts the agent, and when' },
      { label: 'Windows Containers', slug: 'concepts/windows-containers', desc: 'Real Windows VM DevBoxes' },
      { label: 'Projects', slug: 'concepts/projects', desc: 'Group work behind one dashboard' },
      // Directly after Projects because a shortcut's scope is "yours / your
      // team's / one project's" — the reader meets the scope before the thing
      // that is scoped to it.
      { label: 'Shortcuts', slug: 'concepts/shortcuts', desc: 'Prompts you save once and reuse' },
      { label: 'Nucleus', slug: 'concepts/nucleus', desc: 'The in-platform AI assistant' },
      { label: 'Prompt improver', slug: 'concepts/prompt-improver', desc: 'Rewrite a draft into an agent-ready instruction' },
      { label: 'Observatory', slug: 'concepts/observatory', desc: 'Galaxy view of your fleet' },
      { label: 'Tickets', slug: 'concepts/tickets', desc: 'Work items from issue trackers' },
      { label: 'Runtime Catalog', slug: 'concepts/runtime-catalog', desc: "What's inside a DevBox" },
      { label: 'Bring Your Own Subscription', slug: 'concepts/byo-subscription', desc: 'Use your own AI credentials' },
      { label: 'Settings', slug: 'concepts/settings', desc: 'Your per-user preferences' },
      { label: 'Session persistence', slug: 'concepts/session-persistence', desc: 'Logins follow you to any DevBox' },
      { label: 'Security Profiles', slug: 'concepts/security-profiles', desc: 'Network, filesystem and resource limits' },
    ],
  },
  {
    // Top-level (not nested under Concepts) and expanded by default so the
    // Schedules/Runs guides + the timeline showcase are discoverable at a
    // glance — they were getting lost two levels deep.
    //
    // Deliberately NOT `pinned`. "Automation" is 66px at the bar's 11px mono
    // against a 60px slot at 360px, and no product bar exceeds Menu + 4 (portal
    // marketing pins 3, orchestrator 4). Pinning it also wouldn't fix the
    // no-highlight class — CLI Reference, Self-Hosting and Reference already
    // light nothing, on more pages than Automation has. The menu sheet carries
    // the you-are-here signal, matching the portal, which keeps Admin
    // sheet-only for the same reason.
    label: 'Automation',
    icon: 'zap',
    href: '/concepts/automation/',
    collapsed: false,
    primary: true,
    items: [
      { label: 'Overview', slug: 'concepts/automation', desc: 'Agents that work on their own' },
      { label: 'Nova', slug: 'concepts/nova', desc: 'The coordinator behind every run' },
      { label: 'Schedules', slug: 'concepts/schedules', desc: 'Recurring autonomous cron jobs' },
      { label: 'Inputs & fan-out', slug: 'concepts/inputs-and-fan-out', desc: 'One firing per item in a list' },
      { label: 'Runs', slug: 'concepts/runs', desc: 'On-demand agent jobs you can steer' },
      { label: 'Loops', slug: 'concepts/loops', desc: 'Run-until-verified standing goals', badge: beta },
      { label: 'How a Loop run works', slug: 'concepts/loop-run-lifecycle', desc: 'Anatomy of a loop iteration', badge: beta },
      { label: 'Prototyping', slug: 'concepts/prototyping', desc: 'Race agents on the same brief', badge: beta },
      { label: 'Workflows', slug: 'concepts/workflows', desc: 'Draw a graph of runs, loops and approvals', badge: beta },
      { label: 'How a Prototype race works', slug: 'concepts/prototype-race-lifecycle', desc: 'Anatomy of a prototype race', badge: beta },
      { label: 'Multi-Agent Runs', slug: 'guides/multi-agent-runs', desc: 'A team of agents in one run' },
      { label: 'Engines', slug: 'concepts/subagents', desc: 'Claude Code, Codex and Copilot' },
    ],
  },
  {
    label: 'Guides',
    icon: 'map',
    href: '/guides/launch-from-ticket/',
    collapsed: true,
    primary: true,
    pinned: true,
    items: [
      // The two ticket-entry paths sit adjacent at the top so the reader sees the
      // choice — delegated (Run) vs. hands-on (Launch) — rather than discovering
      // only the manual one and assuming it's the whole product. 'Run an agent on
      // demand' leads because it is the flow that actually delivers the headline
      // ticket → PR promise.
      { label: 'Run an agent on demand', slug: 'guides/run-on-demand', desc: 'Three copy-paste Run recipes' },
      { label: 'Launch from Ticket', slug: 'guides/launch-from-ticket', desc: 'Start a DevBox from an issue' },
      { label: 'Automate recurring work', slug: 'guides/recurring-work', desc: 'Three copy-paste Schedule recipes' },
      { label: 'Explore your fleet in the Observatory', slug: 'guides/explore-observatory', desc: 'Walkthrough of the galaxy view' },
      { label: 'Create a Loop', slug: 'guides/create-a-loop', desc: 'Set up a run-until-verified loop', badge: beta },
      { label: 'Create a Prototype', slug: 'guides/create-a-prototype', desc: 'Race contenders and promote a winner', badge: beta },
      { label: 'Create a Workflow', slug: 'guides/create-a-workflow', desc: 'Draw a graph and fire it as one unit', badge: beta },
      { label: 'Custom Containerfile', slug: 'guides/custom-containerfile', desc: 'Build your own runtime' },
      { label: 'Build from DevBox', slug: 'guides/build-image-from-container', desc: 'Snapshot a DevBox into an image' },
      { label: 'Nucleus Configuration', slug: 'guides/nucleus-config', desc: 'Customize Nucleus with NUCLEUS.md' },
      { label: 'Privileged Mode (Nested Containers)', slug: 'guides/privileged-nested-containers', desc: 'Run a container engine inside a DevBox' },
      { label: 'Windows Golden Image', slug: 'guides/windows-golden-image', desc: 'Boot Windows DevBoxes in seconds' },
      { label: 'Visual Testing', slug: 'guides/visual-testing', desc: 'Give an agent a real desktop' },
      { label: 'Team Setup', slug: 'guides/team-setup', desc: 'Invite and manage your team' },
      // 'Agent sign-in' now lives in Getting Started (see above).
      { label: 'Cloud worker', slug: 'guides/cloud-worker', desc: 'Managed compute offering' },
      { label: 'VS Code Extension', slug: 'guides/vscode-extension', desc: 'Editor integration' },
      { label: 'AI Credits', slug: 'guides/ai-credits', desc: 'Usage and billing' },
    ],
  },
  {
    label: 'CLI Reference',
    short: 'CLI',
    icon: 'terminal',
    href: '/cli/overview/',
    collapsed: true,
    primary: true,
    items: [
      { label: 'Overview', slug: 'cli/overview', desc: 'All commands at a glance' },
      { label: 'login', slug: 'cli/login', desc: 'Authenticate with ClusterCode' },
      { label: 'worker', slug: 'cli/worker', desc: 'Manage worker registration' },
      { label: 'doctor', slug: 'cli/doctor', desc: 'Diagnose setup issues' },
      { label: 'onboard', slug: 'cli/onboard', desc: 'First-time setup wizard' },
      { label: 'config', slug: 'cli/config', desc: 'View and set configuration' },
      { label: 'status', slug: 'cli/status', desc: 'Check worker status' },
    ],
  },
  {
    label: 'Self-Hosting',
    icon: 'server',
    href: '/self-hosting/worker-agent/',
    collapsed: true,
    items: [
      { label: 'Worker Agent', slug: 'self-hosting/worker-agent', desc: 'Run your own worker' },
      { label: 'Requirements', slug: 'self-hosting/requirements', desc: 'Hardware and software needs' },
      { label: 'Sizing Runtime Memory', slug: 'self-hosting/runtime-memory', desc: 'How much memory to give the container runtime' },
      { label: 'Troubleshooting', slug: 'self-hosting/troubleshooting', desc: 'Common issues and fixes' },
    ],
  },
  {
    label: 'Reference',
    icon: 'file',
    href: '/reference/plans-and-limits/',
    collapsed: true,
    items: [
      { label: 'Plans & Limits', slug: 'reference/plans-and-limits', desc: 'Pricing tiers and quotas' },
      { label: 'Supported Agents', slug: 'reference/supported-agents', desc: 'Compatible AI agents' },
      { label: 'Environment Variables', slug: 'reference/environment-variables', desc: 'DevBox env vars' },
      { label: 'Changelog', slug: 'reference/changelog', desc: 'Release history' },
    ],
  },
  {
    label: 'Links',
    icon: 'external',
    href: 'https://clustercode.io',
    collapsed: true,
    external: true,
    items: [
      { label: 'Home', link: 'https://clustercode.io' },
      { label: 'Console', link: 'https://console.clustercode.io' },
      { label: 'Admin', link: 'https://clustercode.io/admin' },
    ],
  },
];

/** Inner markup for each nav icon, drawn inside a 24×24 stroked `<svg>`. */
export const NAV_ICONS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  puzzle:
    '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  server:
    '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  // lucide `file-text` — the trailing short polyline was previously only in the
  // sidebar's CSS mask copy; folded in here so every surface draws the same art.
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  external:
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
};

/** `concepts/automation` → `/concepts/automation/` */
export const hrefFor = (item) => item.link ?? `/${item.slug}/`;

/** Starlight only understands label/slug/link/badge — drop our extra fields. */
export function toStarlightSidebar() {
  return nav.map(({ label, collapsed, items }) => ({
    label,
    collapsed,
    items: items.map((item) =>
      item.link
        ? { label: item.label, link: item.link }
        : { label: item.label, slug: item.slug, ...(item.badge ? { badge: item.badge } : {}) },
    ),
  }));
}

/** Flat, searchable index for the command palette. Off-site groups excluded. */
export function paletteItems() {
  return nav
    .filter((group) => !group.external)
    .flatMap((group) =>
      group.items.map((item) => ({
        title: item.label,
        desc: item.desc ?? '',
        href: hrefFor(item),
        group: group.label,
        icon: group.icon,
      })),
    );
}

// `key` is always the canonical group label, so callers can compare it against
// activeGroupLabel() even where the visible text is the shortened form.

/** Groups for the desktop header nav. */
export function primaryNav() {
  return nav
    .filter((group) => group.primary)
    .map((group) => ({ key: group.label, label: group.short ?? group.label, href: group.href }));
}

/** Groups for the mobile bottom-nav menu panel. */
export function menuGroups() {
  return nav.map((group) => ({
    key: group.label,
    label: group.label,
    href: group.href,
    icon: group.icon,
    external: Boolean(group.external),
  }));
}

/**
 * Nested tree for the mobile menu sheet — groups with their pages inside.
 *
 * Carries `badge` and `current` through from the tree so the sheet never
 * re-derives them: a Beta chip appears in the mobile menu because the item has
 * a badge in `nav`, and the current page highlights because its slug matches,
 * both decided here rather than restated in the component.
 *
 * @param pathname current URL path, used to mark the active item + open group
 */
export function menuTree(pathname) {
  const activeSlug = (pathname ?? '').replace(/^\/+|\/+$/g, '');
  return nav.map((group) => {
    const items = group.items.map((item) => ({
      label: item.label,
      href: hrefFor(item),
      badge: item.badge?.text ?? null,
      external: Boolean(item.link),
      current: item.slug != null && item.slug === activeSlug,
    }));
    const active = items.some((item) => item.current);
    return {
      key: group.label,
      label: group.label,
      icon: group.icon,
      external: Boolean(group.external),
      items,
      active,
      // The section you're currently in starts expanded; the rest start closed,
      // so the sheet opens short and scannable rather than 58 rows long.
      open: active,
    };
  });
}

/** Groups pinned to the always-visible mobile bottom bar. */
export function pinnedGroups() {
  return nav
    .filter((group) => group.pinned)
    .map((group) => ({
      key: group.label,
      label: group.short ?? group.label,
      href: group.href,
      icon: group.icon,
    }));
}

/**
 * Which group owns the current URL.
 *
 * Matches on the page's actual group membership rather than a path prefix,
 * because a group can hold pages from another section — `guides/multi-agent-runs`
 * lives under Automation, and `/concepts/automation/` must not light up
 * Concepts just because it starts with `/concepts/`.
 */
export function activeGroupLabel(pathname) {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  for (const group of nav) {
    if (group.items.some((item) => item.slug === slug)) return group.label;
  }
  // No path-prefix fallback on purpose. A group can hold pages from another
  // section — Automation owns `guides/multi-agent-runs` — so a prefix scan
  // returned Automation for ANY unlisted `/guides/*` page, which is worse than
  // no highlight at all. `pnpm check:nav` guarantees every page is in a group,
  // so this only returns null for non-content routes (/, /404, /api/docs.json)
  // and for a brand-new page that has not been registered yet.
  return null;
}
