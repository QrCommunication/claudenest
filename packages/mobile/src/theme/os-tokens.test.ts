/**
 * Contract for the "Claude OS" shell color tokens (`colors.os`).
 *
 * Guards the readability guarantee: the selected item state must be a DISTINCT,
 * accent-tinted, translucent fill — never the rest fill nor an opaque dark
 * surface that reads as "not selected". A silent revert to an invisible
 * selected state should fail here.
 */

import { colors } from "./colors";

describe("colors.os shell tokens", () => {
  it("exposes dock, window and item sub-groups", () => {
    expect(colors.os.dock).toEqual(
      expect.objectContaining({
        surface: expect.any(String),
        border: expect.any(String),
        divider: expect.any(String),
      }),
    );
    expect(colors.os.window).toEqual(
      expect.objectContaining({
        surface: expect.any(String),
        header: expect.any(String),
        border: expect.any(String),
      }),
    );
    expect(colors.os.item).toEqual(
      expect.objectContaining({
        rest: expect.any(String),
        restText: expect.any(String),
        selected: expect.any(String),
        selectedBorder: expect.any(String),
        selectedText: expect.any(String),
      }),
    );
  });

  it("makes the selected state legible: distinct, accent-tinted, translucent", () => {
    const { item } = colors.os;

    // A picked item must not look like an idle one.
    expect(item.selected).not.toBe(item.rest);

    // Selected fill is translucent (rgba with alpha < 1) so it tints the
    // chrome rather than masking it as an opaque dark surface.
    const alphaMatch = item.selected.match(
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/,
    );
    expect(alphaMatch).not.toBeNull();
    const alpha = Number(alphaMatch![1]);
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(1);

    // Border + foreground of a selected item are the brand accent purple.
    expect(item.selectedBorder).toBe(colors.accent.purple);
    expect(item.selectedText).toBe(colors.accent.purple);
  });
});
