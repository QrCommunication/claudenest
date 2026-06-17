import {
  boundsForZone,
  cascadeBounds,
  clampToDesktop,
  defaultBoundsFor,
  snapZoneForPoint,
  tileGrid,
} from "./windowGeometry";

const D = { w: 1200, h: 800 };

describe("clampToDesktop", () => {
  it("keeps an in-bounds window unchanged", () => {
    expect(clampToDesktop({ x: 100, y: 100, w: 400, h: 300 }, D)).toEqual({
      x: 100,
      y: 100,
      w: 400,
      h: 300,
    });
  });

  it("pulls an off-screen window back inside", () => {
    const r = clampToDesktop({ x: 2000, y: -50, w: 400, h: 300 }, D);
    expect(r.x).toBe(800); // 1200 - 400
    expect(r.y).toBe(0);
  });

  it("never exceeds the desktop size", () => {
    const r = clampToDesktop({ x: 0, y: 0, w: 5000, h: 5000 }, D);
    expect(r.w).toBe(1200);
    expect(r.h).toBe(800);
  });
});

describe("snapZoneForPoint", () => {
  it("detects edges and corners", () => {
    expect(snapZoneForPoint(2, 400, D)).toBe("left");
    expect(snapZoneForPoint(1198, 400, D)).toBe("right");
    expect(snapZoneForPoint(600, 2, D)).toBe("maximize");
    expect(snapZoneForPoint(2, 2, D)).toBe("tl");
    expect(snapZoneForPoint(1198, 2, D)).toBe("tr");
    expect(snapZoneForPoint(2, 798, D)).toBe("bl");
    expect(snapZoneForPoint(1198, 798, D)).toBe("br");
  });

  it("returns null away from the edges", () => {
    expect(snapZoneForPoint(600, 400, D)).toBeNull();
  });
});

describe("boundsForZone", () => {
  it("computes half / quarter / maximize bounds", () => {
    expect(boundsForZone("maximize", D)).toEqual({
      x: 0,
      y: 0,
      w: 1200,
      h: 800,
    });
    expect(boundsForZone("left", D)).toEqual({ x: 0, y: 0, w: 600, h: 800 });
    expect(boundsForZone("right", D)).toEqual({ x: 600, y: 0, w: 600, h: 800 });
    expect(boundsForZone("tr", D)).toEqual({ x: 600, y: 0, w: 600, h: 400 });
    expect(boundsForZone("bl", D)).toEqual({ x: 0, y: 400, w: 600, h: 400 });
  });
});

describe("tileGrid", () => {
  it.each<[number, number]>([
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
  ])("returns %i cells", (n, len) => {
    expect(tileGrid(n, D)).toHaveLength(len);
  });

  it("returns empty for non-positive counts", () => {
    expect(tileGrid(0, D)).toEqual([]);
  });

  it("tiles 2 windows side by side", () => {
    const g = tileGrid(2, D);
    expect(g[0]).toEqual({ x: 0, y: 0, w: 600, h: 800 });
    expect(g[1]).toEqual({ x: 600, y: 0, w: 600, h: 800 });
  });
});

describe("cascadeBounds", () => {
  it("offsets each successive window", () => {
    const a = cascadeBounds(0, D);
    const b = cascadeBounds(1, D);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeGreaterThan(a.y);
  });
});

describe("defaultBoundsFor", () => {
  it("clamps the requested size to the desktop", () => {
    const r = defaultBoundsFor({ w: 5000, h: 5000 }, D, 0);
    expect(r.w).toBeLessThanOrEqual(1200);
    expect(r.h).toBeLessThanOrEqual(800);
  });
});
