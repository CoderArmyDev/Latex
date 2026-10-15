import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { renderHtml } from "../../src/renderers/html";
import { LatexParseError } from "../../src/core/errors";

describe("LaTeX Macros", () => {
  it("expands a zero-argument macro", () => {
    const ast = parse("\\newcommand{\\resumeName}{CoderArmy}\\resumeName");
    const html = renderHtml(ast);

    expect(html).toBe("CoderArmy");
  });

  it("expands a one-argument macro", () => {
    const ast = parse(
      "\\newcommand{\\resumeItem}[1]{\\item #1}\\resumeItem{Built a resume builder}",
    );
    const html = renderHtml(ast);

    expect(html).toContain("Built a resume builder");
  });

  it("expands a macro with multiple arguments", () => {
    const ast = parse(
      "\\newcommand{\\resumeEntry}[2]{#1 -- #2}\\resumeEntry{Frontend Developer}{Kolkata}",
    );
    const html = renderHtml(ast);

    expect(html).toBe("Frontend Developer -- Kolkata");
  });

  it("expands begin and end environments from macros", () => {
    const source = `\\newcommand{\\resumeListStart}{\\begin{itemize}}
\\newcommand{\\resumeListEnd}{\\end{itemize}}
\\resumeListStart
\\item First item
\\item Second item
\\resumeListEnd`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>First item</li>");
    expect(html).toContain("<li>Second item</li>");
  });

  it("preserves nested formatting in macro expansions", () => {
    const ast = parse(
      "\\newcommand{\\resumeItem}[1]{\\item\\textbf{#1}}\\resumeItem{Important achievement}",
    );
    const html = renderHtml(ast);

    expect(html).toBe("<strong>Important achievement</strong>");
  });

  it("does not render macro definitions literally", () => {
    const ast = parse("\\newcommand{\\resumeName}{CoderArmy}");
    const html = renderHtml(ast);

    expect(html).toBe("");
    expect(html).not.toContain("newcommand");
    expect(html).not.toContain("resumeName");
  });

  it("keeps existing commands functional", () => {
    const ast = parse("\\section{Experience}\\textbf{Software Engineer}");
    const html = renderHtml(ast);

    expect(html).toBe(
      '<h2 class="latex-section">Experience</h2><strong>Software Engineer</strong>',
    );
  });

  it("rejects duplicate newcommand definitions", () => {
    expect(() =>
      parse("\\newcommand{\\name}{A}\\newcommand{\\name}{B}"),
    ).toThrow(LatexParseError);
  });

  it("supports renewcommand and providecommand semantics", () => {
    const renewed = renderHtml(
      parse("\\newcommand{\\name}{A}\\renewcommand{\\name}{B}\\name"),
    );
    const provided = renderHtml(
      parse("\\newcommand{\\name}{A}\\providecommand{\\name}{B}\\name"),
    );

    expect(renewed).toBe("B");
    expect(provided).toBe("A");
    expect(() => parse("\\renewcommand{\\missing}{B}")).toThrow(
      LatexParseError,
    );
  });

  it("requires arguments for parameterized macros", () => {
    expect(() =>
      parse("\\newcommand{\\resumeItem}[1]{#1}\\resumeItem"),
    ).toThrow(LatexParseError);
  });

  it("fails safely for recursive macro expansion", () => {
    expect(() =>
      parse("\\newcommand{\\loop}{\\loop}\\loop"),
    ).toThrow(LatexParseError);
  });

  it("does not leak definitions across parses", () => {
    const firstHtml = renderHtml(parse("\\newcommand{\\name}{First}\\name"));
    const secondHtml = renderHtml(parse("\\newcommand{\\name}{Second}\\name"));

    expect(firstHtml).toBe("First");
    expect(secondHtml).toBe("Second");
  });

  it("supports optional defaults for the first argument", () => {
    const ast = parse(
      "\\newcommand{\\role}[2][Engineer]{#1: #2}\\role{Platform}\\role[Lead]{Frontend}",
    );
    const html = renderHtml(ast);

    expect(html).toBe("Engineer: PlatformLead: Frontend");
  });

  it("parses a Jake-style resume macro fixture", () => {
    const source = `\\documentclass{article}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}}
\\newcommand{\\resumeItem}[1]{\\item\\small{#1}}
\\begin{document}
\\section{Experience}
\\resumeSubHeadingListStart
\\item Software Engineer
\\resumeItemListStart
\\resumeItem{Built a full-stack resume builder}
\\resumeItem{Improved LaTeX parsing}
\\resumeItemListEnd
\\resumeSubHeadingListEnd
\\end{document}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toContain("Experience");
    expect(html).toContain("Software Engineer");
    expect(html).toContain("Built a full-stack resume builder");
    expect(html).toContain("Improved LaTeX parsing");
  });
});
