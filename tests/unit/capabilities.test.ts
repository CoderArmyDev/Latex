import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { inspectCapabilities } from "../../src/core/capabilities";

describe("Capability Model & Syntax Inspection", () => {
  it("should inspect fully supported syntax in a document", () => {
    const ast = parse("\\section{Experience}\n\\textbf{Software Engineer}\n\\begin{itemize}\n\\item TypeScript\n\\end{itemize}");
    const report = inspectCapabilities(ast);

    expect(report.isFullySupported).toBe(true);
    expect(report.unsupported).toHaveLength(0);
    expect(report.supported).toContain("\\section");
    expect(report.supported).toContain("\\textbf");
    expect(report.supported).toContain("\\item");
    expect(report.supported).toContain("itemize");
  });

  it("should detect unsupported commands and environments", () => {
    const ast = parse("\\customMacro{value}\n\\begin{tikzpicture}\\node{};\\end{tikzpicture}");
    const report = inspectCapabilities(ast);

    expect(report.isFullySupported).toBe(false);
    expect(report.unsupported).toContain("\\customMacro");
    expect(report.unsupported).toContain("\\node");
    expect(report.unsupported).toContain("tikzpicture");
  });
});
