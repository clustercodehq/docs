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

3. Register the page in the sidebar at `astro.config.mjs` under the
   appropriate section's `items` array:

   ```js
   { label: 'Page Title', slug: '<section>/<slug>' }
   ```

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
    pages/           # non-doc pages (404, /api/docs.json)
    styles/          # custom CSS
  public/            # static assets (favicons, images)
  astro.config.mjs   # site config, sidebar, social links
```
