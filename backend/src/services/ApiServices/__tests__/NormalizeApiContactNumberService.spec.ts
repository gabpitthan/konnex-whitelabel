import NormalizeApiContactNumberService from "../NormalizeApiContactNumberService";

describe("NormalizeApiContactNumberService", () => {
  it("normalizes whitespace and hyphens from a numeric contact", () => {
    expect(NormalizeApiContactNumberService("55 11-99999 0000")).toBe(
      "5511999990000"
    );
  });

  it.each([undefined, null, "", "abc", "55+11", {}])(
    "rejects invalid external input %#",
    value => {
      expect(() => NormalizeApiContactNumberService(value)).toThrow(
        "ERR_INVALID_CONTACT_NUMBER"
      );
    }
  );
});
