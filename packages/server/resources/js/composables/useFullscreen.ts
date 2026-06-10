import { ref, readonly } from 'vue';

/**
 * Shared immersive/fullscreen mode.
 *
 * Two cooperating layers:
 * - Browser Fullscreen API (hides the browser chrome) — best effort: some
 *   contexts (iframes, denied permission) reject the request.
 * - App "zen" layout (AppLayout hides the sidebar, breadcrumb and status bar
 *   but KEEPS the tab bar with the session tabs and the "+" button) — always
 *   applied, so the toggle has a visible effect even when the Fullscreen API
 *   is unavailable.
 *
 * State is module-level so every consumer (layout, terminal header, future
 * shortcuts) shares the same toggle.
 */
const isFullscreen = ref(false);

// Single module-level listener: Esc or browser UI can exit fullscreen
// without going through our toggle — the app chrome must come back too.
if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      isFullscreen.value = false;
    }
  });
}

async function enter(): Promise<void> {
  isFullscreen.value = true;
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {
    // Fullscreen API denied — the zen layout alone still applies.
  }
}

async function exit(): Promise<void> {
  isFullscreen.value = false;
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      // Already out — nothing to do.
    }
  }
}

function toggle(): void {
  if (isFullscreen.value) {
    void exit();
  } else {
    void enter();
  }
}

export function useFullscreen() {
  return {
    isFullscreen: readonly(isFullscreen),
    enter,
    exit,
    toggle,
  };
}
