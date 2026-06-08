/**
 * Claude Code transcript reading + live tailing.
 *
 * Claude Code persists every session as JSONL at
 *   ~/.claude/projects/<slug>/<session-uuid>.jsonl
 * appending one JSON object per event (user, assistant, tool_result, …).
 * It opens/appends/closes per write — it does NOT hold the fd open — so the
 * file is safe to read concurrently and tail via inotify (fs.watch).
 *
 * Everything emitted from here is already redacted (see redactor.ts).
 */

import fs from 'fs';
import { promises as fsp } from 'fs';
import { EventEmitter } from 'events';
import { redactText } from './redactor.js';
import type { Logger } from '../utils/logger.js';
import type { TranscriptEvent } from '../types/index.js';

/** Max raw bytes to scan when extracting a cheap tail preview. */
const PREVIEW_TAIL_BYTES = 64 * 1024;
/** Hard cap on a single redacted text field shipped to the server. */
const MAX_TEXT_CHARS = 20_000;

interface RawEntry {
  type?: string;
  timestamp?: string;
  cwd?: string;
  gitBranch?: string;
  message?: { role?: string; content?: unknown };
  [key: string]: unknown;
}

/** Roles we surface to the dashboard; anything else maps to 'system'. */
function normalizeRole(entry: RawEntry): TranscriptEvent['role'] {
  const role = entry.message?.role ?? entry.type;
  if (role === 'user' || role === 'assistant' || role === 'tool') return role;
  if (role === 'tool_result') return 'tool';
  return 'system';
}

/**
 * Flatten a Claude message `content` (string OR array of typed blocks) into
 * a single display string. Thinking blocks are summarized, tool calls labelled.
 */
function extractText(content: unknown): string {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const b = block as Record<string, unknown>;
      switch (b.type) {
        case 'text':
          if (typeof b.text === 'string') parts.push(b.text);
          break;
        case 'thinking':
          parts.push('[thinking]');
          break;
        case 'tool_use':
          parts.push(`[tool: ${typeof b.name === 'string' ? b.name : 'unknown'}]`);
          break;
        case 'tool_result': {
          const c = b.content;
          parts.push(typeof c === 'string' ? c : '[tool_result]');
          break;
        }
        default:
          break;
      }
    }
    return parts.join('\n');
  }

  return '';
}

/**
 * Parse a single JSONL line into a redacted TranscriptEvent.
 * Returns null for blank lines or unparseable JSON (resilient to partial tails).
 */
export function parseTranscriptLine(line: string, seq: number): TranscriptEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let entry: RawEntry;
  try {
    entry = JSON.parse(trimmed) as RawEntry;
  } catch {
    return null;
  }

  const sessionId = typeof entry.sessionId === 'string' ? entry.sessionId : '';
  const rawText = entry.message ? extractText(entry.message.content) : '';
  const text = rawText
    ? redactText(rawText).slice(0, MAX_TEXT_CHARS)
    : undefined;

  return {
    sessionId,
    seq,
    type: typeof entry.type === 'string' ? entry.type : 'unknown',
    role: normalizeRole(entry),
    text,
    timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : undefined,
  };
}

/** Read the project working directory recorded inside the transcript (reliable). */
export async function readCwdFromTranscript(transcriptPath: string): Promise<string | null> {
  try {
    const fh = await fsp.open(transcriptPath, 'r');
    try {
      const buf = Buffer.alloc(8192);
      const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
      const head = buf.toString('utf-8', 0, bytesRead);
      const match = head.match(/"cwd"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (!match) return null;
      return JSON.parse(`"${match[1]}"`) as string;
    } finally {
      await fh.close();
    }
  } catch {
    return null;
  }
}

/**
 * Cheap, redacted preview of the most recent meaningful text in a transcript.
 * Reads only the trailing PREVIEW_TAIL_BYTES regardless of file size.
 */
export async function readTailPreview(transcriptPath: string): Promise<string | null> {
  try {
    const stat = await fsp.stat(transcriptPath);
    const start = Math.max(0, stat.size - PREVIEW_TAIL_BYTES);
    const fh = await fsp.open(transcriptPath, 'r');
    try {
      const len = stat.size - start;
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, start);
      const lines = buf.toString('utf-8').split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const evt = parseTranscriptLine(lines[i], i);
        if (evt?.text && (evt.role === 'user' || evt.role === 'assistant')) {
          return evt.text.replace(/\s+/g, ' ').slice(0, 200);
        }
      }
      return null;
    } finally {
      await fh.close();
    }
  } catch {
    return null;
  }
}

/** Read the last `limit` redacted events from a transcript (for initial open). */
export async function readHistory(transcriptPath: string, limit = 500): Promise<TranscriptEvent[]> {
  let content: string;
  try {
    content = await fsp.readFile(transcriptPath, 'utf-8');
  } catch {
    return [];
  }
  const lines = content.split('\n');
  const events: TranscriptEvent[] = [];
  for (let i = 0; i < lines.length; i++) {
    const evt = parseTranscriptLine(lines[i], i);
    if (evt) events.push(evt);
  }
  return events.length > limit ? events.slice(events.length - limit) : events;
}

/**
 * Incrementally tail one transcript: on every append, parse the new lines and
 * emit them (redacted) as a `batch` of TranscriptEvent. Partial trailing lines
 * are buffered until their newline arrives.
 */
export class TranscriptTailer extends EventEmitter {
  private watcher: fs.FSWatcher | null = null;
  private offset = 0;
  private seq = 0;
  private partial = '';
  private reading = false;
  private pending = false;
  private readonly logger: Logger;

  constructor(
    public readonly sessionId: string,
    public readonly transcriptPath: string,
    logger: Logger,
  ) {
    super();
    this.logger = logger.child({ component: 'TranscriptTailer', sessionId });
  }

  /** Start watching from the current end of file (history is sent separately). */
  start(): void {
    try {
      this.offset = fs.statSync(this.transcriptPath).size;
      // Seed seq with an estimate so live events sort after history.
      this.seq = Math.floor(this.offset / 256);
    } catch {
      this.offset = 0;
    }

    try {
      this.watcher = fs.watch(this.transcriptPath, () => this.scheduleRead());
      this.logger.debug({ offset: this.offset }, 'Tailing transcript');
    } catch (error) {
      this.logger.warn({ err: error }, 'fs.watch failed; falling back to polling');
      this.watcher = null;
      const timer = setInterval(() => this.scheduleRead(), 1500);
      this.once('stop', () => clearInterval(timer));
    }
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
    this.emit('stop');
    this.removeAllListeners();
  }

  private scheduleRead(): void {
    if (this.reading) {
      this.pending = true;
      return;
    }
    void this.readDelta();
  }

  private async readDelta(): Promise<void> {
    this.reading = true;
    try {
      const stat = await fsp.stat(this.transcriptPath);
      if (stat.size < this.offset) {
        // File was truncated/rotated — restart from the beginning.
        this.offset = 0;
        this.partial = '';
      }
      if (stat.size === this.offset) return;

      const len = stat.size - this.offset;
      const fh = await fsp.open(this.transcriptPath, 'r');
      let chunk: string;
      try {
        const buf = Buffer.alloc(len);
        await fh.read(buf, 0, len, this.offset);
        chunk = buf.toString('utf-8');
      } finally {
        await fh.close();
      }
      this.offset = stat.size;

      const data = this.partial + chunk;
      const lines = data.split('\n');
      this.partial = lines.pop() ?? '';

      const events: TranscriptEvent[] = [];
      for (const line of lines) {
        const evt = parseTranscriptLine(line, this.seq++);
        if (evt) events.push(evt);
      }
      if (events.length > 0) {
        this.emit('batch', events);
      }
    } catch (error) {
      this.logger.warn({ err: error }, 'Failed to read transcript delta');
    } finally {
      this.reading = false;
      if (this.pending) {
        this.pending = false;
        this.scheduleRead();
      }
    }
  }
}
