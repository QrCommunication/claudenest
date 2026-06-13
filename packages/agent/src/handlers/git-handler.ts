/**
 * Git worktree + pull-request handlers.
 *
 * Lets the dashboard track a shared project's git state and act on it:
 *  - git:status — branch, ahead/behind, dirty files (porcelain v2)
 *  - pr:list    — open pull requests via `gh pr list`
 *  - pr:merge   — merge a PR via `gh pr merge` (squash/merge/rebase)
 *
 * All commands run in the project's working tree through the SAME bubblewrap
 * sandbox as the workers (read-all FS so git/gh/ssh + credentials work; writes
 * confined to the project tree). Each handler is request/response: it echoes the
 * caller's `requestId` so the server's AgentGateway::sendAndWait resolves.
 *
 * Throw-free: any failure is returned as `{ error }` in the response so the
 * server surfaces it instead of the request timing out.
 */

import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import { createSandboxedRunner } from '../sessions/sandbox.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

interface GitStatusRequest {
  requestId: string;
  projectPath: string;
}

interface PrListRequest {
  requestId: string;
  projectPath: string;
}

interface PrMergeRequest {
  requestId: string;
  projectPath: string;
  number: number;
  method?: 'squash' | 'merge' | 'rebase';
  deleteBranch?: boolean;
}

interface GitFileChange {
  path: string;
  /** Two-letter porcelain code, e.g. ' M', '??', 'A ', 'MM'. */
  code: string;
}

/** Parse `git status --porcelain=v1 -b -z` (NUL-separated, branch header first). */
function parsePorcelain(out: string): {
  branch: string | null;
  ahead: number;
  behind: number;
  files: GitFileChange[];
} {
  const records = out.split('\0').filter((r) => r.length > 0);
  let branch: string | null = null;
  let ahead = 0;
  let behind = 0;
  const files: GitFileChange[] = [];

  for (const rec of records) {
    if (rec.startsWith('## ')) {
      const header = rec.slice(3);
      // "main...origin/main [ahead 1, behind 2]" | "main" | "No commits yet on main"
      branch = header.split('...')[0]?.split(' ')[0] ?? null;
      const am = header.match(/ahead (\d+)/);
      const bm = header.match(/behind (\d+)/);
      if (am) ahead = Number(am[1]);
      if (bm) behind = Number(bm[1]);
      continue;
    }
    // "XY <path>" — code is the first two chars.
    files.push({ code: rec.slice(0, 2), path: rec.slice(3) });
  }

  return { branch, ahead, behind, files };
}

export function createGitHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  async function handleStatus(payload: GitStatusRequest): Promise<void> {
    const { requestId, projectPath } = payload ?? ({} as GitStatusRequest);
    if (!requestId || !projectPath) {
      logger.warn({ payload }, 'git:status ignored — missing fields');
      return;
    }

    const runner = createSandboxedRunner(projectPath);

    if (!runner.exec('git', ['rev-parse', '--is-inside-work-tree']).ok) {
      wsClient.send('git:status:result', { requestId, error: 'not a git repository' });
      return;
    }

    const status = runner.exec('git', ['status', '--porcelain=v1', '-b', '-z']);
    if (!status.ok) {
      wsClient.send('git:status:result', { requestId, error: `git status failed: ${status.out}` });
      return;
    }

    const parsed = parsePorcelain(status.out);
    const remoteUrl = runner.exec('git', ['remote', 'get-url', 'origin']);
    const lastCommit = runner.exec('git', ['log', '-1', '--pretty=%h %s']);

    wsClient.send('git:status:result', {
      requestId,
      sandboxed: runner.sandboxed,
      branch: parsed.branch,
      ahead: parsed.ahead,
      behind: parsed.behind,
      clean: parsed.files.length === 0,
      files: parsed.files,
      remoteUrl: remoteUrl.ok ? remoteUrl.out : null,
      lastCommit: lastCommit.ok ? lastCommit.out : null,
    });
  }

  async function handlePrList(payload: PrListRequest): Promise<void> {
    const { requestId, projectPath } = payload ?? ({} as PrListRequest);
    if (!requestId || !projectPath) {
      logger.warn({ payload }, 'pr:list ignored — missing fields');
      return;
    }

    const runner = createSandboxedRunner(projectPath);

    if (!runner.exec('sh', ['-c', 'command -v gh']).ok) {
      wsClient.send('pr:list:result', { requestId, error: 'gh CLI not available on the machine' });
      return;
    }

    const res = runner.exec('gh', [
      'pr', 'list',
      '--state', 'open',
      '--limit', '50',
      '--json', 'number,title,headRefName,baseRefName,isDraft,mergeable,mergeStateStatus,url,createdAt,author',
    ]);
    if (!res.ok) {
      wsClient.send('pr:list:result', { requestId, error: `gh pr list failed: ${res.out}` });
      return;
    }

    let prs: unknown[] = [];
    try {
      prs = JSON.parse(res.out || '[]');
    } catch {
      prs = [];
    }

    wsClient.send('pr:list:result', { requestId, sandboxed: runner.sandboxed, prs });
  }

  async function handlePrMerge(payload: PrMergeRequest): Promise<void> {
    const { requestId, projectPath, number, method = 'squash', deleteBranch = true } =
      payload ?? ({} as PrMergeRequest);
    if (!requestId || !projectPath || !number) {
      logger.warn({ payload }, 'pr:merge ignored — missing fields');
      return;
    }

    const runner = createSandboxedRunner(projectPath);

    if (!runner.exec('sh', ['-c', 'command -v gh']).ok) {
      wsClient.send('pr:merge:result', { requestId, merged: false, error: 'gh CLI not available' });
      return;
    }

    const methodFlag = method === 'merge' ? '--merge' : method === 'rebase' ? '--rebase' : '--squash';
    const args = ['pr', 'merge', String(number), methodFlag];
    if (deleteBranch) args.push('--delete-branch');

    const res = runner.exec('gh', args, 60_000);
    if (!res.ok) {
      wsClient.send('pr:merge:result', {
        requestId,
        merged: false,
        number,
        error: `gh pr merge failed: ${res.out}`,
      });
      return;
    }

    logger.info({ number, method }, 'Pull request merged');
    wsClient.send('pr:merge:result', { requestId, merged: true, number, sandboxed: runner.sandboxed });
  }

  return {
    'git:status': handleStatus,
    'pr:list': handlePrList,
    'pr:merge': handlePrMerge,
  };
}
