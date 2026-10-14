import { describe, it, expect, vi } from "vitest";
import { parse } from "../../src/core/parser";
import { renderHtml } from "../../src/renderers/html";
import { LatexUnsupportedSyntaxError } from "../../src/core/errors";

describe("Resume Syntax Infrastructure", () => {
  it("should render sections and subsections", () => {
    const ast = parse("\\section{Education}\n\\subsection{University}");
    const html = renderHtml(ast);
    expect(html).toBe('<h2 class="latex-section">Education</h2>\n<h3 class="latex-subsection">University</h3>');
  });

  it("should render line breaks (\\\\ and \\newline)", () => {
    const ast = parse("Line 1\\\\Line 2\\newline Line 3");
    const html = renderHtml(ast);
    expect(html).toBe("Line 1<br />Line 2<br /> Line 3");
  });

  it("should render safe hyperlinks (\\href and \\url)", () => {
    const ast = parse("\\href{https://example.com}{Portfolio} and \\url{https://example.com}");
    const html = renderHtml(ast);
    expect(html).toBe(
      '<a class="latex-link" href="https://example.com">Portfolio</a> and <a class="latex-link" href="https://example.com">https://example.com</a>'
    );
  });

  it("should sanitize dangerous javascript: URLs in \\href", () => {
    const ast = parse('\\href{javascript:alert("hacked")}{Click me}');
    const html = renderHtml(ast);
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("should render labeled href commands without visible raw URLs", () => {
    const ast = parse(
      "\\href{mailto:jitdhank659@gmail.com}{\\underline{jitdhank659@gmail.com}} | \\href{https://github.com/Jit-6}{\\underline{github.com/Jit-6}}",
    );
    const html = renderHtml(ast);

    expect(html).toContain('href="mailto:jitdhank659@gmail.com"');
    expect(html).toContain("<u>jitdhank659@gmail.com</u>");
    expect(html).toContain('href="https://github.com/Jit-6"');
    expect(html).toContain("<u>github.com/Jit-6</u>");
    expect(html).not.toContain(">mailto:jitdhank659@gmail.com");
    expect(html).not.toContain(">https://github.com/Jit-6");
  });

  it("should normalize bare web href destinations for PDF clickability", () => {
    const html = renderHtml(
      parse("\\href{github.com/Jit-6}{\\underline{github.com/Jit-6}}"),
    );

    expect(html).toContain('href="https://github.com/Jit-6"');
    expect(html).toContain("<u>github.com/Jit-6</u>");
    expect(html).not.toContain(">https://github.com/Jit-6");
  });

  it("should suppress one-argument href commands instead of showing raw URLs", () => {
    const html = renderHtml(parse("\\href{https://github.com/Jit-6}"));

    expect(html).toBe("");
    expect(html).not.toContain("https://github.com/Jit-6");
  });

  it("should keep text after a one-argument formatting command outside the bold span", () => {
    const html = renderHtml(parse("\\textbf{Languages}{: C, C++, SQL}"));

    expect(html).toBe("<strong>Languages</strong>: C, C++, SQL");
  });

  it("should render escaped TeX symbols", () => {
    const ast = parse("C\\# \\& C++ \\$100 50\\% my\\_file \\{code\\}");
    const html = renderHtml(ast);
    expect(html).toBe("C# &amp; C++ $100 50% my_file {code}");
  });

  it("should strip preamble commands without error", () => {
    const source = `\\documentclass{article}
\\usepackage{geometry}
\\pagestyle{empty}
\\begin{document}
John Doe
\\end{document}`;
    const ast = parse(source);
    const html = renderHtml(ast);
    expect(html).toContain("John Doe");
    expect(html).not.toContain("documentclass");
    expect(html).not.toContain("geometry");
  });

  it("should strip resume template preamble-only commands and assignments", () => {
    const source = `\\addtolength{\\oddsidemargin}{-0.5in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]
\\pdfgentounicode=1
\\begin{document}
Visible
\\end{document}`;
    const html = renderHtml(parse(source));

    expect(html).toContain("Visible");
    expect(html).not.toContain("-0.5in");
    expect(html).not.toContain("same");
    expect(html).not.toContain("=1");
    expect(html).not.toContain("0em");
  });

  it("should render tabular* resume rows without exposing layout arguments", () => {
    const source = `\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
\\textbf{Full Stack Engineer Intern} & September 2025 -- August 2026 \\\\
\\textit{Coder Army} & \\textit{Remote} \\\\
\\end{tabular*}`;
    const html = renderHtml(parse(source));

    expect(html).toContain("Full Stack Engineer Intern");
    expect(html).toContain("September 2025 -- August 2026");
    expect(html).toContain("Coder Army");
    expect(html).toContain("Remote");
    expect(html).not.toContain("0.97");
    expect(html).not.toContain("textwidth");
    expect(html).not.toContain("extracolsep");
  });

  it("should render center environment", () => {
    const ast = parse("\\begin{center}\\textbf{John Doe}\\end{center}");
    const html = renderHtml(ast);
    expect(html).toBe('<div class="text-center"><strong>John Doe</strong></div>');
  });

  describe("Unsupported Syntax Policy", () => {
    it("should render children by default on unknown commands", () => {
      const ast = parse("\\unknownMacro{Preserved text}");
      const html = renderHtml(ast, { unsupportedPolicy: "render_children" });
      expect(html).toBe("Preserved text");
    });

    it("should ignore unsupported commands when policy is 'ignore'", () => {
      const ast = parse("Before \\unknownMacro{Hidden text} After");
      const html = renderHtml(ast, { unsupportedPolicy: "ignore" });
      expect(html).toBe("Before  After");
    });

    it("should throw LatexUnsupportedSyntaxError when policy is 'throw'", () => {
      const ast = parse("\\unknownMacro{text}");
      expect(() => renderHtml(ast, { unsupportedPolicy: "throw" })).toThrow(
        LatexUnsupportedSyntaxError
      );
    });

    it("should emit comments when policy is 'comment'", () => {
      const ast = parse("\\unknownMacro{text}");
      const html = renderHtml(ast, { unsupportedPolicy: "comment" });
      expect(html).toBe("<!-- unsupported command \\unknownMacro -->text");
    });

    it("should trigger onWarn callback when policy is 'warn'", () => {
      const onWarn = vi.fn();
      const ast = parse("\\unknownMacro{text}");
      const html = renderHtml(ast, { unsupportedPolicy: "warn", onWarn });

      expect(html).toBe("text");
      expect(onWarn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "command",
          name: "unknownMacro",
        })
      );
    });
  });
});
