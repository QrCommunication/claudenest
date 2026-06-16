/**
 * Sprint finalization: open a pull request for the work produced during a
 * sprint. Triggered server-side when a sprint is completed (sprint:finalize),
 * runs in the project's working tree on the agent's host.
 *
 * Like the orchestrated workers, the git/gh commands run INSIDE the bubblewrap
 * sandbox (same "read-all, write-confined-to-project" profile): the whole FS is
 * visible read-only so git/gh/ssh and their credentials (~/.ssh, ~/.config/gh,
 * ~/.gitconfig, the ssh-agent socket) keep working, while the only writable
 * carve-out is the project tree (.git/ included). The PR is therefore created
 * by a sandboxed process, never an unconfined host one. Fail-open: if bwrap is
 * unavailable the commands run unsandboxed rather than failing to ship the PR.
 *
 * All git/gh calls use execFileSync with argv arrays (no shell) and never throw
 * — failures are returned in the result so the server can surface them.
 */

import { execFileSync } from 'node:child_process';
import type { Logger } from '../utils/logger.js';
import { buildBwrapArgs, findBwrap } from './sandbox.js';

export interface FinalizeSprintInput {
  projectPath: string;
  branch: string;
  title: string;
  body: string;
  /**
   * When true, merge the PR right after opening it (squash) so the work ships
   * in one shot. Opt-in: sprints open the PR for review, epics merge it. The
   * merge is best-effort — a failure leaves the PR open and is surfaced.
   */
  merge?: boolean;
}

export interface FinalizeSprintResult {
  success: boolean;
  branch: string;
  prUrl?: string;
  committed: boolean;
  sandboxed: boolean;
  /** True once the PR has been merged (only attempted when input.merge). */
  merged?: boolean;
  error?: string;
}

/**
 * Build the bwrap-wrapped argv for a command when sandboxing is available, or
 * the bare command otherwise. The sandbox prefix already carries `--chdir
 * <projectPath>`, so the command runs in the project tree inside the sandbox.
 */
function commandLine(
  bwrapBin: string | null,
  sandboxPrefix: string[] | null,
  cmd: string,
  args: string[],
): [string, string[]] {
  if (bwrapBin && sandboxPrefix) {
    return [bwrapBin, [...sandboxPrefix, '--', cmd, ...args]];
  }
  return [cmd, args];
}

export function finalizeSprint(input: FinalizeSprintInput, logger: Logger): FinalizeSprintResult {
  const { projectPath, branch, title, body, merge = false } = input;

  // Resolve the sandbox once. ensureBwrap() already ran at agent startup; here
  // we only look it up (no install) and fail open to unsandboxed if absent.
  const bwrapBin = findBwrap();
  const sandboxPrefix = bwrapBin ? buildBwrapArgs({ projectPath }) : null;
  const sandboxed = Boolean(bwrapBin && sandboxPrefix);

  const base: FinalizeSprintResult = { success: false, branch, committed: false, sandboxed };

  /** Run a command (sandboxed when available), throw-free, trimmed output. */
  const exec = (cmd: string, args: string[]): { ok: boolean; out: string } => {
    const [bin, argv] = commandLine(bwrapBin, sandboxPrefix, cmd, args);
    try {
      const out = execFileSync(bin, argv, {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120_000,
      }).trim();
      return { ok: true, out };
    } catch (err) {
      const e = err as { stderr?: Buffer | string; message?: string };
      const out = (e.stderr ? e.stderr.toString() : e.message ?? '').trim();
      return { ok: false, out };
    }
  };

  /**
   * Merge the just-opened PR (squash) when the caller asked for it. Mirrors the
   * resilient pr:merge handler: merge via the API only (no `--delete-branch`,
   * which would `git checkout` the base and abort on a dirty tree), treat an
   * already-merged PR as success, then clean the remote branch up best-effort.
   * Returns merged=false + an error string on failure (PR stays open).
   */
  const mergePr = (): { merged: boolean; error?: string } => {
    if (!merge) return { merged: false };

    const res = exec('gh', ['pr', 'merge', branch, '--squash']);
    const alreadyMerged = !res.ok && /already merged/i.test(res.out);
    if (!res.ok && !alreadyMerged) {
      return { merged: false, error: `gh pr merge failed: ${res.out}` };
    }

    // Best-effort branch cleanup — never affects the merge result. Remote ref
    // delete over the network (no checkout); local ref restore happens below.
    exec('git', ['push', 'origin', '--delete', branch]);
    logger.info({ branch, alreadyMerged, sandboxed }, 'Epic pull request merged');
    return { merged: true };
  };

  logger.info(
    { branch, sandboxed },
    sandboxed
      ? 'Sprint finalize running sandboxed (bwrap)'
      : 'Sprint finalize running unsandboxed (bwrap unavailable — fail-open)',
  );

  // Must be a git work tree.
  if (!exec('git', ['rev-parse', '--is-inside-work-tree']).ok) {
    return { ...base, error: 'not a git repository' };
  }

  // Resolve the remote default branch (origin/HEAD), falling back to main/master.
  const baseBranch = ((): string => {
    const head = exec('git', ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
    if (head.ok && head.out) return head.out.replace(/^origin\//, '');
    for (const b of ['main', 'master']) {
      if (exec('git', ['rev-parse', '--verify', `origin/${b}`]).ok) return b;
    }
    return 'main';
  })();

  // Remember the branch currently checked out so we can restore it afterwards.
  // Creating the sprint branch must NEVER leave the agent's working tree
  // stranded on it — on a dev machine the project tree may be a human's active
  // repo, and a `checkout -B` would hijack their branch.
  const originalRef = ((): string | null => {
    const r = exec('git', ['symbolic-ref', '--short', 'HEAD']);
    return r.ok && r.out ? r.out : null;
  })();

  const result: FinalizeSprintResult = (() => {
    // Create (or reset) the sprint branch off the current work tree so all the
    // worker's edits are captured.
    const checkout = exec('git', ['checkout', '-B', branch]);
    if (!checkout.ok) return { ...base, error: `git checkout failed: ${checkout.out}` };

    // Stage + commit everything (skip cleanly if there is nothing to commit).
    exec('git', ['add', '-A']);
    const dirty = !exec('git', ['diff', '--cached', '--quiet']).ok;
    let committed = false;
    if (dirty) {
      const commit = exec('git', ['commit', '-m', title, '-m', body]);
      if (!commit.ok) return { ...base, error: `git commit failed: ${commit.out}` };
      committed = true;
    }

    // Push the branch.
    const push = exec('git', ['push', '-u', 'origin', branch, '--force-with-lease']);
    if (!push.ok) return { ...base, committed, error: `git push failed: ${push.out}` };

    // Open the PR via gh (if installed + authenticated).
    const ghPath = exec('sh', ['-c', 'command -v gh']);
    if (!ghPath.ok || !ghPath.out) {
      return {
        ...base,
        success: true,
        committed,
        error: 'gh CLI not available — branch pushed, open the PR manually',
      };
    }

    const pr = exec('gh', [
      'pr', 'create',
      '--base', baseBranch,
      '--head', branch,
      '--title', title,
      '--body', body,
    ]);
    if (!pr.ok) {
      // PR may already exist — try to read its URL.
      const existing = exec('gh', ['pr', 'view', branch, '--json', 'url', '-q', '.url']);
      if (existing.ok && existing.out.startsWith('http')) {
        const m = mergePr();
        return { ...base, success: true, committed, prUrl: existing.out, merged: m.merged, error: m.error };
      }
      return { ...base, success: true, committed, error: `gh pr create failed: ${pr.out}` };
    }

    const prUrl = pr.out.split('\n').find((l) => l.startsWith('http')) ?? pr.out;
    logger.info({ branch, prUrl, sandboxed }, 'Sprint pull request opened');
    const m = mergePr();
    return { ...base, success: true, committed, prUrl, merged: m.merged, error: m.error };
  })();

  // Restore the original checkout (best-effort) so the working tree is never
  // left on the sprint branch.
  if (originalRef && originalRef !== branch) {
    exec('git', ['checkout', originalRef]);
  }

  return result;
}
