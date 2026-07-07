#!/usr/bin/env node
// check-token-drift.mjs
//
// The docs site hand-mirrors the portal/orchestrator (core) brand tokens in
// src/styles/custom.css with "match portal" comments, but there is NO build-time
// sync. This script turns that silent manual contract into a checkable one: it
// parses custom.css and fails (exit 1) listing any CSS custom property whose hex
// has drifted from the canonical core/portal value.
//
// Canonical sources (verified 2026-07-03):
//   - packages/ui/src/theme.css        (core design tokens)
//   - apps/portal/src/app/globals.css  (portal @theme vsc-* tokens)
//
// Cross-platform: plain Node, no shell-isms, no deps. Runs on Windows too.
// Usage: `node scripts/check-token-drift.mjs` or `pnpm check:tokens`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const cssPath = join(repoRoot, 'src', 'styles', 'custom.css');

// Canonical brand token table, grouped by the exact selector block in custom.css
// that is expected to define them. Each value is the authoritative core/portal hex.
const CANONICAL = [
  {
    selector: ":root[data-theme='dark']",
    tokens: {
      '--sl-color-bg': '#1e1e1e', // core bg (dark)
      '--sl-color-bg-nav': '#252526', // core surface (dark)
      '--sl-color-bg-sidebar': '#252526', // core surface (dark)
      '--sl-color-hairline': '#3c3c3c', // core border (dark)
      '--sl-color-accent': '#10c0f0', // brand green/cyan (dark)
      '--sl-color-text-accent': '#10c0f0', // brand green/cyan (dark)
      '--docs-green': '#10c0f0', // brand green/cyan (dark)
      '--docs-surface': '#252526', // core surface (dark)
      '--docs-border2': '#3c3c3c', // core border (dark)
      '--docs-focus-ring': '#569cd6', // core --accent-blue (dark)
    },
  },
  {
    selector: ":root[data-theme='light']",
    tokens: {
      '--sl-color-bg': '#ffffff', // core bg (light)
      '--sl-color-hairline': '#cecece', // core border (light)
      '--sl-color-accent': '#0890b8', // brand green/cyan (light)
      '--sl-color-text-accent': '#0890b8', // brand green/cyan (light)
      '--docs-green': '#0890b8', // brand green/cyan (light)
      '--docs-surface': '#ffffff', // core bg (light)
      '--docs-border2': '#cecece', // core border (light)
      '--docs-focus-ring': '#005fb8', // core --accent-blue (light)
    },
  },
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Extract the body of a top-level `selector { ... }` block. These brand blocks
// contain no nested braces, so a non-greedy [^}] match is sufficient. The `\s*\{`
// guard ensures we match the selector alone, not compound selectors that merely
// start with it (e.g. `:root[data-theme='dark'] .expressive-code {`).
function extractBlock(css, selector) {
  const re = new RegExp(escapeRegExp(selector) + '\\s*\\{([^}]*)\\}');
  const m = css.match(re);
  return m ? m[1] : null;
}

function readToken(blockBody, prop) {
  const re = new RegExp(escapeRegExp(prop) + '\\s*:\\s*(#[0-9a-fA-F]{3,8})');
  const m = blockBody.match(re);
  return m ? m[1].toLowerCase() : null;
}

function main() {
  let css;
  try {
    css = readFileSync(cssPath, 'utf8');
  } catch (err) {
    console.error(`✖ Could not read ${relative(repoRoot, cssPath)}: ${err.message}`);
    process.exit(1);
  }

  const drifts = [];
  const missing = [];
  let checked = 0;

  for (const group of CANONICAL) {
    const body = extractBlock(css, group.selector);
    if (body === null) {
      missing.push(`block "${group.selector}" not found in custom.css`);
      continue;
    }
    for (const [prop, expected] of Object.entries(group.tokens)) {
      checked++;
      const actual = readToken(body, prop);
      if (actual === null) {
        missing.push(`${group.selector} ${prop} (expected ${expected}) — not defined`);
      } else if (actual !== expected.toLowerCase()) {
        drifts.push(`${group.selector} ${prop}: ${actual}  ✖ expected ${expected}`);
      }
    }
  }

  if (drifts.length === 0 && missing.length === 0) {
    console.log(`✔ token drift check passed — ${checked} brand tokens match core/portal.`);
    process.exit(0);
  }

  console.error('✖ token drift check FAILED — custom.css has drifted from core/portal:\n');
  for (const d of drifts) console.error('  DRIFT   ' + d);
  for (const m of missing) console.error('  MISSING ' + m);
  console.error(
    '\nUpdate src/styles/custom.css to match, or if core intentionally changed the ' +
      'brand value, update the CANONICAL table in scripts/check-token-drift.mjs.'
  );
  process.exit(1);
}

main();
