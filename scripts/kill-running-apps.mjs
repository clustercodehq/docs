#!/usr/bin/env node
/**
 * Kill running instances of the ClusterCode docs site (Astro dev / preview) on the
 * local machine.
 *
 * What it kills:
 *   - Astro dev + preview servers started from THIS repo. The process appears as
 *     `node node_modules/.bin/../astro/astro.js dev` — a RELATIVE path, so the
 *     command line alone is not repo-specific (another Astro project on the
 *     machine looks identical). To avoid cross-killing an unrelated site, every
 *     pattern match is filtered by the process working directory: a pid is only
 *     killed when its cwd is inside this repo (see `isInThisRepo`).
 *   - The default Astro port (4321), as a belt-and-suspenders for a server whose
 *     cwd couldn't be read.
 *
 * If port numbers are passed as arguments, only those ports are killed
 * (no process-name hunting). Use this for a server on a non-default port — e.g.
 * the docs dev server is sometimes run on 4399.
 *
 * Usage:
 *   node scripts/kill-running-apps.mjs            # kill this repo's astro servers
 *   node scripts/kill-running-apps.mjs 4399        # kill port 4399 only
 */
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const isWindows = process.platform === 'win32';
// Repo root = parent of this script's directory (scripts/ -> repo root).
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let totalKilled = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePid(s) {
  if (typeof s !== 'string' || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePort(arg) {
  if (typeof arg !== 'string' || !/^\d+$/.test(arg)) return null;
  const n = Number(arg);
  if (!Number.isInteger(n) || n < 1 || n > 65535) return null;
  return n;
}

function pidsOnPort(port) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const match = line.match(/\s(\d+)\s*$/);
        const local = line.trim().split(/\s+/)[1];
        if (match && local && local.endsWith(`:${port}`)) {
          const pid = parsePid(match[1]);
          if (pid !== null) pids.add(pid);
        }
      }
      return [...pids];
    }
    const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return out.split(/\s+/).map(parsePid).filter((p) => p !== null);
  } catch {
    return [];
  }
}

function killProcessTree(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
      return true;
    }
    // Find the process group ID and kill the whole group
    const pgid = execSync(`ps -o pgid= -p ${pid}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (pgid && /^\d+$/.test(pgid)) {
      try { execSync(`kill -9 -${pgid}`, { stdio: 'ignore' }); } catch { /* already gone */ }
    }
    // Ensure the target itself is dead
    try { execSync(`kill -9 ${pid}`, { stdio: 'ignore' }); } catch { /* already gone */ }
    return true;
  } catch {
    return false;
  }
}

/**
 * The working directory of a process, or null if it can't be read.
 *   - Unix: `lsof -a -p <pid> -d cwd -Fn` prints an `n<path>` line for the cwd.
 *   - Windows: Win32_Process doesn't expose cwd, so we return null and fall
 *     back to a command-line repo-path check in `isInThisRepo`.
 */
function procCwd(pid) {
  if (isWindows) return null;
  try {
    const out = execSync(`lsof -a -p ${pid} -d cwd -Fn`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    const line = out.split(/\r?\n/).find((l) => l.startsWith('n'));
    return line ? line.slice(1) : null;
  } catch {
    return null;
  }
}

/** Windows-only: the full command line of a process (used as a cwd fallback). */
function procCommandLine(pid) {
  try {
    const cmd =
      `powershell -NoProfile -Command "(Get-CimInstance Win32_Process ` +
      `-Filter 'ProcessId=${pid}').CommandLine"`;
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

/**
 * True when `pid` belongs to this repo. On Unix we compare the real cwd; on
 * Windows (no cwd via WMI) we look for the repo path in the command line.
 */
function isInThisRepo(pid) {
  if (isWindows) {
    const cmd = procCommandLine(pid);
    return cmd ? cmd.includes(REPO_ROOT) : false;
  }
  const cwd = procCwd(pid);
  return cwd ? cwd === REPO_ROOT || cwd.startsWith(REPO_ROOT + '/') : false;
}

function findProcessesByPattern(pattern) {
  try {
    const myPid = process.pid;
    if (isWindows) {
      const psPattern = pattern.replace(/'/g, "''");
      const cmd =
        `powershell -NoProfile -Command "Get-CimInstance Win32_Process | ` +
        `Where-Object { $_.CommandLine -match '${psPattern}' } | ` +
        `ForEach-Object { $_.ProcessId }"`;
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      return out
        .split(/\r?\n/)
        .map((line) => parsePid(line.trim()))
        .filter((p) => p !== null && p !== myPid);
    }
    const out = execSync(`pgrep -f "${pattern}"`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return out
      .split(/\s+/)
      .map(parsePid)
      .filter((p) => p !== null && p !== myPid);
  } catch {
    return [];
  }
}

/** Pattern match, then keep only pids whose cwd/cmdline is inside this repo. */
function findRepoProcessesByPattern(pattern) {
  return findProcessesByPattern(pattern).filter(isInThisRepo);
}

function killWithLabel(label, pids) {
  if (pids.length === 0) {
    console.log(`  ${label}: nothing running`);
    return;
  }
  for (const pid of pids) {
    const ok = killProcessTree(pid);
    console.log(`  ${label}: ${ok ? 'killed' : 'failed to kill'} pid ${pid}`);
    if (ok) totalKilled++;
  }
}

// ── Port-only mode ───────────────────────────────────────────────────────────

const portArgs = process.argv.slice(2).map(parsePort).filter((p) => p !== null);

if (portArgs.length > 0) {
  for (const port of portArgs) {
    killWithLabel(`port ${port}`, pidsOnPort(port));
  }
  console.log(`done (${totalKilled} process${totalKilled === 1 ? '' : 'es'} killed)`);
  process.exit(0);
}

// ── Full mode: kill this repo's Astro dev/preview servers ────────────────────

console.log(`Repo: ${REPO_ROOT}`);

// Astro dev + preview servers started from this repo. Matched by the astro CLI
// entry, then filtered to this repo's cwd so a sibling Astro project survives.
console.log('\nAstro servers (this repo):');
const astroPids = [
  ...findRepoProcessesByPattern('astro/astro\\.js (dev|preview)'),
  ...findRepoProcessesByPattern('astro\\.js (dev|preview)'),
];
killWithLabel('astro', [...new Set(astroPids)]);

// Default Astro port — catches a server whose cwd couldn't be read. A
// non-default port (e.g. 4399) should be passed explicitly in port-only mode.
console.log('\nLocal ports:');
for (const [port, name] of [[4321, 'astro']]) {
  killWithLabel(`${name} (:${port})`, pidsOnPort(port));
}

// Final sweep — warn on any this-repo astro server that survived (rare: pgid
// lookup failed, or a watcher respawned it between the kill and now).
console.log('\nFinal sweep:');
const survivors = new Set();
for (const pattern of ['astro/astro\\.js (dev|preview)', 'astro\\.js (dev|preview)']) {
  for (const pid of findRepoProcessesByPattern(pattern)) survivors.add(pid);
}
if (survivors.size === 0) {
  console.log('  clean — no this-repo astro servers survived');
} else {
  console.log(`  WARNING: ${survivors.size} process${survivors.size === 1 ? '' : 'es'} still alive:`);
  for (const pid of survivors) {
    try {
      const cmd = execSync(`ps -o command= -p ${pid}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      console.log(`    pid ${pid}: ${cmd.slice(0, 200)}`);
    } catch {
      console.log(`    pid ${pid}: (no longer accessible)`);
    }
  }
}

console.log(`\ndone (${totalKilled} process${totalKilled === 1 ? '' : 'es'} killed)`);
