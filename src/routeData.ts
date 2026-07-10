import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/**
 * Environment-aware, brand-first `<title>` tag for browser tab identification.
 *
 * Mirrors the convention used by the other ClusterCode apps (see
 * `apps/portal/src/app/title.ts` and `apps/orchestrator/src/app/title.ts` in
 * the core repo):
 *
 * - Production build (`astro build`): NO env prefix — clean
 *   `ClusterCode Docs · Page`.
 * - Dev server (`astro dev`): a `[LOCAL Docs] ` prefix so a docs tab is easy
 *   to tell apart from prod/other apps' tabs. The docs site has no separate
 *   UAT deployment, so this is dev-only (`import.meta.env.DEV`).
 *
 * Starlight's default title is page-first (`Page | Site`, via
 * `titleDelimiter`); this middleware rewrites the generated `<title>` head
 * entry to the brand-first order the rest of the product uses. It only
 * touches the `title` tag — per-page `og:*`/`twitter:*` overrides (e.g. the
 * landing page's custom social-card copy in `index.mdx`) are left untouched.
 */
const envPrefix = import.meta.env.DEV ? '[LOCAL Docs] ' : '';
const BRAND = 'ClusterCode Docs';

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;
  const isHome = context.url.pathname === '/' || context.url.pathname === '';

  const pageTitle = isHome ? BRAND : `${BRAND} · ${starlightRoute.entry.data.title}`;

  const titleTag = starlightRoute.head.find((tag) => tag.tag === 'title');
  if (!titleTag) return;

  // A page that sets its own `head: - tag: title` in frontmatter is making a
  // deliberate (usually SEO) choice — respect it instead of silently
  // clobbering it with the generic brand-first title. The dev env prefix is
  // still applied so local tabs stay identifiable.
  const hasFrontmatterTitle = (starlightRoute.entry.data.head ?? []).some(
    (tag) => tag.tag === 'title',
  );
  titleTag.content = hasFrontmatterTitle
    ? `${envPrefix}${titleTag.content ?? ''}`
    : `${envPrefix}${pageTitle}`;
});
