#!/usr/bin/env node
/**
 * check-secrets.mjs — scan files for likely committed credentials.
 *
 * Reports: file path, line number, pattern name.
 * Never prints credential values or identifying fragments.
 * Exit 0 = clean. Exit 1 = findings detected.
 *
 * Usage:
 *   npm run check-secrets              # scan all git-tracked files
 *   node scripts/check-secrets.mjs     # same
 *   node scripts/check-secrets.mjs --staged   # staged files only (pre-commit)
 *   node scripts/check-secrets.mjs path/to/file.ts   # specific files
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { extname } from 'path';

// ── Secret patterns ──────────────────────────────────────────────────────────
// These match the credential value itself (not the variable name), so they
// fire only when a real value is present — not on empty assignments like
// SUPABASE_SERVICE_ROLE_KEY= in .env.example.

const PATTERNS = [
  {
    name: 'JWT (base64-encoded token)',
    // All JWTs begin with eyJ after base64-encoding {"alg":
    re: /eyJhbGci[A-Za-z0-9_-]{20,}/,
  },
  {
    name: 'Supabase secret key (sb_secret_)',
    re: /sb_secret_[A-Za-z0-9_-]{10,}/,
  },
  {
    name: 'Supabase publishable key (sb_publishable_)',
    re: /sb_publishable_[A-Za-z0-9_-]{10,}/,
  },
  {
    name: 'Stripe live secret key',
    re: /sk_live_[A-Za-z0-9]{20,}/,
  },
  {
    name: 'Stripe test secret key',
    re: /sk_test_[A-Za-z0-9]{20,}/,
  },
  {
    name: 'GitHub personal access token (ghp_)',
    re: /ghp_[A-Za-z0-9]{36,}/,
  },
  {
    name: 'GitHub fine-grained PAT (github_pat_)',
    re: /github_pat_[A-Za-z0-9_]{80,}/,
  },
  {
    name: 'Anthropic API key (sk-ant-)',
    re: /sk-ant-[A-Za-z0-9_-]{60,}/,
  },
  {
    name: 'OpenAI API key (sk-)',
    // Long enough to avoid false-positives on short sk- prefixes
    re: /sk-[A-Za-z0-9]{48}/,
  },
  {
    name: 'Resend API key (re_)',
    re: /re_[A-Za-z0-9_]{30,}/,
  },
  {
    name: 'AWS secret access key assignment',
    // Only fires when followed by a 40-char value (never fires on empty assignment)
    re: /AWS_SECRET_ACCESS_KEY\s*[=:]\s*[A-Za-z0-9/+]{40}/,
  },
  {
    name: 'Private key block',
    re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

// ── Files to skip regardless of content ─────────────────────────────────────
const SKIP_PATH_PATTERNS = [
  /^\.git\//,
  /^node_modules\//,
  /^\.next\//,
  /\.min\.[cm]?js$/,
  // .env.example is intentionally tracked with blank values only
  /^\.env\.example$/,
  // This scanner itself documents pattern strings — not real secrets
  /scripts\/check-secrets\.mjs$/,
];

const SCANNABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs',
  '.json', '.sql', '.sh', '.bash', '.env',
  '.yaml', '.yml', '.toml', '.txt', '.md',
]);

// ── File resolution ──────────────────────────────────────────────────────────

function getFilesToScan() {
  const args = process.argv.slice(2);

  if (args.includes('--staged')) {
    return getStagedFiles();
  }

  if (args.length > 0 && !args[0].startsWith('--')) {
    return args.filter(f => existsSync(f));
  }

  // Default: all tracked files
  return getAllTrackedFiles();
}

function getStagedFiles() {
  try {
    return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getAllTrackedFiles() {
  try {
    return execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ── Scan ─────────────────────────────────────────────────────────────────────

const files = getFilesToScan();
const findings = [];

for (const file of files) {
  if (SKIP_PATH_PATTERNS.some(p => p.test(file))) continue;

  const ext = extname(file).toLowerCase();
  if (ext && !SCANNABLE_EXTENSIONS.has(ext)) continue;

  if (!existsSync(file)) continue;

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        findings.push({ file, lineNumber: i + 1, pattern: name });
        break; // one finding per line is enough
      }
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (findings.length === 0) {
  console.log('check-secrets: no credentials detected.');
  process.exit(0);
}

process.stderr.write('\n[check-secrets] Potential credentials detected — commit blocked.\n\n');
for (const { file, lineNumber, pattern } of findings) {
  process.stderr.write(`  ${file}:${lineNumber}  (${pattern})\n`);
}
process.stderr.write(
  '\nUse process.env for credentials. Never hardcode keys in source files.\n\n',
);
process.exit(1);
