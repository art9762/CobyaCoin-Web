import { describe, expect, it } from "vitest";
import { returnPath } from "./returnPath";

describe("post-login destination", () => {
  it("preserves a known route's query and fragment", () => {
    expect(returnPath("/trade?view=open#orders")).toBe("/trade?view=open#orders");
  });
  it.each([null, "", "/login", "/unknown", "https://outside.invalid/trade", "//outside.invalid/trade",
    "/\\outside.invalid/trade", "javascript:alert(1)"])("falls back for %s", (value) => {
    expect(returnPath(value)).toBe("/home");
  });
});
