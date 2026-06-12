/**
 * Deterministic worker color: hash an instance/session id onto the brand
 * palette so every dot/chip referring to the same worker shares one color
 * (pane headers, strip mini-tabs, rail task dots).
 */

const WORKER_PALETTE = [
  '#a855f7', // purple
  '#22d3ee', // cyan
  '#f472b6', // pink
  '#34d399', // emerald
  '#fbbf24', // amber
  '#60a5fa', // blue
] as const;

const FALLBACK_COLOR = '#6b7280';

export function workerColor(id: string | null | undefined): string {
  if (!id) return FALLBACK_COLOR;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }

  return WORKER_PALETTE[Math.abs(hash) % WORKER_PALETTE.length];
}

export function workerShortName(instanceId: string | null | undefined, sessionId: string): string {
  const source = instanceId ?? sessionId;
  const compact = source.replace(/[^a-zA-Z0-9]/g, '');
  return compact.slice(-6).toLowerCase() || sessionId.slice(0, 6);
}
