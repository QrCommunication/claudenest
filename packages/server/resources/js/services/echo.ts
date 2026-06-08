/**
 * Shared Laravel Echo (Reverb) client for private-channel subscriptions.
 *
 * The existing websocket.ts manager is session-terminal specific; this exposes
 * a generic private-channel subscribe/leave for features like the live Claude
 * session transcript mirror.
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as unknown as Record<string, unknown>).Pusher = Pusher;

interface ReverbWindowConfig {
  key: string;
  host: string;
  port: number;
  scheme: string;
}

let echo: Echo<'reverb'> | null = null;

function getEcho(): Echo<'reverb'> {
  if (echo) return echo;

  const reverb = (window as unknown as { ClaudeNest?: { reverb?: ReverbWindowConfig } })
    .ClaudeNest?.reverb;
  if (!reverb) {
    throw new Error('Reverb configuration not found');
  }

  const authToken = localStorage.getItem('auth_token') || '';

  echo = new Echo({
    broadcaster: 'reverb',
    key: reverb.key,
    wsHost: reverb.host,
    wsPort: reverb.port,
    wssPort: reverb.port,
    useTLS: reverb.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    auth: {
      headers: { Authorization: `Bearer ${authToken}` },
    },
  });

  return echo;
}

/**
 * Subscribe to a private channel event. Returns an unsubscribe function that
 * stops listening and leaves the channel.
 */
export function subscribePrivate<T>(
  channel: string,
  event: string,
  handler: (payload: T) => void,
): () => void {
  const e = getEcho();
  e.private(channel).listen(event, handler as (payload: unknown) => void);

  return () => {
    try {
      e.leave(`private-${channel}`);
    } catch {
      // already gone
    }
  };
}
