import { ref, readonly } from 'vue';

/**
 * Detects when a new SPA build has been deployed while this tab stays open.
 *
 * Strategy: at boot we capture the hashed filename of the running `app-*.js`
 * entry from the DOM (injected by Laravel's @vite directive). We then poll
 * `/build/manifest.json` and compare the `resources/js/app.ts` entry file
 * against the captured one. A mismatch means a new build was deployed.
 *
 * - NO-OP on the Vite dev server (no `/build/assets/app-*` script in the DOM).
 * - Fail-silent on every error (network, 404, parse): retry at next tick.
 * - Singleton: module-level state, polling starts once for the whole app
 *   lifetime regardless of how many components call the composable.
 */

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const FOCUS_THROTTLE_MS = 60 * 1000; // 1 min between visibility-driven checks
const MANIFEST_URL = '/build/manifest.json';
/** Exact entry key in Vite's manifest (verified against the built manifest). */
const MANIFEST_ENTRY_KEY = 'resources/js/app.ts';

// ==================== SINGLETON STATE ====================
const newVersionAvailable = ref(false);
const dismissed = ref(false);

let started = false;
let initialFile: string | null = null;
let pollTimer: number | null = null;
let lastCheckAt = 0;
let checking = false;

// ==================== INTERNALS ====================

/**
 * Extract the hashed entry filename (e.g. `assets/app-B3-5mFDZ.js`) from the
 * `<script>` tag injected by @vite. Returns null on the dev server.
 */
function captureInitialFile(): string | null {
  const script = document.querySelector<HTMLScriptElement>(
    'script[src*="/build/assets/app-"]'
  );
  if (!script || !script.src) {
    return null;
  }
  const match = script.src.match(/\/build\/(assets\/app-[^/?#]+\.js)/);
  return match?.[1] ?? null;
}

/**
 * Safely extract `manifest['resources/js/app.ts'].file` from untrusted JSON.
 */
function extractEntryFile(manifest: unknown): string | null {
  if (typeof manifest !== 'object' || manifest === null) {
    return null;
  }
  const entry = (manifest as Record<string, unknown>)[MANIFEST_ENTRY_KEY];
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }
  const file = (entry as Record<string, unknown>)['file'];
  return typeof file === 'string' ? file : null;
}

async function checkForNewVersion(): Promise<void> {
  if (checking || newVersionAvailable.value || initialFile === null) {
    return;
  }
  checking = true;
  lastCheckAt = Date.now();
  try {
    const response = await fetch(`${MANIFEST_URL}?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return; // fail-silent, retry at next tick
    }
    const manifest: unknown = await response.json();
    const currentFile = extractEntryFile(manifest);
    if (currentFile !== null && currentFile !== initialFile) {
      newVersionAvailable.value = true;
      stopPolling();
    }
  } catch {
    // Fail-silent (network down, invalid JSON, ...): retry at next tick.
  } finally {
    checking = false;
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    return;
  }
  if (Date.now() - lastCheckAt < FOCUS_THROTTLE_MS) {
    return;
  }
  void checkForNewVersion();
}

/** Clear the interval and the visibility listener (called once detected). */
function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function start(): void {
  if (started) {
    return;
  }
  started = true;

  initialFile = captureInitialFile();
  if (initialFile === null) {
    return; // Vite dev server: full NO-OP (no timer, no listener)
  }

  pollTimer = window.setInterval(() => {
    void checkForNewVersion();
  }, POLL_INTERVAL_MS);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ==================== PUBLIC API ====================

export function useVersionCheck() {
  // Idempotent: the singleton intentionally lives for the whole page session
  // (its single consumer is mounted at the app root and never unmounts).
  // Timers/listeners are cleaned up by stopPolling() once a new version is
  // detected, and by the browser on page unload.
  start();

  const dismiss = (): void => {
    dismissed.value = true; // definitive for this page session
  };

  return {
    newVersionAvailable: readonly(newVersionAvailable),
    dismissed: readonly(dismissed),
    dismiss,
  };
}
