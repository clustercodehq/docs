# ClusterCode Docs

Public documentation site for ClusterCode, served at https://docs.clustercode.io.

## Tech stack

- [Astro](https://astro.build/) v5
- [Starlight](https://starlight.astro.build/) v0.34 (Astro's docs theme)
- MDX for content pages

## Local development

```bash
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:4321` by default.

## Build

```bash
pnpm build
pnpm preview   # preview the production build locally
```

## Adding a new doc page

1. Create an `.mdx` file under `src/content/docs/<section>/`:

   ```
   src/content/docs/
     getting-started/
     concepts/
     guides/
     cli/
     self-hosting/
     reference/
   ```

2. Add YAML frontmatter at the top:

   ```mdx
   ---
   title: Page Title
   description: One-line summary.
   ---

   Page content here.
   ```

3. Register the page in **`src/nav.mjs`** under the appropriate group's
   `items` array:

   ```js
   { label: 'Page Title', slug: '<section>/<slug>', desc: 'Short search subtitle' }
   ```

   `src/nav.mjs` is the **single source of truth** for navigation. One entry
   there feeds all four surfaces at once:

   | Surface | Built from |
   |---|---|
   | Sidebar | `toStarlightSidebar()` → `astro.config.mjs` |
   | Desktop header nav | `primaryNav()` → `Header.astro` |
   | Mobile bottom-nav menu | `menuTree()` → `BottomNav.astro` |
   | Ctrl+K search | `paletteItems()` → `CommandPalette.astro` |
   | Sidebar group icons | `generate-nav-icons.mjs` → `nav-icons.generated.css` |

   The mobile menu nests: each section expands in place to reveal its pages,
   with the current section already open. Beta chips and the current-page
   highlight come from the same entry — nothing is restated per surface.

   Do **not** add nav entries directly to `astro.config.mjs` or to any
   component — they read from `src/nav.mjs` and hand-editing them puts a page
   on some surfaces but not others. That is exactly how the Automation section
   ended up missing from search and the mobile menu.

4. Verify:

   ```bash
   pnpm check:nav
   ```

   This fails if a page is missing from the nav, if a nav entry points at a
   page that does not exist, or if the sidebar's positional (`:nth-child`)
   group icons in `custom.css` no longer line up with the group order. It also
   runs automatically as part of `pnpm build` and in CI on every pull request.

## Checks

```bash
pnpm check              # all drift checks
pnpm check:nav          # nav ↔ pages ↔ generated icons (also runs on every build)
pnpm check:tokens       # brand tokens vs core/portal
pnpm check:limits       # plan limits vs core
pnpm generate:nav-icons # rewrite nav-icons.generated.css after changing NAV_ICONS
```

`check:nav` and `check:tokens` run in CI on every pull request.

`check:limits` **only works locally**, with the core repo checked out alongside
this one — on CI it can't find core and skips. `src/data/plan-limits.json` is
generated from core's `STATIC_PLAN_LIMITS`; regenerate it with
`node scripts/export-plan-limits.mjs --docs` from the core repo rather than
editing it by hand, and run `pnpm check:limits` locally after changing limits.

## Docs JSON API

`GET /api/docs.json` returns all doc pages as structured JSON:

```json
{
  "pages": [
    {
      "slug": "getting-started/quickstart",
      "title": "Quickstart",
      "description": "...",
      "content": "raw markdown body"
    }
  ]
}
```

This endpoint is consumed by Nucleus (the in-app AI assistant) via the
`read_docs` MCP tool to answer documentation questions at runtime. The
orchestrator fetches it server-side; the URL is configurable via
`NEXT_PUBLIC_DOCS_URL` (defaults to `https://docs.clustercode.io`).

## Project structure

```
docs-site/
  src/
    assets/          # logos
    components/      # Astro component overrides (Header, Sidebar, etc.)
    content/docs/    # all documentation pages (.mdx)
    nav.mjs          # SINGLE SOURCE OF TRUTH for all navigation
    pages/           # non-doc pages (404, /api/docs.json)
    styles/          # custom CSS
  public/            # static assets (favicons, images)
  scripts/           # drift checks (nav, brand tokens, plan limits)
  astro.config.mjs   # site config, social links (sidebar comes from nav.mjs)
```
