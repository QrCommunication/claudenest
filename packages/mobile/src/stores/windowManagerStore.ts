/**
 * Window Manager Store — Zustand
 *
 * Tracks the state of "windows" in the Claude OS shell: which windowed entities
 * (sessions, panels) are open, which one is focused (foreground), and which are
 * minimized to the taskbar/dock. Decoupled from React Navigation so the Dock
 * and WindowFrame chrome can render focus/minimize state without prop-drilling.
 *
 * Ordering uses monotonic sequence numbers (NOT timestamps) for deterministic,
 * test-friendly behaviour:
 *  - openSeq  → stable dock order (icons keep their slot when focus changes)
 *  - focusSeq → MRU order, drives the next-focus pick on minimize/close
 *
 * This store owns STATE only — wiring it to live sessions and the Dock/
 * WindowFrame UI are separate tasks.
 */

import { create } from "zustand";
import type { ManagedWindow, OpenWindowInput, WindowBounds } from "@/types";
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from "@/utils/windowGeometry";

/** Default floating size for a freshly opened window (logical pixels). */
const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 360;
/** Top-left anchor of the cascade and the per-window stagger step. */
const CASCADE_ORIGIN = 24;
const CASCADE_STEP = 28;
/** How many windows the cascade staggers before wrapping back to the origin. */
const CASCADE_SPAN = 6;
/**
 * Lower bounds enforced by resizeWindow so a window can't collapse to nothing.
 * Single source of truth lives in `windowGeometry` so the gesture math and the
 * store clamp agree.
 */
const MIN_WIDTH = MIN_WINDOW_WIDTH;
const MIN_HEIGHT = MIN_WINDOW_HEIGHT;

interface WindowManagerState {
  /** Open windows keyed by their entity id. */
  windows: Record<string, ManagedWindow>;
  /** Id of the foreground (focused) window, or null when none is focused. */
  focusedId: string | null;
  /** Internal monotonic counter feeding openSeq/focusSeq. */
  seq: number;

  /** Register a window (creating it if absent) and bring it to the foreground. */
  openWindow: (input: OpenWindowInput) => void;
  /** Remove a window; refocuses the next MRU window if it was focused. */
  closeWindow: (id: string) => void;
  /** Bring an existing window to the foreground (no-op if unknown). */
  focusWindow: (id: string) => void;
  /** Send a window to the taskbar; refocuses the next MRU window if it was focused. */
  minimizeWindow: (id: string) => void;
  /** Un-minimize a window and bring it to the foreground (alias of focus). */
  restoreWindow: (id: string) => void;
  /** Mark a window full-bleed and bring it to the foreground (no-op if unknown). */
  maximizeWindow: (id: string) => void;
  /** Toggle a window's maximized flag and focus it (no-op if unknown). */
  toggleMaximize: (id: string) => void;
  /** Move a floating window's top-left corner; un-maximizes it first. */
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  /** Resize a floating window (clamped to MIN_WIDTH/MIN_HEIGHT); un-maximizes it first. */
  resizeWindow: (id: string, size: { width: number; height: number }) => void;
  /** Patch a window's display fields (title/icon) in place. */
  updateWindow: (
    id: string,
    patch: Partial<Pick<ManagedWindow, "title" | "icon">>,
  ) => void;
  /** Clear all window state (e.g. on sign-out). */
  reset: () => void;
}

/**
 * Default cascade geometry for a new window, staggered by its open order so
 * stacked windows don't sit pixel-perfect on top of each other. Uses the
 * monotonic seq (NOT a timestamp) to stay deterministic for tests.
 */
function cascadeBounds(seq: number): WindowBounds {
  const offset = CASCADE_ORIGIN + (seq % CASCADE_SPAN) * CASCADE_STEP;
  return { x: offset, y: offset, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

/**
 * Pick the foreground window after the current one leaves focus (minimize or
 * close): the non-minimized window with the highest focusSeq, excluding
 * `excludeId`. Returns null when nothing focusable is left.
 */
function pickNextFocus(
  windows: Record<string, ManagedWindow>,
  excludeId: string,
): string | null {
  let best: ManagedWindow | null = null;
  for (const win of Object.values(windows)) {
    if (win.id === excludeId || win.minimized) continue;
    if (!best || win.focusSeq > best.focusSeq) best = win;
  }
  return best ? best.id : null;
}

export const useWindowManagerStore = create<WindowManagerState>((set, get) => ({
  windows: {},
  focusedId: null,
  seq: 0,

  openWindow: (input) =>
    set((state) => {
      const existing = state.windows[input.id];
      const seq = state.seq;
      const win: ManagedWindow = existing
        ? { ...existing, minimized: false, focusSeq: seq }
        : {
            id: input.id,
            kind: input.kind,
            title: input.title,
            icon: input.icon,
            minimized: false,
            maximized: false,
            bounds: { ...cascadeBounds(seq), ...input.bounds },
            openSeq: seq,
            focusSeq: seq,
          };

      return {
        windows: { ...state.windows, [input.id]: win },
        focusedId: input.id,
        seq: seq + 1,
      };
    }),

  focusWindow: (id) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      const seq = state.seq;
      return {
        windows: {
          ...state.windows,
          [id]: { ...existing, minimized: false, focusSeq: seq },
        },
        focusedId: id,
        seq: seq + 1,
      };
    }),

  // Restoring a minimized window is exactly "unminimize + focus".
  restoreWindow: (id) => get().focusWindow(id),

  maximizeWindow: (id) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      const seq = state.seq;
      return {
        windows: {
          ...state.windows,
          [id]: {
            ...existing,
            minimized: false,
            maximized: true,
            focusSeq: seq,
          },
        },
        focusedId: id,
        seq: seq + 1,
      };
    }),

  toggleMaximize: (id) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      const seq = state.seq;
      return {
        windows: {
          ...state.windows,
          [id]: {
            ...existing,
            minimized: false,
            maximized: !existing.maximized,
            focusSeq: seq,
          },
        },
        focusedId: id,
        seq: seq + 1,
      };
    }),

  moveWindow: (id, position) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      return {
        windows: {
          ...state.windows,
          [id]: {
            ...existing,
            // Dragging a maximized window pops it back to floating geometry.
            maximized: false,
            bounds: { ...existing.bounds, x: position.x, y: position.y },
          },
        },
      };
    }),

  resizeWindow: (id, size) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      return {
        windows: {
          ...state.windows,
          [id]: {
            ...existing,
            maximized: false,
            bounds: {
              ...existing.bounds,
              width: Math.max(MIN_WIDTH, size.width),
              height: Math.max(MIN_HEIGHT, size.height),
            },
          },
        },
      };
    }),

  minimizeWindow: (id) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing || existing.minimized) return state;

      const windows = {
        ...state.windows,
        [id]: { ...existing, minimized: true },
      };
      const focusedId =
        state.focusedId === id ? pickNextFocus(windows, id) : state.focusedId;

      return { windows, focusedId };
    }),

  closeWindow: (id) =>
    set((state) => {
      if (!(id in state.windows)) return state;

      const windows = { ...state.windows };
      delete windows[id];
      const focusedId =
        state.focusedId === id ? pickNextFocus(windows, id) : state.focusedId;

      return { windows, focusedId };
    }),

  updateWindow: (id, patch) =>
    set((state) => {
      const existing = state.windows[id];
      if (!existing) return state;

      return {
        windows: { ...state.windows, [id]: { ...existing, ...patch } },
      };
    }),

  reset: () => set({ windows: {}, focusedId: null, seq: 0 }),
}));

/**
 * Windows in stable dock/taskbar order (by creation), independent of focus.
 * Pure selector — use as `useWindowManagerStore(selectOrderedWindows)`.
 */
export function selectOrderedWindows(
  state: WindowManagerState,
): ManagedWindow[] {
  return Object.values(state.windows).sort((a, b) => a.openSeq - b.openSeq);
}

/** What tapping a window's taskbar tile should do. */
export type TaskbarTapAction = "restore" | "minimize" | "focus";

/**
 * macOS-like behaviour for tapping a window's taskbar tile:
 *  - minimized        → "restore" (un-minimize and raise it)
 *  - already focused  → "minimize" (toggle the active window down to the bar)
 *  - otherwise        → "focus" (raise an open, non-focused window)
 *
 * Pure so the taskbar UI and tests agree on the mapping; the component routes
 * the result to restoreWindow/minimizeWindow/focusWindow.
 */
export function resolveTaskbarTap(
  win: ManagedWindow,
  focusedId: string | null,
): TaskbarTapAction {
  if (win.minimized) return "restore";
  if (win.id === focusedId) return "minimize";
  return "focus";
}
