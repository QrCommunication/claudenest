import { classifyLayout } from "./responsiveLayout";

describe("classifyLayout — deviceClass (short-side identity)", () => {
  it("classifies a phone in portrait", () => {
    const l = classifyLayout(390, 844);
    expect(l.deviceClass).toBe("phone");
    expect(l.isPhone).toBe(true);
    expect(l.orientation).toBe("portrait");
  });

  it("keeps a phone a phone in landscape (short side decides)", () => {
    const l = classifyLayout(844, 390);
    expect(l.deviceClass).toBe("phone");
    expect(l.orientation).toBe("landscape");
  });

  it("classifies a tablet in portrait", () => {
    const l = classifyLayout(768, 1024);
    expect(l.deviceClass).toBe("tablet");
    expect(l.isTablet).toBe(true);
  });

  it("classifies a desktop-class surface", () => {
    const l = classifyLayout(1280, 1024);
    expect(l.deviceClass).toBe("desktop");
    expect(l.isDesktop).toBe(true);
  });
});

describe("classifyLayout — breakpoint boundaries (short side)", () => {
  it("599 short side is still a phone", () => {
    expect(classifyLayout(599, 900).deviceClass).toBe("phone");
  });
  it("exactly 600 short side becomes a tablet", () => {
    expect(classifyLayout(600, 900).deviceClass).toBe("tablet");
  });
  it("1023 short side is a tablet", () => {
    expect(classifyLayout(1023, 1400).deviceClass).toBe("tablet");
  });
  it("exactly 1024 short side becomes desktop", () => {
    expect(classifyLayout(1024, 1400).deviceClass).toBe("desktop");
  });
});

describe("classifyLayout — isExpanded uses current width", () => {
  it("phone portrait (390w) is NOT expanded", () => {
    expect(classifyLayout(390, 844).isExpanded).toBe(false);
  });

  it("phone in LANDSCAPE (844w) IS expanded — the rail/dock kick in", () => {
    const l = classifyLayout(844, 390);
    expect(l.isExpanded).toBe(true);
    expect(l.deviceClass).toBe("phone"); // still a phone by identity
  });

  it("tablet portrait (768w) is expanded", () => {
    expect(classifyLayout(768, 1024).isExpanded).toBe(true);
  });

  it("isWide only above the desktop width", () => {
    expect(classifyLayout(1000, 700).isWide).toBe(false);
    expect(classifyLayout(1024, 700).isWide).toBe(true);
  });
});

describe("classifyLayout — orientation", () => {
  it("treats a square surface as landscape (width >= height)", () => {
    expect(classifyLayout(800, 800).orientation).toBe("landscape");
  });
  it("portrait when height exceeds width", () => {
    expect(classifyLayout(500, 900).orientation).toBe("portrait");
  });
});

describe("classifyLayout — passthrough + flag exclusivity", () => {
  it("echoes width/height and sets exactly one device flag", () => {
    const l = classifyLayout(768, 1024);
    expect(l.width).toBe(768);
    expect(l.height).toBe(1024);
    const flags = [l.isPhone, l.isTablet, l.isDesktop].filter(Boolean);
    expect(flags).toHaveLength(1);
  });
});
