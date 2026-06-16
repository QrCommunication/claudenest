/**
 * Token usage parser for Claude Code transcripts.
 *
 * Claude Code persists every assistant API response in the session JSONL with a
 * `message.usage` object:
 *   { input_tokens, output_tokens,
 *     cache_creation_input_tokens, cache_read_input_tokens }
 * Each entry's usage is per-request (NOT cumulative), so summing across all
 * assistant entries yields the cumulative token consumption for the session.
 *
 * Cache tokens are folded into the input total — they are input-side prompt
 * reads/writes. The result is an ABSOLUTE cumulative count: the backend
 * `/api/sessions/{id}/token-usage` endpoint is idempotent and overwrites the
 * stored counters with whatever we report.
 *
 * Read synchronously and fail-open: this runs inside a Claude Code Stop hook
 * which must never crash or stall the session.
 */

import { readFileSync } from 'node:fs';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Raw `message.usage` shape (every field optional / untyped — defensive). */
interface RawUsage {
  input_tokens?: unknown;
  output_tokens?: unknown;
  cache_creation_input_tokens?: unknown;
  cache_read_input_tokens?: unknown;
}

/** Coerce an unknown JSON value to a non-negative integer (0 on anything invalid). */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

/**
 * Parse cumulative token usage from a Claude Code transcript JSONL file.
 *
 * @returns the absolute cumulative usage, or null if the file is unreadable or
 *   contains no usage data at all (fail-open — caller skips the report).
 */
export function parseTokenUsage(transcriptPath: string): TokenUsage | null {
  let content: string;
  try {
    content = readFileSync(transcriptPath, 'utf8');
  } catch {
    return null;
  }

  let input = 0;
  let output = 0;
  let sawUsage = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry: { message?: { usage?: RawUsage } };
    try {
      entry = JSON.parse(trimmed) as { message?: { usage?: RawUsage } };
    } catch {
      continue; // resilient to a partial trailing line being appended live
    }

    const usage = entry.message?.usage;
    if (!usage || typeof usage !== 'object') continue;

    sawUsage = true;
    input +=
      toCount(usage.input_tokens) +
      toCount(usage.cache_creation_input_tokens) +
      toCount(usage.cache_read_input_tokens);
    output += toCount(usage.output_tokens);
  }

  if (!sawUsage) return null;
  return { inputTokens: input, outputTokens: output, totalTokens: input + output };
}
