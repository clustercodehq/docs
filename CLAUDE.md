# ClusterCode Docs — working notes

Astro 5 + Starlight 0.34 documentation site for https://docs.clustercode.io.
Content is MDX under `src/content/docs/`.

## Navigation: one source of truth

**`src/nav.mjs` owns all navigation.** Four surfaces are derived from it:

| Surface | Consumer |
|---|---|
| Sidebar | `astro.config.mjs` via `toStarlightSidebar()` |
| Desktop header nav | `src/components/Header.astro` via `primaryNav()` |
| Mobile bottom-nav menu | `src/components/BottomNav.astro` via `menuTree()` / `pinnedGroups()` |
| Ctrl+K search index | `src/components/CommandPalette.astro` via `paletteItems()` |
| Sidebar group icons | `nav-icons.generated.css` via `scripts/generate-nav-icons.mjs` |

`menuTree(pathname)` returns the nested tree for the mobile menu sheet with
`badge` and `current` already resolved — the sheet renders a Beta chip because
the item has a badge in `nav`, never because the component restates it.

Adding a page means **one** edit in `src/nav.mjs`. Never add a nav entry
straight into `astro.config.mjs`, `Header.astro`, `BottomNav.astro` or
`CommandPalette.astro` — they are consumers, and hand-editing one puts a page
on some surfaces but not others.

This was a real bug, not a hypothetical: the nav used to be four hand-kept
copies, and the whole Automation section reached the sidebar and desktop header
but never the mobile menu or search, while the palette went on linking a page
that had been renamed months earlier.

Two things in the tree are **positional** and need care:

- Icon artwork lives **once**, in `NAV_ICONS` (`src/nav.mjs`). Components render
  it through `src/components/NavIcon.astro`; the sidebar's group icons — which
  must be CSS masks, because Starlight owns the `<summary>` markup and gives us
  no hook to put an element inside it — are generated into
  `src/styles/nav-icons.generated.css` by `scripts/generate-nav-icons.mjs`.
  Never hand-edit that file, and never paste mask data into `custom.css`.
- Those mask rules are still selected by `:nth-child(N)`, but the numbering is
  generated from group order, so reordering `nav.mjs` can no longer misassign
  them. `pnpm check:nav` fails if the generated file is stale.

Adding a whole new **group** (not just a page) needs: the group in `src/nav.mjs`
(with `icon`, `href`, and optionally `short` / `primary` / `pinned`), a
`NAV_ICONS` entry if the icon is new, then `pnpm generate:nav-icons`. Groups of
off-site links use `link:` on their items instead of `slug:`.

## Checks

```bash
pnpm check              # everything
pnpm check:nav          # nav ↔ pages ↔ generated icons (also runs on every build)
pnpm check:tokens       # brand tokens vs core/portal
pnpm check:limits       # plan limits vs core
pnpm generate:nav-icons # rewrite nav-icons.generated.css from NAV_ICONS
```

`pnpm build` runs `check:nav` first, so a build fails on nav drift. CI runs
`check:nav` and `check:tokens` on every pull request (`.github/workflows/checks.yml`).

`check:limits` is **currently failing** — `displayIdleTimeoutMinutes` in
`reference/plans-and-limits` disagrees with core. It is deliberately not in the
blocking CI set yet; regenerate from the core repo
(`node scripts/export-plan-limits.mjs --docs`) and then add it to
`.github/workflows/checks.yml`.

## Conventions

- Some pages are twins of files in `clustercodehq/core` (consent mode, brand
  tokens, plan limits). Those carry a `TWIN of <path>` comment — keep both
  sides in sync rather than editing one.
- Client-facing terminology: **DevBox**, not "container".
- Screenshots are theme-paired (`*-dark-<date>.png` / `*-light-<date>.png`) and
  rendered through `ThemedImage.astro`.
- CSS overrides of Starlight internals live in `src/styles/custom.css` and lean
  on `!important`; check what you are overriding still exists after a Starlight
  upgrade.
