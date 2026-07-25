#!/usr/bin/env node
// check-limits-drift.mjs
//
// The Plans & Limits page renders src/data/plan-limits.json, which is GENERATED
// from the core repo's single source of truth:
//   core/packages/shared/src/limits/plan-limits.ts  (STATIC_PLAN_LIMITS)
// via `node scripts/export-plan-limits.mjs --docs` (run from the core repo).
//
// This script turns that cross-repo contract into a checkable one: it re-derives
// the JSON from core and fails (exit 1) listing every drifted value. Before the
// data file existed the docs table was hand-written and HAD drifted (it claimed
// "Unlimited" cloud DevBoxes where the product caps them at 100).
//
// Core is a sibling checkout (<workspace>/core + <workspace>/docs). When core
// isn't present — e.g. a docs-only CI job or a contributor who cloned just this
// repo — the check SKIPS with exit 0 rather than failing on something the run
// cannot verify. Set REQUIRE_CORE=1 to turn that skip into a hard failure.
//
// Cross-platform: plain Node, no shell-isms, no deps. Runs on Windows too.
// Usage: `node scripts/check-limits-drift.mjs` or `pnpm check:limits`.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const dataPath = join(repoRoot, 'src', 'data', 'plan-limits.json');

const corePath = process.env.CORE_REPO
  ? resolve(process.env.CORE_REPO)
  : resolve(repoRoot, '..', 'core');
const canonicalPath = join(corePath, 'packages', 'shared', 'dist', 'limits', 'plan-limits.js');

if (!existsSync(dataPath)) {
  console.error(`FAIL: ${dataPath} is missing. Regenerate it from the core repo:`);
  console.error('  node scripts/export-plan-limits.mjs --docs');
  process.exit(1);
}

if (!existsSync(canonicalPath)) {
  const msg =
    `core repo not found at ${corePath} (looked for packages/shared/dist/limits/plan-limits.js).\n` +
    'Build it with `npm run build:packages` in core, or set CORE_REPO=<path>.';
  if (process.env.REQUIRE_CORE === '1') {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`SKIP: limits drift check — ${msg}`);
  process.exit(0);
}

const { STATIC_PLAN_LIMITS } = await import(pathToFileURL(canonicalPath).href);
const committed = JSON.parse(readFileSync(dataPath, 'utf8'));

const drift = [];
const plans = Object.keys(STATIC_PLAN_LIMITS);

for (const plan of plans) {
  const canonical = STATIC_PLAN_LIMITS[plan];
  const mirrored = committed.plans?.[plan];
  if (!mirrored) {
    drift.push(`plans.${plan}: missing from the committed JSON entirely`);
    continue;
  }
  for (const [dim, expected] of Object.entries(canonical)) {
    const actual = mirrored[dim];
    if (actual !== expected) {
      drift.push(`plans.${plan}.${dim}: docs has ${JSON.stringify(actual)}, core says ${JSON.stringify(expected)}`);
    }
  }
  // A dimension REMOVED from core but still mirrored here would silently keep
  // rendering a limit that no longer exists.
  for (const dim of Object.keys(mirrored)) {
    if (!(dim in canonical)) {
      drift.push(`plans.${plan}.${dim}: present in docs but no longer defined in core`);
    }
  }
}

for (const plan of Object.keys(committed.plans ?? {})) {
  if (!plans.includes(plan)) drift.push(`plans.${plan}: plan tier no longer exists in core`);
}

if (drift.length > 0) {
  console.error('FAIL: docs plan limits have drifted from core.\n');
  for (const d of drift) console.error(`  - ${d}`);
  console.error('\nRegenerate from the core repo:');
  console.error('  node scripts/export-plan-limits.mjs --docs');
  process.exit(1);
}

console.log(`OK: plan limits match core (${plans.length} tiers, ${Object.keys(STATIC_PLAN_LIMITS.starter).length} dimensions each).`);
