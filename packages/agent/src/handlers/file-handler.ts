/**
 * File browser message handler
 */

import { readdir, readFile, stat } from 'fs/promises';
import { homedir } from 'os';
import { join, resolve, normalize, relative } from 'path';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../utils/logger.js';
import type { FileBrowseRequest, FileBrowseEntry } from '../types/index.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

export function createFileHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  async function handleFileBrowse(payload: FileBrowseRequest): Promise<void> {
    const { requestId, path: requestedPath, dirsOnly = false, showHidden = false } = payload;

    if (!requestId) {
      logger.warn('file:browse missing requestId');
      return;
    }

    const home = homedir();

    try {
      const targetPath = requestedPath && requestedPath.trim()
        ? resolve(requestedPath)
        : home;

      const normalizedTarget = normalize(targetPath);
      const normalizedHome = normalize(home);
      const rel = relative(normalizedHome, normalizedTarget);

      if (rel.startsWith('..') || resolve(normalizedHome, rel) !== normalizedTarget) {
        wsClient.send('file:browse_result', {
          requestId,
          path: requestedPath || home,
          homePath: home,
          entries: [],
          error: 'Access denied: path is outside home directory',
        });
        return;
      }

      const dirents = await readdir(normalizedTarget, { withFileTypes: true });

      const entries: FileBrowseEntry[] = [];

      for (const dirent of dirents) {
        if (!showHidden && dirent.name.startsWith('.')) continue;
        if (dirsOnly && !dirent.isDirectory()) continue;

        const entry: FileBrowseEntry = {
          name: dirent.name,
          type: dirent.isDirectory() ? 'directory' : 'file',
        };

        try {
          const entryPath = resolve(normalizedTarget, dirent.name);
          const stats = await stat(entryPath);
          entry.size = stats.size;
          entry.modifiedAt = stats.mtime.toISOString();
        } catch {
          // Skip stat errors (permission denied, broken symlinks)
        }

        entries.push(entry);
      }

      entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      wsClient.send('file:browse_result', {
        requestId,
        path: normalizedTarget,
        homePath: home,
        entries,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, path: requestedPath }, 'file:browse failed');

      wsClient.send('file:browse_result', {
        requestId,
        path: requestedPath || home,
        homePath: home,
        entries: [],
        error: message,
      });
    }
  }

  async function handleReadCredentials(payload: { requestId: string }): Promise<void> {
    const { requestId } = payload;
    if (!requestId) {
      logger.warn('file:read_credentials missing requestId');
      return;
    }

    const credPath = join(homedir(), '.claude', '.credentials.json');

    try {
      const content = await readFile(credPath, 'utf-8');
      // Validate it's valid JSON before sending
      JSON.parse(content);

      wsClient.send('file:read_credentials_result', {
        requestId,
        success: true,
        credentialsJson: content,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, path: credPath }, 'file:read_credentials failed');

      wsClient.send('file:read_credentials_result', {
        requestId,
        success: false,
        error: message.includes('ENOENT')
          ? 'Credentials file not found. Run "claude login" first.'
          : message,
      });
    }
  }

  return {
    'file:browse': handleFileBrowse,
    'file:read_credentials': handleReadCredentials,
  };
}
