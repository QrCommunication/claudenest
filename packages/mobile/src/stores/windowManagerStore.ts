/**
 * Window Manager store (Zustand) — the brain of the "Claude OS" tablet shell.
 *
 * Pure, NON-persisted client-only UI state: open windows, their geometry and
 * focus order, and virtual workspaces. Every mutation is immutable and uses a
 * monotonic `seq` counter (never Date.now()/Math.random()), so the reducers are
 * deterministic and unit-testable. Geometry math lives in utils/windowGeometry.
 */

import { create } from "zustand";
import {
  type DesktopRect,
  type SnapZone,
  type WindowBounds,
  boundsForZone,
  cascadeBounds,
  clampToDesktop,
  defaultBoundsFor,
  tileGrid,
} from "@/utils/windowGeometry";

export type WindowAccent = "purple" | "cyan";

/** A window's lifecycle/layout state. The exact tile zone is captured in bounds. */
export type WindowState = "normal" | "minimized" | "maximized" | "tiled";

export interface ManagedWindow {
  id: string;
  appId: string;
  /** Identifies a specific instance (e.g. sessionId, projectId). */
  instanceKey?: string;
  title: string;
  icon: string;
  accent: WindowAccent;
  workspaceId: string;
  bounds: WindowBounds;
  /** Saved bounds to restore after maximize/tile. */
  prevBounds?: WindowBounds;
  state: WindowState;
  /** Focus order (MRU): higher = on top / most recently focused. */
  zIndex: number;
  /** Stable open order: the taskbar/window-list sorts by this, not by focus. */
  openSeq: number;
  params?: Record<string, unknown>;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface OpenAppInput {
  appId: string;
  instanceKey?: string;
  title: string;
  icon: string;
  accent?: WindowAccent;
  /** When true, re-opening focuses the single existing window instead of duplicating. */
  singleInstance?: boolean;
  /** Requested opening size (defaults to a comfortable medium window). */
  size?: { w: number; h: number };
  params?: Record<string, unknown>;
}

type WindowPatch = Partial<
  Pick<ManagedWindow, "title" | "icon" | "accent" | "params">
>;

interface WindowManagerState {
  windows: Record<string, ManagedWindow>;
  workspaces: Record<string, Workspace>;
  workspaceOrder: string[];
  activeWorkspaceId: string;
  focusedId: string | null;
  desktop: DesktopRect;
  seq: number;

  openApp: (input: OpenAppInput) => string;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, bounds: WindowBounds) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  snapWindow: (id: string, zone: SnapZone) => void;
  tileAll: () => void;
  cascadeAll: () => void;
  closeWindow: (id: string) => void;
  updateWindow: (id: string, patch: WindowPatch) => void;
  setDesktopSize: (size: DesktopRect) => void;
  createWorkspace: (name?: string) => string;
  switchWorkspace: (id: string) => void;
  moveWindowToWorkspace: (id: string, workspaceId: string) => void;
  closeWorkspace: (id: string) => void;
  reset: () => void;
}

const DEFAULT_WORKSPACE_ID = "ws-1";
const DEFAULT_SIZE = { w: 720, h: 520 };

type WindowManagerData = Pick<
  WindowManagerState,
  | "windows"
  | "workspaces"
  | "workspaceOrder"
  | "activeWorkspaceId"
  | "focusedId"
  | "desktop"
  | "seq"
>;

function createInitialData(): WindowManagerData {
  return {
    windows: {},
    workspaces: {
      [DEFAULT_WORKSPACE_ID]: { id: DEFAULT_WORKSPACE_ID, name: "Desk 1" },
    },
    workspaceOrder: [DEFAULT_WORKSPACE_ID],
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    focusedId: null,
    desktop: { w: 1280, h: 800 },
    seq: 0,
  };
}

/** The next window to focus in a workspace: highest zIndex, not minimized. */
function pickNextFocus(
  windows: Record<string, ManagedWindow>,
  workspaceId: string,
): string | null {
  let best: ManagedWindow | null = null;
  for (const w of Object.values(windows)) {
    if (w.workspaceId !== workspaceId) continue;
    if (w.state === "minimized") continue;
    if (!best || w.zIndex > best.zIndex) best = w;
  }
  return best ? best.id : null;
}

/**
 * Pure selector: windows of a workspace in stable open order (by openSeq).
 * Used by the taskbar/window-list so it doesn't reorder on focus changes.
 */
export function selectOrderedWindows(
  state: Pick<WindowManagerState, "windows" | "activeWorkspaceId">,
  workspaceId?: string,
): ManagedWindow[] {
  const wsId = workspaceId ?? state.activeWorkspaceId;
  return Object.values(state.windows)
    .filter((w) => w.workspaceId === wsId)
    .sort((a, b) => a.openSeq - b.openSeq);
}

export const useWindowManagerStore = create<WindowManagerState>((set) => ({
  ...createInitialData(),

  openApp: (input) => {
    let resultId = "";
    set((state) => {
      const seq = state.seq + 1;

      if (input.singleInstance) {
        const existing = Object.values(state.windows).find(
          (w) => w.appId === input.appId,
        );
        if (existing) {
          resultId = existing.id;
          return {
            seq,
            activeWorkspaceId: existing.workspaceId,
            focusedId: existing.id,
            windows: {
              ...state.windows,
              [existing.id]: {
                ...existing,
                state:
                  existing.state === "minimized" ? "normal" : existing.state,
                zIndex: seq,
              },
            },
          };
        }
      }

      const id = input.instanceKey
        ? `${input.appId}:${input.instanceKey}`
        : `${input.appId}#${seq}`;

      const existing = state.windows[id];
      if (existing) {
        resultId = id;
        return {
          seq,
          activeWorkspaceId: existing.workspaceId,
          focusedId: id,
          windows: {
            ...state.windows,
            [id]: {
              ...existing,
              state: existing.state === "minimized" ? "normal" : existing.state,
              zIndex: seq,
            },
          },
        };
      }

      resultId = id;
      const count = Object.keys(state.windows).length;
      const bounds = defaultBoundsFor(
        input.size ?? DEFAULT_SIZE,
        state.desktop,
        count,
      );
      const win: ManagedWindow = {
        id,
        appId: input.appId,
        instanceKey: input.instanceKey,
        title: input.title,
        icon: input.icon,
        accent: input.accent ?? "purple",
        workspaceId: state.activeWorkspaceId,
        bounds,
        state: "normal",
        zIndex: seq,
        openSeq: seq,
        params: input.params,
      };
      return { seq, focusedId: id, windows: { ...state.windows, [id]: win } };
    });
    return resultId;
  },

  focusWindow: (id) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const seq = state.seq + 1;
      return {
        seq,
        focusedId: id,
        windows: {
          ...state.windows,
          [id]: {
            ...w,
            state: w.state === "minimized" ? "normal" : w.state,
            zIndex: seq,
          },
        },
      };
    }),

  moveWindow: (id, x, y) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const size =
        w.state === "maximized" && w.prevBounds ? w.prevBounds : w.bounds;
      const bounds = clampToDesktop(
        { x, y, w: size.w, h: size.h },
        state.desktop,
      );
      return {
        windows: {
          ...state.windows,
          [id]: { ...w, bounds, state: "normal", prevBounds: undefined },
        },
      };
    }),

  resizeWindow: (id, bounds) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      return {
        windows: {
          ...state.windows,
          [id]: {
            ...w,
            bounds: clampToDesktop(bounds, state.desktop),
            state: "normal",
            prevBounds: undefined,
          },
        },
      };
    }),

  minimizeWindow: (id) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const windows = {
        ...state.windows,
        [id]: { ...w, state: "minimized" as const },
      };
      const focusedId =
        state.focusedId === id
          ? pickNextFocus(windows, state.activeWorkspaceId)
          : state.focusedId;
      return { windows, focusedId };
    }),

  restoreWindow: (id) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const seq = state.seq + 1;
      return {
        seq,
        focusedId: id,
        activeWorkspaceId: w.workspaceId,
        windows: {
          ...state.windows,
          [id]: {
            ...w,
            state: w.state === "minimized" ? "normal" : w.state,
            zIndex: seq,
          },
        },
      };
    }),

  toggleMaximize: (id) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const seq = state.seq + 1;
      if (w.state === "maximized") {
        const bounds = w.prevBounds
          ? clampToDesktop(w.prevBounds, state.desktop)
          : w.bounds;
        return {
          seq,
          focusedId: id,
          windows: {
            ...state.windows,
            [id]: {
              ...w,
              bounds,
              state: "normal",
              prevBounds: undefined,
              zIndex: seq,
            },
          },
        };
      }
      return {
        seq,
        focusedId: id,
        windows: {
          ...state.windows,
          [id]: {
            ...w,
            prevBounds: w.bounds,
            bounds: { x: 0, y: 0, w: state.desktop.w, h: state.desktop.h },
            state: "maximized",
            zIndex: seq,
          },
        },
      };
    }),

  snapWindow: (id, zone) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      const seq = state.seq + 1;
      const prevBounds = w.state === "normal" ? w.bounds : w.prevBounds;
      return {
        seq,
        focusedId: id,
        windows: {
          ...state.windows,
          [id]: {
            ...w,
            bounds: boundsForZone(zone, state.desktop),
            state: zone === "maximize" ? "maximized" : "tiled",
            prevBounds,
            zIndex: seq,
          },
        },
      };
    }),

  tileAll: () =>
    set((state) => {
      const visible = selectOrderedWindows(state).filter(
        (w) => w.state !== "minimized",
      );
      const grid = tileGrid(visible.length, state.desktop);
      const windows = { ...state.windows };
      visible.forEach((w, i) => {
        windows[w.id] = {
          ...w,
          bounds: grid[i] ?? w.bounds,
          state: "tiled",
          prevBounds: w.state === "normal" ? w.bounds : w.prevBounds,
        };
      });
      return { windows };
    }),

  cascadeAll: () =>
    set((state) => {
      const visible = selectOrderedWindows(state).filter(
        (w) => w.state !== "minimized",
      );
      const windows = { ...state.windows };
      visible.forEach((w, i) => {
        windows[w.id] = {
          ...w,
          bounds: cascadeBounds(i, state.desktop),
          state: "normal",
          prevBounds: undefined,
        };
      });
      return { windows };
    }),

  closeWindow: (id) =>
    set((state) => {
      if (!state.windows[id]) return state;
      const windows = { ...state.windows };
      delete windows[id];
      const focusedId =
        state.focusedId === id
          ? pickNextFocus(windows, state.activeWorkspaceId)
          : state.focusedId;
      return { windows, focusedId };
    }),

  updateWindow: (id, patch) =>
    set((state) => {
      const w = state.windows[id];
      if (!w) return state;
      return { windows: { ...state.windows, [id]: { ...w, ...patch } } };
    }),

  setDesktopSize: (size) =>
    set((state) => {
      const windows: Record<string, ManagedWindow> = {};
      for (const [id, w] of Object.entries(state.windows)) {
        windows[id] =
          w.state === "maximized"
            ? { ...w, bounds: { x: 0, y: 0, w: size.w, h: size.h } }
            : { ...w, bounds: clampToDesktop(w.bounds, size) };
      }
      return { desktop: size, windows };
    }),

  createWorkspace: (name) => {
    let id = "";
    set((state) => {
      const seq = state.seq + 1;
      id = `ws#${seq}`;
      const ws: Workspace = {
        id,
        name: name ?? `Desk ${state.workspaceOrder.length + 1}`,
      };
      return {
        seq,
        workspaces: { ...state.workspaces, [id]: ws },
        workspaceOrder: [...state.workspaceOrder, id],
      };
    });
    return id;
  },

  switchWorkspace: (id) =>
    set((state) => {
      if (!state.workspaces[id]) return state;
      return {
        activeWorkspaceId: id,
        focusedId: pickNextFocus(state.windows, id),
      };
    }),

  moveWindowToWorkspace: (id, workspaceId) =>
    set((state) => {
      const w = state.windows[id];
      if (!w || !state.workspaces[workspaceId]) return state;
      const windows = { ...state.windows, [id]: { ...w, workspaceId } };
      const focusedId =
        state.focusedId === id
          ? pickNextFocus(windows, state.activeWorkspaceId)
          : state.focusedId;
      return { windows, focusedId };
    }),

  closeWorkspace: (id) =>
    set((state) => {
      if (state.workspaceOrder.length <= 1 || !state.workspaces[id]) {
        return state;
      }
      const workspaces = { ...state.workspaces };
      delete workspaces[id];
      const workspaceOrder = state.workspaceOrder.filter((w) => w !== id);
      const windows: Record<string, ManagedWindow> = {};
      for (const [wid, w] of Object.entries(state.windows)) {
        if (w.workspaceId !== id) windows[wid] = w;
      }
      const activeWorkspaceId =
        state.activeWorkspaceId === id
          ? workspaceOrder[0]
          : state.activeWorkspaceId;
      return {
        workspaces,
        workspaceOrder,
        windows,
        activeWorkspaceId,
        focusedId: pickNextFocus(windows, activeWorkspaceId),
      };
    }),

  reset: () => set(createInitialData()),
}));
