/**
 * windowGeometry — pure math for the "Claude OS" window manager.
 *
 * Turns a gesture's cumulative translation (logical pixels, relative to where
 * the drag began) into an absolute window position/size, given a snapshot of
 * the window's bounds at gesture start. Kept pure (no React, no store) so it is
 * shared by `WindowFrame` (emitting gestures) and the desktop host (committing
 * the result to the store), and unit-testable in the node test environment.
 */

import type { ManagedWindow, WindowBounds } from "@/types";

/** Floor sizes a window can never shrink below — mirrored by the store's clamp. */
export const MIN_WINDOW_WIDTH = 240;
export const MIN_WINDOW_HEIGHT = 160;

/** Cumulative pointer translation since a gesture began (logical px). */
export interface Translation {
  x: number;
  y: number;
}

/**
 * New top-left corner after dragging the header by `t` from `start`.
 * When `container` is given, the window is kept within it so the header never
 * drifts fully off-screen (at least `MIN_VISIBLE` px stay reachable).
 */
export function dragTo(
  start: WindowBounds,
  t: Translation,
  container?: { width: number; height: number },
): { x: number; y: number } {
  let x = start.x + t.x;
  let y = start.y + t.y;

  if (container) {
    // Keep a sliver of the window on-screen on every edge so it can't be lost.
    const MIN_VISIBLE = 48;
    const maxX = container.width - MIN_VISIBLE;
    const maxY = container.height - MIN_VISIBLE;
    const minX = MIN_VISIBLE - start.width;
    const minY = 0; // never let the header go above the top edge
    x = clamp(x, minX, maxX);
    y = clamp(y, minY, maxY);
  }

  return { x, y };
}

/**
 * New size after dragging the bottom-right resize grip by `t`, clamped to the
 * minimum window size. Position is unchanged (the top-left anchor stays put).
 */
export function resizeFromGrip(
  start: WindowBounds,
  t: Translation,
): { width: number; height: number } {
  return {
    width: Math.max(MIN_WINDOW_WIDTH, start.width + t.x),
    height: Math.max(MIN_WINDOW_HEIGHT, start.height + t.y),
  };
}

/** Absolute placement of a window within the desktop surface. */
export interface LayoutRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Absolute rect a window occupies in the desktop host's surface:
 *  - maximized → full surface minus `bottomGutter` (room for the taskbar),
 *    floored at the minimum window height.
 *  - floating  → the window's own bounds.
 */
export function windowLayoutRect(
  win: ManagedWindow,
  container: { width: number; height: number },
  bottomGutter = 0,
): LayoutRect {
  if (win.maximized) {
    return {
      left: 0,
      top: 0,
      width: container.width,
      height: Math.max(MIN_WINDOW_HEIGHT, container.height - bottomGutter),
    };
  }
  return {
    left: win.bounds.x,
    top: win.bounds.y,
    width: win.bounds.width,
    height: win.bounds.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  // Guard against a degenerate range (container smaller than the window).
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}
