/**
 * Tests for the Claude Code transcript token-usage parser.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { parseTokenUsage } from '../token-usage.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'token-usage-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

/** Write a JSONL transcript file from an array of entries. */
function writeTranscript(entries: unknown[]): string {
  const path = join(tmpDir, 'transcript.jsonl');
  writeFileSync(path, entries.map((e) => JSON.stringify(e)).join('\n'), 'utf8');
  return path;
}

describe('parseTokenUsage', () => {
  it('sums per-request usage across assistant entries', () => {
    const path = writeTranscript([
      { type: 'user', message: { content: 'hi' } },
      { message: { usage: { input_tokens: 100, output_tokens: 20 } } },
      { message: { usage: { input_tokens: 50, output_tokens: 10 } } },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 150,
      outputTokens: 30,
      totalTokens: 180,
    });
  });

  it('folds cache tokens into the input total', () => {
    const path = writeTranscript([
      {
        message: {
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            cache_creation_input_tokens: 200,
            cache_read_input_tokens: 1000,
          },
        },
      },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 1210, // 10 + 200 + 1000
      outputTokens: 5,
      totalTokens: 1215,
    });
  });

  it('skips lines without a usage object', () => {
    const path = writeTranscript([
      { message: { content: 'no usage here' } },
      { foo: 'bar' },
      { message: { usage: { input_tokens: 7, output_tokens: 3 } } },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 7,
      outputTokens: 3,
      totalTokens: 10,
    });
  });

  it('is resilient to a partial trailing JSON line', () => {
    const path = join(tmpDir, 'partial.jsonl');
    writeFileSync(
      path,
      JSON.stringify({ message: { usage: { input_tokens: 40, output_tokens: 8 } } }) +
        '\n{"message":{"usage":{"input_tokens":1', // truncated live-append
      'utf8',
    );

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 40,
      outputTokens: 8,
      totalTokens: 48,
    });
  });

  it('coerces invalid/negative values to zero', () => {
    const path = writeTranscript([
      {
        message: {
          usage: {
            input_tokens: -5,
            output_tokens: 'oops',
            cache_read_input_tokens: 3.9,
          },
        },
      },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 3, // floor(3.9); -5 and missing → 0
      outputTokens: 0,
      totalTokens: 3,
    });
  });

  it('treats an empty usage object as "seen" and returns zeros, not null', () => {
    // An empty `usage: {}` is a real (truthy) object → it counts as usage data,
    // so the parser reports a zeroed total rather than null. This is the
    // null-vs-zeros boundary the fail-open caller relies on.
    const path = writeTranscript([{ message: { usage: {} } }]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
  });

  it('skips entries whose usage is a non-object primitive', () => {
    const path = writeTranscript([
      { message: { usage: 42 } },
      { message: { usage: 'nope' } },
      { message: { usage: true } },
      { message: { usage: { input_tokens: 9, output_tokens: 1 } } },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 9,
      outputTokens: 1,
      totalTokens: 10,
    });
  });

  it('skips entries whose usage is null', () => {
    const path = writeTranscript([
      { message: { usage: null } },
      { message: { usage: { input_tokens: 4, output_tokens: 2 } } },
    ]);

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 4,
      outputTokens: 2,
      totalTokens: 6,
    });
  });

  it('ignores blank and whitespace-only lines', () => {
    const path = join(tmpDir, 'blanks.jsonl');
    writeFileSync(
      path,
      [
        '',
        '   ',
        JSON.stringify({ message: { usage: { input_tokens: 12, output_tokens: 4 } } }),
        '\t',
        '',
      ].join('\n'),
      'utf8',
    );

    expect(parseTokenUsage(path)).toEqual({
      inputTokens: 12,
      outputTokens: 4,
      totalTokens: 16,
    });
  });

  it('returns null for an empty file', () => {
    const path = join(tmpDir, 'empty.jsonl');
    writeFileSync(path, '', 'utf8');

    expect(parseTokenUsage(path)).toBeNull();
  });

  it('returns null when the file has no usage data at all', () => {
    const path = writeTranscript([
      { type: 'user', message: { content: 'hi' } },
      { type: 'system', message: { content: 'init' } },
    ]);

    expect(parseTokenUsage(path)).toBeNull();
  });

  it('returns null when the file is unreadable', () => {
    expect(parseTokenUsage(join(tmpDir, 'does-not-exist.jsonl'))).toBeNull();
  });
});
