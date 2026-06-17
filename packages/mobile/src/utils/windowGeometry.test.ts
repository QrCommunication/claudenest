import {
  dragTo,
  resizeFromGrip,
  windowLayoutRect,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
} from "./windowGeometry";
import type { ManagedWindow, WindowBounds } from "@/types";

const start: WindowBounds = { x: 100, y: 80, width: 480, height: 360 };

const managed = (over: Partial<ManagedWindow> = {}): ManagedWindow => ({
  id: "w",
  kind: "session",
  title: "w",
  minimized: false,
  maximized: false,
  bounds: { ...start },
  openSeq: 0,
  focusSeq: 0,
  ...over,
});

describe("windowGeometry.dragTo", () => {
  it("adds the translation to the top-left corner", () => {
    expect(dragTo(start, { x: 30, y: -20 })).toEqual({ x: 130, y: 60 });
  });

  it("handles negative translation past the origin without a container", () => {
    expect(dragTo(start, { x: -500, y: -500 })).toEqual({ x: -400, y: -420 });
  });

  it("keeps a sliver visible against the right/bottom edges of a container", () => {
    const container = { width: 1024, height: 768 };
    // Drag far past the bottom-right; both axes clamp to (size - MIN_VISIBLE).
    const result = dragTo(start, { x: 5000, y: 5000 }, container);
    expect(result).toEqual({ x: 1024 - 48, y: 768 - 48 });
  });

  it("keeps a sliver visible against the left edge and pins the top", () => {
    const container = { width: 1024, height: 768 };
    const result = dragTo(start, { x: -5000, y: -5000 }, container);
    // minX = MIN_VISIBLE - width = 48 - 480 = -432 ; minY = 0 (never above top)
    expect(result).toEqual({ x: -432, y: 0 });
  });

  it("clamps the top-left within reach when the window is larger than the container", () => {
    const container = { width: 100, height: 100 };
    const result = dragTo(start, { x: 0, y: 0 }, container);
    // maxX = width - MIN_VISIBLE = 52 ; maxY = height - MIN_VISIBLE = 52.
    // Both axes clamp down so the header stays reachable on a tiny viewport.
    expect(result).toEqual({ x: 52, y: 52 });
  });
});

describe("windowGeometry.resizeFromGrip", () => {
  it("adds the translation to width/height", () => {
    expect(resizeFromGrip(start, { x: 40, y: 60 })).toEqual({
      width: 520,
      height: 420,
    });
  });

  it("clamps to the minimum window size when shrunk too far", () => {
    expect(resizeFromGrip(start, { x: -5000, y: -5000 })).toEqual({
      width: MIN_WINDOW_WIDTH,
      height: MIN_WINDOW_HEIGHT,
    });
  });

  it("never changes the top-left anchor (caller keeps x/y)", () => {
    const size = resizeFromGrip(start, { x: 10, y: 10 });
    expect(size).not.toHaveProperty("x");
    expect(size).not.toHaveProperty("y");
  });
});

describe("windowGeometry.windowLayoutRect", () => {
  const container = { width: 1024, height: 768 };

  it("returns the window's own bounds when floating", () => {
    expect(windowLayoutRect(managed(), container, 72)).toEqual({
      left: 100,
      top: 80,
      width: 480,
      height: 360,
    });
  });

  it("fills the surface minus the bottom gutter when maximized", () => {
    expect(
      windowLayoutRect(managed({ maximized: true }), container, 72),
    ).toEqual({ left: 0, top: 0, width: 1024, height: 768 - 72 });
  });

  it("floors the maximized height at the minimum window height", () => {
    const tiny = { width: 300, height: 180 };
    const rect = windowLayoutRect(managed({ maximized: true }), tiny, 160);
    // 180 - 160 = 20 < MIN_WINDOW_HEIGHT → clamp up.
    expect(rect.height).toBe(MIN_WINDOW_HEIGHT);
    expect(rect.width).toBe(300);
  });
});
