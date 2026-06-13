/**
 * Sprint finalization: open a pull request for the work produced during a
 * sprint. Triggered server-side when a sprint is completed (sprint:finalize),
 * runs in the project's working tree on the agent's host.
 *
 * All git/gh calls use execFileSync with argv arrays (no shell) and never throw
 * — failures are returned in the result so the server can surface them.
 */

import { execFileSync } from 'node:child_process';
import type { Logger } from '../utils/logger.js';

export interface FinalizeSprintInput {
  projectPath: string;
  branch: string;
  title: string;
  body: string;
}

export interface FinalizeSprintResult {
  success: boolean;
  branch: string;
  prUrl?: string;
  committed: boolean;
  error?: string;
}

/** Run a command in the project dir, returning trimmed stdout. Throws on failure. */
function run(cwd: string, cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  }).trim();
}

/** Best-effort, throw-free variant. */
function tryRun(cwd: string, cmd: string, args: string[]): { ok: boolean; out: string } {
  try {
    return { ok: true, out: run(cwd, cmd, args) };
  } catch (err) {
    const e = err as { stderr?: Buffer | string; message?: string };
    const out = (e.stderr ? e.stderr.toString() : e.message ?? '').trim();
    return { ok: false, out };
  }
}

/** Resolve the remote default branch (origin/HEAD), falling back to main/master. */
function defaultBaseBranch(cwd: string): string {
  const head = tryRun(cwd, 'git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  if (head.ok && head.out) return head.out.replace(/^origin\//, '');
  for (const b of ['main', 'master']) {
    if (tryRun(cwd, 'git', ['rev-parse', '--verify', `origin/${b}`]).ok) return b;
  }
  return 'main';
}

export function finalizeSprint(input: FinalizeSprintInput, logger: Logger): FinalizeSprintResult {
  const { projectPath, branch, title, body } = input;
  const base: FinalizeSprintResult = { success: false, branch, committed: false };

  // Must be a git work tree.
  if (!tryRun(projectPath, 'git', ['rev-parse', '--is-inside-work-tree']).ok) {
    return { ...base, error: 'not a git repository' };
  }

  const baseBranch = defaultBaseBranch(projectPath);

  // Create (or reset) the sprint branch off the current work tree so all the
  // worker's edits are captured.
  const checkout = tryRun(projectPath, 'git', ['checkout', '-B', branch]);
  if (!checkout.ok) return { ...base, error: `git checkout failed: ${checkout.out}` };

  // Stage + commit everything (skip cleanly if there is nothing to commit).
  tryRun(projectPath, 'git', ['add', '-A']);
  const dirty = !tryRun(projectPath, 'git', ['diff', '--cached', '--quiet']).ok;
  let committed = false;
  if (dirty) {
    const commit = tryRun(projectPath, 'git', ['commit', '-m', title, '-m', body]);
    if (!commit.ok) return { ...base, error: `git commit failed: ${commit.out}` };
    committed = true;
  }

  // Push the branch.
  const push = tryRun(projectPath, 'git', ['push', '-u', 'origin', branch, '--force-with-lease']);
  if (!push.ok) return { ...base, committed, error: `git push failed: ${push.out}` };

  // Open the PR via gh (if installed + authenticated).
  const ghPath = tryRun(projectPath, 'sh', ['-c', 'command -v gh']);
  if (!ghPath.ok || !ghPath.out) {
    return { success: true, branch, committed, error: 'gh CLI not available — branch pushed, open the PR manually' };
  }

  const pr = tryRun(projectPath, 'gh', [
    'pr', 'create',
    '--base', baseBranch,
    '--head', branch,
    '--title', title,
    '--body', body,
  ]);
  if (!pr.ok) {
    // PR may already exist — try to read its URL.
    const existing = tryRun(projectPath, 'gh', ['pr', 'view', branch, '--json', 'url', '-q', '.url']);
    if (existing.ok && existing.out.startsWith('http')) {
      return { success: true, branch, committed, prUrl: existing.out };
    }
    return { success: true, branch, committed, error: `gh pr create failed: ${pr.out}` };
  }

  const prUrl = pr.out.split('\n').find((l) => l.startsWith('http')) ?? pr.out;
  logger.info({ branch, prUrl }, 'Sprint pull request opened');
  return { success: true, branch, committed, prUrl };
}
