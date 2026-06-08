/**
 * Transcript redactor — strips secrets from Claude session transcripts before
 * they are streamed to the ClaudeNest server.
 *
 * Two layers, mirroring ~/.claude/rules/security.md:
 *   1. KEY-based redaction for structured fields (e.g. {"api_key": "..."}).
 *      A field is redacted because of its KEY semantics, never its value —
 *      this avoids destroying legitimate text like "send the token to Bob".
 *   2. High-confidence VALUE patterns for free-text message content, where
 *      secrets appear inline and are not keyed (sk-ant-…, AKIA…, JWTs, PEM…).
 *      Patterns are deliberately tight to avoid mangling normal prose/code.
 *
 * Redaction is irreversible and stable: identical plaintext → identical token
 * (`[REDACTED:<sha256_8>]`), so log/transcript correlation survives without
 * exposing the cleartext.
 */

import crypto from 'crypto';

/** Exact-match sensitive keys (lowercased). */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'webhook_secret',
  'private_key',
  'authorization',
  'auth',
  'cookie',
  'session_token',
  'anthropic_api_key',
  'claude_code_oauth_token',
  'aws_secret_access_key',
  'aws_access_key_id',
  'cvv',
  'cvc',
  'iban',
  'bic',
  'ssn',
  'siret',
  'vat_number',
]);

/** Compound key matcher (e.g. buyer_email, reset_token, stripe_secret_key). */
const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|client[_-]?secret|webhook[_-]?secret|auth|credential|email|phone)/i;

/**
 * High-confidence cleartext secret patterns for free text.
 * Each entry: [regex, label]. Order matters (most specific first).
 */
const SECRET_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/g, 'anthropic-key'],
  [/sk-[A-Za-z0-9]{20,}/g, 'api-key'],
  [/AKIA[0-9A-Z]{16}/g, 'aws-access-key'],
  [/gh[pousr]_[A-Za-z0-9]{20,}/g, 'github-token'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/g, 'slack-token'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, 'jwt'],
  [/-----BEGIN[A-Z ]+PRIVATE KEY-----[\s\S]*?-----END[A-Z ]+PRIVATE KEY-----/g, 'private-key'],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, 'email'],
  // KEY=secret assignments (env-style), value kept tight to avoid false hits.
  [/\b(?:[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY))\s*=\s*["']?[^\s"']{8,}/g, 'env-secret'],
];

const MAX_DEPTH = 12;

function hash8(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 8);
}

function redactedToken(value: string): string {
  return `[REDACTED:${hash8(value)}]`;
}

/**
 * Redact high-confidence secrets inside a free-text string.
 * Returns the string unchanged when nothing matches (cheap common case).
 */
export function redactText(input: string): string {
  if (!input || input.length < 8) return input;
  let out = input;
  for (const [pattern, label] of SECRET_PATTERNS) {
    out = out.replace(pattern, (match) => `[REDACTED:${label}:${hash8(match)}]`);
  }
  return out;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.has(lower) || SENSITIVE_KEY_PATTERN.test(lower);
}

/**
 * Deep-redact an arbitrary JSON value parsed from a transcript line.
 * - Sensitive KEYS → whole value replaced by a stable [REDACTED:hash] token.
 * - String VALUES → scanned for inline secret patterns.
 * - Depth-capped (anti-DoS on adversarial nesting).
 */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[REDACTED:depth]';

  if (typeof value === 'string') {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key) && val != null && typeof val !== 'object') {
        out[key] = redactedToken(String(val));
      } else {
        out[key] = redactValue(val, depth + 1);
      }
    }
    return out;
  }

  return value;
}
