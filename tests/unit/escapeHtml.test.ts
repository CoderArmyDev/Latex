import { describe, expect, it } from "vitest";
import { escapeHtml } from "../../src/utils/escapeHtml";

describe("escapeHtml", () => {
  it("should escape HTML special characters", () => {
    expect(escapeHtml("<div>Hello</div>")).toBe(
      "&lt;div&gt;Hello&lt;/div&gt;"
    );
  });

  it("should escape ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("should escape quotes", () => {
    expect(escapeHtml('"Hello" \'World\'')).toBe(
      "&quot;Hello&quot; &#39;World&#39;"
    );
  });

  it("should preserve normal text", () => {
    expect(escapeHtml("CoderArmy")).toBe("CoderArmy");
  });
});
