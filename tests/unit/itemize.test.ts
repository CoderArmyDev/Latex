import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { renderHtml } from "../../src/renderers/html";

describe("Itemize Environment", () => {
  it("should render a basic itemize list with multiple items", () => {
    const source = `\\begin{itemize}
\\item First item
\\item Second item
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe("<ul><li>First item</li><li>Second item</li></ul>");
  });

  it("should render itemize with formatted contents inside items", () => {
    const source = `\\begin{itemize}
\\item \\textbf{Bold item}
\\item \\textit{Italic item} with \\texttt{code}
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe(
      "<ul><li><strong>Bold item</strong></li><li><em>Italic item</em> with <code>code</code></li></ul>"
    );
  });

  it("should render nested itemize environments", () => {
    const source = `\\begin{itemize}
\\item Main topic
\\begin{itemize}
\\item Subtopic A
\\item Subtopic B
\\end{itemize}
\\item Another main topic
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe(
      "<ul><li>Main topic\n<ul><li>Subtopic A</li><li>Subtopic B</li></ul></li><li>Another main topic</li></ul>"
    );
  });

  it("should render an empty itemize list", () => {
    const source = "\\begin{itemize}\\end{itemize}";
    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe("<ul></ul>");
  });

  it("should escape special HTML characters inside itemize items", () => {
    const source = `\\begin{itemize}
\\item Item <1> & Item <2>
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe("<ul><li>Item &lt;1&gt; &amp; Item &lt;2&gt;</li></ul>");
  });

  it("should detect item commands nested inside formatting commands", () => {
    const source = `\\begin{itemize}
\\small{\\item{\\textbf{Languages}{: C, C++, SQL}}}
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe(
      "<ul><li><strong>Languages</strong>: C, C++, SQL</li></ul>",
    );
  });

  it("should mark itemize lists with label={} as no-label lists", () => {
    const source = `\\begin{itemize}[leftmargin=0.15in, label={}]
\\item Heading row
\\end{itemize}`;

    const ast = parse(source);
    const html = renderHtml(ast);

    expect(html).toBe(
      '<ul class="latex-list-no-label"><li>Heading row</li></ul>',
    );
  });
});
