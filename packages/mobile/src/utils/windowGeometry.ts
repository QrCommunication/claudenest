/**
 * Pure window-geometry helpers for the "Claude OS" shell — no React/RN imports,
 * so they are deterministic and unit-testable in a node environment.
 *
 * The window manager keeps all geometry math here: clamping a window inside the
 * desktop work area, detecting edge/corner snap zones, computing half/quarter
 * tiled bounds, laying out a tile grid, and cascading new windows.
 */

/** A rectangle within the desktop (origin top-left). */
export interface WindowBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The desktop work area size (origin assumed at 0,0). */
export interface DesktopRect {
  w: number;
  h: number;
}

/** Edge/corner the pointer is hovering for a snap. */
export type SnapZone =
  | "left"
  | "right"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "maximize";

/** Minimum window size — guards against unusably small windows. */
export const WINDOW_MIN = { w: 280, h: 180 } as const;

/** Distance (px) from a desktop edge that triggers a snap. */
const SNAP_MARGIN = 28;

/** Per-window offset (px) when cascading. */
const CASCADE_STEP = 36;

/** Confine a window inside the desktop, enforcing the minimum size. */
export function clampToDesktop(b: WindowBounds, d: DesktopRect): WindowBounds {
  const w = Math.min(Math.max(b.w, WINDOW_MIN.w), Math.max(d.w, WINDOW_MIN.w));
  const h = Math.min(Math.max(b.h, WINDOW_MIN.h), Math.max(d.h, WINDOW_MIN.h));
  const x = Math.min(Math.max(b.x, 0), Math.max(0, d.w - w));
  const y = Math.min(Math.max(b.y, 0), Math.max(0, d.h - h));
  return { x, y, w, h };
}

/**
 * The snap zone for a pointer position, or null when the pointer is not close
 * enough to any edge. Corners win over single edges; the top edge (away from
 * corners) maximizes.
 */
export function snapZoneForPoint(
  x: number,
  y: number,
  d: DesktopRect,
): SnapZone | null {
  const nearLeft = x <= SNAP_MARGIN;
  const nearRight = x >= d.w - SNAP_MARGIN;
  const nearTop = y <= SNAP_MARGIN;
  const nearBottom = y >= d.h - SNAP_MARGIN;

  if (nearLeft && nearTop) return "tl";
  if (nearLeft && nearBottom) return "bl";
  if (nearRight && nearTop) return "tr";
  if (nearRight && nearBottom) return "br";
  if (nearTop) return "maximize";
  if (nearLeft) return "left";
  if (nearRight) return "right";
  return null;
}

/** Bounds for a snap zone: half-screen edges, quarter-screen corners, full maximize. */
export function boundsForZone(zone: SnapZone, d: DesktopRect): WindowBounds {
  const halfW = Math.round(d.w / 2);
  const halfH = Math.round(d.h / 2);
  const map: Record<SnapZone, WindowBounds> = {
    maximize: { x: 0, y: 0, w: d.w, h: d.h },
    left: { x: 0, y: 0, w: halfW, h: d.h },
    right: { x: d.w - halfW, y: 0, w: halfW, h: d.h },
    tl: { x: 0, y: 0, w: halfW, h: halfH },
    tr: { x: d.w - halfW, y: 0, w: halfW, h: halfH },
    bl: { x: 0, y: d.h - halfH, w: halfW, h: halfH },
    br: { x: d.w - halfW, y: d.h - halfH, w: halfW, h: halfH },
  };
  return map[zone];
}

/** Lay out n windows in a roughly-square grid covering the desktop. */
export function tileGrid(n: number, d: DesktopRect): WindowBounds[] {
  if (n <= 0) return [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = Math.floor(d.w / cols);
  const cellH = Math.floor(d.h / rows);
  const out: WindowBounds[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    out.push({ x: c * cellW, y: r * cellH, w: cellW, h: cellH });
  }
  return out;
}

/** Cascade position for the i-th window (wraps every 8 to stay on-screen). */
export function cascadeBounds(i: number, d: DesktopRect): WindowBounds {
  const w = Math.min(Math.round(d.w * 0.6), Math.max(WINDOW_MIN.w, d.w - 80));
  const h = Math.min(Math.round(d.h * 0.6), Math.max(WINDOW_MIN.h, d.h - 80));
  const offset = (i % 8) * CASCADE_STEP;
  return clampToDesktop({ x: 40 + offset, y: 40 + offset, w, h }, d);
}

/** Opening bounds for a new window: requested size, cascaded so windows don't stack exactly. */
export function defaultBoundsFor(
  size: { w: number; h: number },
  d: DesktopRect,
  i: number,
): WindowBounds {
  const w = Math.min(size.w, d.w);
  const h = Math.min(size.h, d.h);
  const offset = (i % 8) * CASCADE_STEP;
  const x = Math.min(60 + offset, Math.max(0, d.w - w));
  const y = Math.min(60 + offset, Math.max(0, d.h - h));
  return clampToDesktop({ x, y, w, h }, d);
}
