import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "../index.ts"), "utf8");

const occurrences = (pattern: RegExp): number =>
  Array.from(source.matchAll(pattern)).length;

describe("root route mount contract", () => {
  it("mounts the message router exactly once", () => {
    expect(occurrences(/routes\.use\(messageRoutes\)/g)).toBe(1);
  });

  it("exposes the social webhook only at its canonical prefix", () => {
    expect(
      occurrences(/routes\.use\("\/webhook", webHookRoutes\)/g)
    ).toBe(1);
    expect(source).not.toMatch(/routes\.use\(webHookRoutes\)/);
    expect(source).not.toMatch(/import webHook from/);
  });
});
