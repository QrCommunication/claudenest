/**
 * Window manager store — pure-logic unit tests (node env, no RN renderer).
 *
 * Validates the open/focus/minimize/restore/close lifecycle and the two
 * orderings (stable dock order vs MRU next-focus pick). The store is a module
 * singleton, so each test starts from reset().
 */

import {
  useWindowManagerStore,
  selectOrderedWindows,
  resolveTaskbarTap,
} from "./windowManagerStore";
import type { ManagedWindow } from "@/types";

const store = () => useWindowManagerStore.getState();

const session = (id: string, title = id) => ({
  id,
  kind: "session" as const,
  title,
});

beforeEach(() => {
  store().reset();
});

describe("windowManagerStore", () => {
  it("opens a window and focuses it", () => {
    store().openWindow(session("a", "Alpha"));

    expect(store().focusedId).toBe("a");
    expect(store().windows.a).toMatchObject({
      id: "a",
      kind: "session",
      title: "Alpha",
      minimized: false,
    });
  });

  it("re-opening an existing window focuses it without duplicating", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));
    expect(store().focusedId).toBe("b");

    store().openWindow(session("a")); // re-open A
    expect(Object.keys(store().windows)).toHaveLength(2);
    expect(store().focusedId).toBe("a");
    expect(store().windows.a.minimized).toBe(false);
  });

  it("focusWindow is a no-op on an unknown id", () => {
    store().openWindow(session("a"));
    const before = store().windows;

    store().focusWindow("ghost");

    expect(store().focusedId).toBe("a");
    expect(store().windows).toBe(before); // identity preserved (no state change)
  });

  it("minimizing the focused window refocuses the next most-recent one", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));
    store().openWindow(session("c")); // focus = c, focusSeq a<b<c

    store().minimizeWindow("c");

    expect(store().windows.c.minimized).toBe(true);
    // b is the most-recently-focused non-minimized window
    expect(store().focusedId).toBe("b");
  });

  it("minimizing a non-focused window keeps the current focus", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b")); // focus = b

    store().minimizeWindow("a");

    expect(store().windows.a.minimized).toBe(true);
    expect(store().focusedId).toBe("b");
  });

  it("restoreWindow un-minimizes and focuses", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));
    store().minimizeWindow("b");
    expect(store().focusedId).toBe("a");

    store().restoreWindow("b");

    expect(store().windows.b.minimized).toBe(false);
    expect(store().focusedId).toBe("b");
  });

  it("closing the focused window refocuses the next most-recent one", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));
    expect(store().focusedId).toBe("b");

    store().closeWindow("b");

    expect(store().windows.b).toBeUndefined();
    expect(store().focusedId).toBe("a");
  });

  it("closing the last window clears focus", () => {
    store().openWindow(session("a"));
    store().closeWindow("a");

    expect(Object.keys(store().windows)).toHaveLength(0);
    expect(store().focusedId).toBeNull();
  });

  it("opens a window with default floating geometry (not maximized)", () => {
    store().openWindow(session("a"));

    expect(store().windows.a.maximized).toBe(false);
    expect(store().windows.a.bounds).toMatchObject({
      width: 480,
      height: 360,
    });
    // First window sits at the cascade origin.
    expect(store().windows.a.bounds.x).toBe(24);
    expect(store().windows.a.bounds.y).toBe(24);
  });

  it("staggers successive windows so they don't fully overlap", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));

    expect(store().windows.b.bounds.x).toBeGreaterThan(
      store().windows.a.bounds.x,
    );
  });

  it("honours an explicit initial bounds, falling back to defaults per-field", () => {
    store().openWindow({
      ...session("a"),
      bounds: { x: 100, y: 200 },
    });

    expect(store().windows.a.bounds).toEqual({
      x: 100,
      y: 200,
      width: 480, // default kept when not provided
      height: 360,
    });
  });

  it("maximizeWindow flags the window full-bleed and focuses it", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b")); // focus = b

    store().maximizeWindow("a");

    expect(store().windows.a.maximized).toBe(true);
    expect(store().focusedId).toBe("a");
  });

  it("toggleMaximize flips the maximized flag both ways", () => {
    store().openWindow(session("a"));

    store().toggleMaximize("a");
    expect(store().windows.a.maximized).toBe(true);

    store().toggleMaximize("a");
    expect(store().windows.a.maximized).toBe(false);
  });

  it("moving a window updates its position and un-maximizes it", () => {
    store().openWindow(session("a"));
    store().maximizeWindow("a");

    store().moveWindow("a", { x: 300, y: 150 });

    expect(store().windows.a.maximized).toBe(false);
    expect(store().windows.a.bounds).toMatchObject({ x: 300, y: 150 });
  });

  it("resizing clamps to the minimum size and un-maximizes", () => {
    store().openWindow(session("a"));
    store().maximizeWindow("a");

    store().resizeWindow("a", { width: 10, height: 10 });

    expect(store().windows.a.maximized).toBe(false);
    // Clamped to MIN_WIDTH / MIN_HEIGHT.
    expect(store().windows.a.bounds.width).toBe(240);
    expect(store().windows.a.bounds.height).toBe(160);
  });

  it("geometry actions are no-ops on an unknown id", () => {
    store().openWindow(session("a"));
    const before = store().windows;

    store().maximizeWindow("ghost");
    store().moveWindow("ghost", { x: 1, y: 1 });
    store().resizeWindow("ghost", { width: 500, height: 500 });

    expect(store().windows).toBe(before); // identity preserved
  });

  it("updateWindow patches title/icon in place", () => {
    store().openWindow(session("a", "Old"));
    store().updateWindow("a", { title: "New", icon: "terminal" });

    expect(store().windows.a.title).toBe("New");
    expect(store().windows.a.icon).toBe("terminal");
  });

  it("selectOrderedWindows keeps stable creation order regardless of focus", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));
    store().openWindow(session("c"));

    // Focusing A must NOT reorder the dock.
    store().focusWindow("a");

    expect(selectOrderedWindows(store()).map((w) => w.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(store().focusedId).toBe("a");
  });

  it("reset clears all window state", () => {
    store().openWindow(session("a"));
    store().openWindow(session("b"));

    store().reset();

    expect(store().windows).toEqual({});
    expect(store().focusedId).toBeNull();
    expect(store().seq).toBe(0);
  });
});

describe("resolveTaskbarTap", () => {
  const win = (over: Partial<ManagedWindow> = {}): ManagedWindow => ({
    id: "a",
    kind: "session",
    title: "a",
    minimized: false,
    maximized: false,
    bounds: { x: 0, y: 0, width: 480, height: 360 },
    openSeq: 0,
    focusSeq: 0,
    ...over,
  });

  it("restores a minimized window (even if it is the focused id)", () => {
    expect(resolveTaskbarTap(win({ minimized: true }), "a")).toBe("restore");
    expect(resolveTaskbarTap(win({ minimized: true }), "b")).toBe("restore");
  });

  it("minimizes the currently focused (non-minimized) window", () => {
    expect(resolveTaskbarTap(win(), "a")).toBe("minimize");
  });

  it("focuses an open, non-focused window", () => {
    expect(resolveTaskbarTap(win(), "b")).toBe("focus");
    expect(resolveTaskbarTap(win(), null)).toBe("focus");
  });
});
