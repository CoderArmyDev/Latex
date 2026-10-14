import { describe, it, expect } from "vitest";
import {
  parseLatex,
  renderLatex,
  renderAst,
  renderLatexDocument,
  generatePrintHtml,
  buildPrintCss,
} from "../../src/index";

// ── parseLatex ────────────────────────────────────────────────────────────────
describe("parseLatex", () => {
  it("returns a DocumentNode for plain text", () => {
    const ast = parseLatex("Hello world.");
    expect(ast.type).toBe("document");
    expect(ast.children[0]).toMatchObject({ type: "text", value: "Hello world." });
  });

  it("returns a DocumentNode for a command", () => {
    const ast = parseLatex("\\textbf{bold}");
    expect(ast.children[0]).toMatchObject({ type: "command", name: "textbf" });
  });
});

// ── renderLatex ───────────────────────────────────────────────────────────────
describe("renderLatex", () => {
  it("renders plain text", () => {
    expect(renderLatex("Hello world.")).toBe("Hello world.");
  });

  it("renders \\textbf as <strong>", () => {
    expect(renderLatex("\\textbf{bold}")).toBe("<strong>bold</strong>");
  });

  it("renders \\textit as <em>", () => {
    expect(renderLatex("\\textit{italic}")).toBe("<em>italic</em>");
  });

  it("renders \\underline as <u>", () => {
    expect(renderLatex("\\underline{underline}")).toBe("<u>underline</u>");
  });

  it("renders \\section as <h2>", () => {
    expect(renderLatex("\\section{Introduction}")).toBe(
      '<h2 class="latex-section">Introduction</h2>'
    );
  });

  it("renders \\subsection as <h3>", () => {
    expect(renderLatex("\\subsection{Background}")).toBe(
      '<h3 class="latex-subsection">Background</h3>'
    );
  });

  it("renders \\chapter as <h1>", () => {
    expect(renderLatex("\\chapter{Overview}")).toBe(
      '<h1 class="latex-chapter">Overview</h1>'
    );
  });

  it("renders itemize list", () => {
    const src = "\\begin{itemize}\n\\item One\n\\item Two\n\\end{itemize}";
    expect(renderLatex(src)).toBe("<ul><li>One</li><li>Two</li></ul>");
  });

  it("renders enumerate list", () => {
    const src = "\\begin{enumerate}\n\\item First\n\\item Second\n\\end{enumerate}";
    expect(renderLatex(src)).toBe("<ol><li>First</li><li>Second</li></ol>");
  });

  it("renders inline math ($...$) as escaped text", () => {
    // $ is a SPECIAL_CHAR — rendered as-is (escaped)
    const html = renderLatex("$x^2 + y^2$");
    expect(html).toContain("x");
  });

  it("renders \\includegraphics with width option", () => {
    const html = renderLatex("\\includegraphics[width=0.5\\textwidth]{image.png}");
    expect(html).toContain('<img');
    expect(html).toContain('image.png');
    expect(html).toContain('50%');
  });

  it("renders \\includegraphics without option", () => {
    const html = renderLatex("\\includegraphics{photo.jpg}");
    expect(html).toContain('<img');
    expect(html).toContain('photo.jpg');
    expect(html).toContain('max-width:100%');
  });

  it("renders \\pagebreak as page-break div", () => {
    expect(renderLatex("\\pagebreak")).toBe('<div class="page-break"></div>');
  });

  it("renders \\newpage as page-break div", () => {
    expect(renderLatex("\\newpage")).toBe('<div class="page-break"></div>');
  });

  it("renders \\footnote as superscript with title", () => {
    const html = renderLatex("\\footnote{See appendix}");
    expect(html).toContain('<sup');
    expect(html).toContain('See appendix');
  });

  it("renders \\caption as figcaption", () => {
    expect(renderLatex("\\caption{My figure}")).toBe(
      '<figcaption class="latex-caption">My figure</figcaption>'
    );
  });

  it("renders figure environment", () => {
    const src = "\\begin{figure}\n\\includegraphics{img.png}\n\\caption{A figure}\n\\end{figure}";
    const html = renderLatex(src);
    expect(html).toContain('<figure class="latex-figure avoid-break">');
    expect(html).toContain('<img');
    expect(html).toContain('<figcaption');
  });

  it("renders table environment wrapping tabular", () => {
    const src = "\\begin{table}\n\\begin{tabular}{|c|c|}\nA & B \\\\\nC & D\n\\end{tabular}\n\\end{table}";
    const html = renderLatex(src);
    expect(html).toContain('<figure class="latex-table-float avoid-break">');
    expect(html).toContain('<table class="latex-table">');
  });

  it("renders tabular as HTML table", () => {
    const src = "\\begin{tabular}{|c|c|}\nA & B \\\\\nC & D\n\\end{tabular}";
    const html = renderLatex(src);
    expect(html).toContain('<table class="latex-table">');
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("renders quote environment as blockquote", () => {
    const html = renderLatex("\\begin{quote}\nSome quoted text.\n\\end{quote}");
    expect(html).toContain('<blockquote class="latex-quote">');
  });

  it("renders verbatim environment as pre/code", () => {
    const html = renderLatex("\\begin{verbatim}\nconst x = 1;\n\\end{verbatim}");
    expect(html).toContain('<pre class="latex-verbatim">');
    expect(html).toContain('<code>');
  });

  it("renders abstract environment", () => {
    const html = renderLatex("\\begin{abstract}\nThis paper presents...\n\\end{abstract}");
    expect(html).toContain('<section class="latex-abstract avoid-break">');
    expect(html).toContain('<h2>Abstract</h2>');
  });

  it("renders equation environment as display math", () => {
    const html = renderLatex("\\begin{equation}\nE = mc^2\n\\end{equation}");
    expect(html).toContain('<div class="latex-equation avoid-break">');
    expect(html).toContain('display="block"');
  });

  it("renders center environment", () => {
    const html = renderLatex("\\begin{center}Centered\\end{center}");
    expect(html).toBe('<div class="text-center">Centered</div>');
  });

  it("escapes HTML in text nodes (XSS prevention)", () => {
    const html = renderLatex('<script>alert("x")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("sanitizes javascript: URLs in \\href", () => {
    const html = renderLatex('\\href{javascript:alert(1)}{Click}');
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("renders a full document with preamble stripped", () => {
    const src = `\\documentclass{article}
\\usepackage{geometry}
\\begin{document}
\\section{Hello}
World
\\end{document}`;
    const html = renderLatex(src);
    expect(html).toContain('<h2 class="latex-section">Hello</h2>');
    expect(html).toContain("World");
    expect(html).not.toContain("documentclass");
  });
});

// ── renderAst ─────────────────────────────────────────────────────────────────
describe("renderAst", () => {
  it("renders a pre-parsed AST", () => {
    const ast = parseLatex("\\textbf{Hello}");
    expect(renderAst(ast)).toBe("<strong>Hello</strong>");
  });
});

// ── generatePrintHtml / renderLatexDocument ───────────────────────────────────
describe("generatePrintHtml", () => {
  it("wraps body in a complete HTML document", () => {
    const html = generatePrintHtml("<p>Hello</p>", { title: "Test Doc" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Test Doc</title>");
    expect(html).toContain("<p>Hello</p>");
    expect(html).toContain("</html>");
  });

  it("includes Letter @page CSS", () => {
    const html = generatePrintHtml("<p>x</p>");
    expect(html).toContain("size: Letter");
    expect(html).toContain("@page");
  });

  it("includes print media query with page-break rules", () => {
    const html = generatePrintHtml("<p>x</p>");
    expect(html).toContain("@media print");
    expect(html).toContain("page-break");
  });

  it("supports custom page margin", () => {
    const html = generatePrintHtml("<p>x</p>", { pageMargin: "15mm" });
    expect(html).toContain("margin: 15mm");
  });

  it("supports extra CSS injection", () => {
    const html = generatePrintHtml("<p>x</p>", { extraCss: "body { color: red; }" });
    expect(html).toContain("color: red");
  });
});

describe("renderLatexDocument", () => {
  it("produces a complete HTML document from LaTeX source", () => {
    const html = renderLatexDocument("\\section{Intro}\nHello world.", { title: "My Doc" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<h2 class="latex-section">Intro</h2>');
    expect(html).toContain("Hello world.");
    expect(html).toContain("size: Letter");
  });
});

// ── buildPrintCss ─────────────────────────────────────────────────────────────
describe("buildPrintCss", () => {
  it("generates CSS with default Letter resume settings", () => {
    const css = buildPrintCss();
    expect(css).toContain("size: Letter");
    expect(css).toContain("margin: 0.5in");
    expect(css).toContain("font-size: 10pt");
    expect(css).toContain("font-variant: small-caps");
  });

  it("respects custom pageSize and pageMargin", () => {
    const css = buildPrintCss({ pageSize: "Letter", pageMargin: "1in" });
    expect(css).toContain("size: Letter");
    expect(css).toContain("margin: 1in");
  });
});

// ── Multi-page document ───────────────────────────────────────────────────────
describe("Multi-page document", () => {
  it("renders multiple sections without crashing", () => {
    const sections = Array.from({ length: 10 }, (_, i) =>
      `\\section{Section ${i + 1}}\nContent for section ${i + 1}.\n`
    ).join("\n");
    const html = renderLatex(sections);
    expect(html).toContain("Section 1");
    expect(html).toContain("Section 10");
  });

  it("inserts page breaks where requested", () => {
    const src = "Page 1 content\\newpage Page 2 content";
    const html = renderLatex(src);
    expect(html).toContain('<div class="page-break"></div>');
    expect(html).toContain("Page 1 content");
    expect(html).toContain("Page 2 content");
  });
});
