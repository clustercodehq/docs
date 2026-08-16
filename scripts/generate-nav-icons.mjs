#!/usr/bin/env node
/**
 * Generates the sidebar's group-icon CSS from NAV_ICONS.
 *
 * Starlight gives us no hook to put markup inside a sidebar group's <summary>,
 * so the icons are CSS mask images on `::before`, selected by `:nth-child(N)`.
 * That used to mean a second, hand-maintained copy of every icon's path data
 * living in custom.css — which had already drifted from NAV_ICONS.
 *
 * Now the masks are generated, so there is exactly one copy of the artwork and
 * the :nth-child numbering follows group order automatically. `pnpm check:nav`
 * fails if this file is stale.
 *
 * Run: pnpm generate:nav-icons
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nav, NAV_ICONS } from '../src/nav.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_PATH = join(root, 'src', 'styles', 'nav-icons.generated.css');

/** Wrap an icon's inner markup as a standalone SVG data URI for `mask-image`. */
function maskUri(iconKey) {
  const inner = NAV_ICONS[iconKey];
  if (!inner) throw new Error(`nav.mjs group uses unknown icon "${iconKey}"`);
  // Only the alpha channel matters for a mask, so the stroke colour is arbitrary.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    `${inner}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function buildCss() {
  const rows = nav.map((group, i) => {
    const uri = maskUri(group.icon);
    return (
      `/* ${i + 1}. ${group.label} — ${group.icon} */\n` +
      `sl-sidebar-state-persist > ul > li:nth-child(${i + 1}) > details > summary .group-label .large::before {\n` +
      `  -webkit-mask-image: url("${uri}");\n` +
      `  mask-image: url("${uri}");\n` +
      `}\n`
    );
  });

  return (
    `/* GENERATED FILE — DO NOT EDIT.\n` +
    `   Source: src/nav.mjs (NAV_ICONS + group order)\n` +
    `   Regenerate: pnpm generate:nav-icons\n` +
    `   Verified by: pnpm check:nav\n\n` +
    `   Sidebar group icons. Selected positionally because Starlight owns the\n` +
    `   <summary> markup; the numbering is generated from nav order, so it\n` +
    `   cannot drift out of step with the tree. */\n\n` +
    `sl-sidebar-state-persist > ul > li > details > summary .group-label .large::before {\n` +
    `  content: '';\n` +
    `  display: inline-block;\n` +
    `  width: 20px;\n` +
    `  height: 20px;\n` +
    `  margin-inline-end: 0.75rem;\n` +
    `  vertical-align: -4px;\n` +
    `  background-color: currentColor;\n` +
    `  -webkit-mask-size: contain;\n` +
    `  -webkit-mask-repeat: no-repeat;\n` +
    `  -webkit-mask-position: center;\n` +
    `  mask-size: contain;\n` +
    `  mask-repeat: no-repeat;\n` +
    `  mask-position: center;\n` +
    `}\n\n` +
    rows.join('\n')
  );
}

/**
 * True when the file on disk already matches what we would generate.
 *
 * Line endings are normalised first: git checks this file out with CRLF on
 * Windows (core.autocrlf), while buildCss() always emits LF — comparing raw
 * would fail check:nav, and therefore the build, on a fresh Windows clone.
 */
export function isCurrent() {
  if (!existsSync(OUT_PATH)) return false;
  const lf = (s) => s.replace(/\r\n/g, '\n');
  return lf(readFileSync(OUT_PATH, 'utf8')) === lf(buildCss());
}

// Only write when run directly, so check:nav can import the helpers read-only.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT_PATH, buildCss());
  console.log(`✓ Wrote ${nav.length} sidebar group icons to src/styles/nav-icons.generated.css`);
}
