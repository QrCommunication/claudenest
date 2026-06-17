import { translate } from "./translate";
import { en } from "./en";
import { fr } from "./fr";

describe("translate", () => {
  it("resolves a key in the requested language", () => {
    expect(translate("en", "common.cancel")).toBe("Cancel");
    expect(translate("fr", "common.cancel")).toBe("Annuler");
  });

  it("interpolates {placeholder} params", () => {
    expect(translate("en", "sprint.daysLeft", { n: 3 })).toBe("3d left");
    expect(translate("fr", "sprint.daysLeft", { n: 3 })).toBe("3j restants");
    expect(translate("en", "epic.prNumbered", { number: 42 })).toBe("PR #42");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "epicsBoard.deleteConfirm", {})).toContain("{name}");
  });

  it("falls back to the raw key when missing everywhere", () => {
    expect(translate("en", "does.not.exist")).toBe("does.not.exist");
  });

  it("keeps EN and FR resource keys in parity", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });
});
