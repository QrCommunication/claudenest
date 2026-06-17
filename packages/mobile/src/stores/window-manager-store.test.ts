import {
  selectOrderedWindows,
  useWindowManagerStore,
} from "./windowManagerStore";

const store = () => useWindowManagerStore.getState();

beforeEach(() => {
  store().reset();
  store().setDesktopSize({ w: 1200, h: 800 });
});

describe("openApp", () => {
  it("creates and focuses a window", () => {
    const id = store().openApp({
      appId: "tasks",
      title: "Tasks",
      icon: "list",
    });
    const s = store();
    expect(s.windows[id]).toBeDefined();
    expect(s.focusedId).toBe(id);
    expect(s.windows[id].state).toBe("normal");
    expect(s.windows[id].workspaceId).toBe(s.activeWorkspaceId);
  });

  it("re-opening a singleInstance app focuses the existing window (no dup)", () => {
    const a = store().openApp({
      appId: "settings",
      title: "Settings",
      icon: "settings",
      singleInstance: true,
    });
    const b = store().openApp({
      appId: "settings",
      title: "Settings",
      icon: "settings",
      singleInstance: true,
    });
    expect(a).toBe(b);
    expect(Object.keys(store().windows)).toHaveLength(1);
  });

  it("re-opening by instanceKey focuses the same window", () => {
    const a = store().openApp({
      appId: "session",
      instanceKey: "s1",
      title: "S1",
      icon: "terminal",
    });
    const b = store().openApp({
      appId: "session",
      instanceKey: "s1",
      title: "S1",
      icon: "terminal",
    });
    expect(a).toBe(b);
    expect(Object.keys(store().windows)).toHaveLength(1);
  });

  it("allows multiple instances via distinct instanceKeys", () => {
    store().openApp({
      appId: "project",
      instanceKey: "p1",
      title: "P1",
      icon: "folder",
    });
    store().openApp({
      appId: "project",
      instanceKey: "p2",
      title: "P2",
      icon: "folder",
    });
    expect(Object.keys(store().windows)).toHaveLength(2);
  });
});

describe("focus / z-order", () => {
  it("focusWindow brings a window to the front", () => {
    const a = store().openApp({ appId: "a", title: "A", icon: "x" });
    const b = store().openApp({ appId: "b", title: "B", icon: "x" });
    expect(store().windows[b].zIndex).toBeGreaterThan(
      store().windows[a].zIndex,
    );
    store().focusWindow(a);
    expect(store().windows[a].zIndex).toBeGreaterThan(
      store().windows[b].zIndex,
    );
    expect(store().focusedId).toBe(a);
  });
});

describe("minimize / close refocus MRU", () => {
  it("minimizing the focused window refocuses the next MRU window", () => {
    const a = store().openApp({ appId: "a", title: "A", icon: "x" });
    const b = store().openApp({ appId: "b", title: "B", icon: "x" });
    expect(store().focusedId).toBe(b);
    store().minimizeWindow(b);
    expect(store().windows[b].state).toBe("minimized");
    expect(store().focusedId).toBe(a);
  });

  it("closing the focused window refocuses MRU", () => {
    const a = store().openApp({ appId: "a", title: "A", icon: "x" });
    const b = store().openApp({ appId: "b", title: "B", icon: "x" });
    store().closeWindow(b);
    expect(store().windows[b]).toBeUndefined();
    expect(store().focusedId).toBe(a);
  });
});

describe("maximize / restore", () => {
  it("fills the desktop then restores the previous bounds", () => {
    const id = store().openApp({
      appId: "a",
      title: "A",
      icon: "x",
      size: { w: 400, h: 300 },
    });
    const before = { ...store().windows[id].bounds };
    store().toggleMaximize(id);
    expect(store().windows[id].state).toBe("maximized");
    expect(store().windows[id].bounds).toEqual({ x: 0, y: 0, w: 1200, h: 800 });
    store().toggleMaximize(id);
    expect(store().windows[id].state).toBe("normal");
    expect(store().windows[id].bounds).toEqual(before);
  });
});

describe("snap", () => {
  it("snaps a window to the left half", () => {
    const id = store().openApp({ appId: "a", title: "A", icon: "x" });
    store().snapWindow(id, "left");
    expect(store().windows[id].state).toBe("tiled");
    expect(store().windows[id].bounds).toEqual({ x: 0, y: 0, w: 600, h: 800 });
  });
});

describe("workspaces", () => {
  it("creates and switches workspaces, filtering windows", () => {
    store().openApp({ appId: "a", title: "A", icon: "x" });
    const ws2 = store().createWorkspace("Desk 2");
    store().switchWorkspace(ws2);
    expect(store().activeWorkspaceId).toBe(ws2);
    expect(selectOrderedWindows(store())).toHaveLength(0);
    const b = store().openApp({ appId: "b", title: "B", icon: "x" });
    expect(store().windows[b].workspaceId).toBe(ws2);
    expect(selectOrderedWindows(store())).toHaveLength(1);
  });

  it("moves a window to another workspace", () => {
    const a = store().openApp({ appId: "a", title: "A", icon: "x" });
    const ws2 = store().createWorkspace();
    store().moveWindowToWorkspace(a, ws2);
    expect(store().windows[a].workspaceId).toBe(ws2);
    expect(selectOrderedWindows(store(), ws2)).toHaveLength(1);
  });
});

describe("selectOrderedWindows", () => {
  it("orders by openSeq (stable), not by focus", () => {
    const a = store().openApp({ appId: "a", title: "A", icon: "x" });
    const b = store().openApp({ appId: "b", title: "B", icon: "x" });
    store().focusWindow(a);
    expect(selectOrderedWindows(store()).map((w) => w.id)).toEqual([a, b]);
  });
});
