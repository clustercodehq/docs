#!/usr/bin/env node
/**
 * Fails when the nav tree and the docs on disk disagree.
 *
 * src/nav.mjs feeds the sidebar, header, mobile menu and search index, so a
 * page missing from it is invisible everywhere — which is exactly how the
 * whole Automation section stayed out of search and the mobile menu, and how
 * the palette kept linking `/guides/cron-workflows/` after that page was
 * renamed. This catches both directions.
 *
 * Run: pnpm check:nav
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nav, NAV_ICONS } from '../src/nav.mjs';
import { isCurrent } from './generate-nav-icons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'src', 'content', 'docs');

function walk(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;
    if (entry.isDirectory()) {
      out.push(...walk(join(dir, name), `${prefix}${name}/`));
    } else if (name.endsWith('.mdx') || name.endsWith('.md')) {
      out.push(`${prefix}${name.replace(/\.mdx?$/, '')}`);
    }
  }
  return out;
}

// The splash landing page is reached via the logo, not a nav entry.
const pages = walk(docsDir).filter((slug) => slug !== 'index');
const navSlugs = nav.flatMap((group) => group.items.map((item) => item.slug).filter(Boolean));

const missing = pages.filter((slug) => !navSlugs.includes(slug));
const dangling = navSlugs.filter(
  (slug) => !existsSync(join(docsDir, `${slug}.mdx`)) && !existsSync(join(docsDir, `${slug}.md`)),
);
const duplicates = navSlugs.filter((slug, i) => navSlugs.indexOf(slug) !== i);

const problems = [];
if (missing.length) {
  problems.push(
    `${missing.length} page(s) are not in src/nav.mjs — unreachable from the sidebar, ` +
      `header, mobile menu and search:\n` +
      missing.map((s) => `    ${s}`).join('\n'),
  );
}
if (dangling.length) {
  problems.push(
    `${dangling.length} nav entr(ies) point at a page that does not exist — these are ` +
      `404s in the nav and search:\n` +
      dangling.map((s) => `    ${s}`).join('\n'),
  );
}
if (duplicates.length) {
  problems.push(
    `${duplicates.length} slug(s) appear in more than one nav group:\n` +
      [...new Set(duplicates)].map((s) => `    ${s}`).join('\n'),
  );
}

// Group `href` is what the header and mobile menu actually navigate to, and a
// bad `icon` key silently degrades to the generic file glyph everywhere rather
// than failing loudly. Both are the same 404-class this check exists to stop.
const badHref = nav
  .filter((group) => {
    const href = group.href ?? '';
    if (!href || /^https?:\/\//.test(href)) return false; // off-site links aren't ours to verify
    const slug = href.replace(/^\/+|\/+$/g, '');
    return !existsSync(join(docsDir, `${slug}.mdx`)) && !existsSync(join(docsDir, `${slug}.md`));
  })
  .map((group) => `    ${group.label} → ${group.href}`);
if (badHref.length) {
  problems.push(`group href(s) point at a page that does not exist:\n${badHref.join('\n')}`);
}

const badIcon = nav
  .filter((group) => !(group.icon in NAV_ICONS))
  .map((group) => `    ${group.label} → "${group.icon}"`);
if (badIcon.length) {
  problems.push(
    `group icon(s) are not in NAV_ICONS — these silently fall back to the generic ` +
      `file glyph instead of erroring:\n${badIcon.join('\n')}`,
  );
}

// Sidebar group icons are CSS masks selected by `:nth-child(N)`, so they are
// bound to group POSITION. Rather than police a hand-written copy — which drifted,
// and whose guard had a false pass on renumbered selectors — the rules are now
// generated from NAV_ICONS. All this has to check is that the generated file on
// disk is current; the numbering and artwork follow the tree by construction.
if (!isCurrent()) {
  problems.push(
    `src/styles/nav-icons.generated.css is stale — it no longer matches NAV_ICONS ` +
      `or the group order in src/nav.mjs.\n    Fix: pnpm generate:nav-icons`,
  );
}

if (problems.length) {
  console.error('✗ Nav drift detected\n');
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error('  src/nav.mjs is the single source of truth for navigation.\n');
  process.exit(1);
}

console.log(
  `✓ Nav in sync — ${pages.length} pages, all present in src/nav.mjs, no dead links, ` +
    `${nav.length} group icons generated and current.`,
);
