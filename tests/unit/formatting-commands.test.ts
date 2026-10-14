import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { renderHtml } from "../../src/renderers/html";

describe("First Formatting Commands", () => {
  it("should render \\textbf as <strong>", () => {
    const ast = parse("\\textbf{Hello World}");
    expect(renderHtml(ast)).toBe("<strong>Hello World</strong>");
  });

  it("should render \\textit as <em>", () => {
    const ast = parse("\\textit{Italic Text}");
    expect(renderHtml(ast)).toBe("<em>Italic Text</em>");
  });

  it("should render \\emph as <em>", () => {
    const ast = parse("\\emph{Emphasized Text}");
    expect(renderHtml(ast)).toBe("<em>Emphasized Text</em>");
  });

  it("should render \\texttt as <code>", () => {
    const ast = parse("\\texttt{const x = 42;}");
    expect(renderHtml(ast)).toBe("<code>const x = 42;</code>");
  });

  it("should render \\underline as <u>", () => {
    const ast = parse("\\underline{Underlined Text}");
    expect(renderHtml(ast)).toBe("<u>Underlined Text</u>");
  });

  it("should render nested formatting commands (e.g. \\textbf{\\textit{...}})", () => {
    const ast = parse("\\textbf{Hello \\textit{world}}");
    expect(renderHtml(ast)).toBe("<strong>Hello <em>world</em></strong>");
  });

  it("should render deeply nested formatting commands", () => {
    const ast = parse(
      "\\textbf{\\underline{Important:}} Please read \\texttt{\\textbf{config.json}} \\emph{carefully}."
    );
    expect(renderHtml(ast)).toBe(
      "<strong><u>Important:</u></strong> Please read <code><strong>config.json</strong></code> <em>carefully</em>."
    );
  });

  it("should escape special HTML characters inside formatting commands", () => {
    const ast = parse("\\textbf{1 < 2 & 3 > 0}");
    expect(renderHtml(ast)).toBe("<strong>1 &lt; 2 &amp; 3 &gt; 0</strong>");
  });
});
