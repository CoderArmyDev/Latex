# LatexLite

A lightweight JavaScript/TypeScript engine that parses a subset of LaTeX syntax and renders it to clean, print-ready HTML — with zero runtime dependencies.

Built for use cases like **resume builders**, **academic report generators**, and **document editors** that need reliable LaTeX → HTML → PDF output without a full TeX installation.

```
LaTeX source → Tokenizer → Parser → AST → HTML → PDF
```

---

## Install

```bash
npm install latexlite
# or
yarn add latexlite
```

---

## Quick Start

```ts
import { renderLatex } from "latexlite";

const html = renderLatex("\\textbf{Hello} \\textit{world}");
// → <strong>Hello</strong> <em>world</em>
```

---

## Table of Contents

- [Core API](#core-api)
- [PDF Generation](#pdf-generation)
- [Supported LaTeX](#supported-latex)
  - [Text Formatting](#text-formatting)
  - [Font Sizes](#font-sizes)
  - [Document Structure](#document-structure)
  - [Lists](#lists)
  - [Tables](#tables)
  - [Math](#math)
  - [Images and Figures](#images-and-figures)
  - [Links](#links)
  - [Colors](#colors)
  - [Spacing and Layout](#spacing-and-layout)
  - [Boxes](#boxes)
  - [References and Bibliography](#references-and-bibliography)
  - [Environments](#environments)
  - [Escaped Symbols](#escaped-symbols)
  - [Comments](#comments)
- [Advanced Usage](#advanced-usage)
  - [Unsupported Command Policies](#unsupported-command-policies)
  - [Custom Commands](#custom-commands)
  - [Custom Environments](#custom-environments)
  - [Inspect Capabilities](#inspect-capabilities)
  - [Access the AST](#access-the-ast)
- [Security](#security)
- [What LatexLite Is Not](#what-latexlite-is-not)
- [TypeScript](#typescript)
- [License](#license)

---

## Core API

### `renderLatex(source, options?)`

Parse LaTeX source and render it to an HTML string.

```ts
import { renderLatex } from "latexlite";

const html = renderLatex("\\section{Introduction}\nHello world.");
// → <h2 class="latex-section">Introduction</h2>\nHello world.
```

---

### `parseLatex(source)`

Parse LaTeX source into an AST. Useful when you want to inspect or transform the document before rendering.

```ts
import { parseLatex } from "latexlite";

const ast = parseLatex("\\textbf{Hello}");
// → DocumentNode { type: "document", children: [...] }
```

---

### `renderAst(ast, options?)`

Render a pre-parsed AST to HTML.

```ts
import { parseLatex, renderAst } from "latexlite";

const ast = parseLatex("\\textbf{Hello}");
const html = renderAst(ast);
// → <strong>Hello</strong>
```

---

### `renderLatexDocument(source, options?)`

Parse LaTeX and return a **complete `<!DOCTYPE html>` document** with A4 print CSS included. Feed this directly to Puppeteer or Playwright to generate a PDF.

```ts
import { renderLatexDocument } from "latexlite";

const fullHtml = renderLatexDocument("\\section{Intro}\nHello.", {
  title: "My Document",
});
// → complete HTML page with @page A4 CSS, ready for PDF export
```

---

## PDF Generation

LatexLite produces print-ready HTML. You bring your own headless browser for the final PDF step.

### With Puppeteer

```ts
import { renderLatexDocument } from "latexlite";
import puppeteer from "puppeteer";

const html = renderLatexDocument(myLatexSource, { title: "Resume" });

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
await page.pdf({
  path: "output.pdf",
  format: "A4",
  printBackground: true,
});
await browser.close();
```

### With Playwright

```ts
import { renderLatexDocument } from "latexlite";
import { chromium } from "playwright";

const html = renderLatexDocument(myLatexSource, { title: "Report" });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({ path: "output.pdf", format: "A4" });
await browser.close();
```

### Custom page settings

```ts
import { generatePrintHtml, renderLatex } from "latexlite";

const body = renderLatex(myLatexSource);
const html = generatePrintHtml(body, {
  title: "My Doc",
  pageSize: "Letter",
  pageMargin: "15mm",
  extraCss: "body { font-family: Arial, sans-serif; }",
});
```

---

## Supported LaTeX

### Text Formatting

| LaTeX | HTML output |
|---|---|
| `\textbf{bold}` | `<strong>bold</strong>` |
| `\textit{italic}` | `<em>italic</em>` |
| `\emph{emphasis}` | `<em>emphasis</em>` |
| `\texttt{code}` | `<code>code</code>` |
| `\underline{text}` | `<u>text</u>` |
| `\textsl{slanted}` | `<span style="font-style:oblique">slanted</span>` |
| `\textsc{Small Caps}` | `<span style="font-variant:small-caps">Small Caps</span>` |
| `\textrm{roman}` | `<span style="font-family:serif">roman</span>` |
| `\textsf{sans}` | `<span style="font-family:sans-serif">sans</span>` |
| `\textnormal{normal}` | resets font weight and style |
| `\textsuperscript{x}` | `<sup>x</sup>` |
| `\textsubscript{x}` | `<sub>x</sub>` |
| `\verb\|code\|` | `<code>code</code>` |

---

### Font Sizes

These commands apply to the content that follows them inside a group `{...}`.

```latex
{\tiny tiny text}
{\small small text}
{\large large text}
{\Large larger text}
{\LARGE very large}
{\huge huge text}
{\Huge largest}
```

Supported sizes: `\tiny`, `\scriptsize`, `\footnotesize`, `\small`, `\normalsize`, `\large`, `\Large`, `\LARGE`, `\huge`, `\Huge`

---

### Document Structure

```latex
\documentclass{article}       % silently ignored
\usepackage{geometry}         % silently ignored

\title{My Document}
\author{Jane Doe}
\date{2025}
\maketitle

\chapter{Introduction}
\section{Background}
\subsection{Details}
\subsubsection{More Details}
\paragraph{A paragraph heading}
\tableofcontents              % silently ignored
```

| Command | HTML output |
|---|---|
| `\title{...}` | `<h1 class="latex-title">` |
| `\chapter{...}` | `<h1 class="latex-chapter">` |
| `\section{...}` | `<h2 class="latex-section">` |
| `\subsection{...}` | `<h3 class="latex-subsection">` |
| `\subsubsection{...}` | `<h4 class="latex-subsubsection">` |
| `\paragraph{...}` | `<h5 class="latex-paragraph">` |
| `\author{...}` | `<p class="latex-author">` |
| `\date{...}` | `<p class="latex-date">` |

Starred variants like `\section*{...}` are also supported.

---

### Lists

**Unordered list:**

```latex
\begin{itemize}
  \item First item
  \item \textbf{Bold item}
  \item Nested:
  \begin{itemize}
    \item Sub-item
  \end{itemize}
\end{itemize}
```

**Ordered list:**

```latex
\begin{enumerate}
  \item First
  \item Second
\end{enumerate}
```

**Description list:**

```latex
\begin{description}
  \item[Term] Definition of the term.
  \item[Another] Another definition.
\end{description}
```

---

### Tables

```latex
\begin{tabular}{|c|c|c|}
  Name & Age & City \\
  Alice & 30 & London \\
  Bob & 25 & Paris
\end{tabular}
```

Renders as a proper `<table>` with `<thead>` and `<tbody>`. The first row becomes the header.

Wrap in `\begin{table}` for a float container:

```latex
\begin{table}
  \begin{tabular}{ll}
    Key & Value \\
    foo & bar
  \end{tabular}
  \caption{My table}
\end{table}
```

`\begin{tabularx}` is also supported and treated identically to `tabular`.

---

### Math

**Inline math** using `$...$`:

```latex
The formula $x^2 + y^2 = z^2$ is well known.
```

**Display math** using `\[...\]` or `$$...$$`:

```latex
\[
  E = mc^2
\]
```

**Numbered equation:**

```latex
\begin{equation}
  \frac{a}{b} + \sqrt{x}
\end{equation}
```

**Unnumbered equation:**

```latex
\begin{equation*}
  \sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\end{equation*}
```

**Aligned equations:**

```latex
\begin{align}
  f(x) &= x^2 \\
  g(x) &= x^3
\end{align}
```

Math is rendered as **MathML** (`<math>` elements). Modern browsers display MathML natively. For PDF output via Puppeteer/Playwright, MathML renders correctly in Chromium.

**Supported math commands:** `\frac`, `\sqrt`, `\sum`, `\prod`, `\int`, `\lim`, `\text`, `\mathbf`, `\mathrm`, `\mathbb`, `\mathcal`, `\mathfrak`

**Greek letters:** `\alpha`, `\beta`, `\gamma`, `\delta`, `\epsilon`, `\theta`, `\lambda`, `\mu`, `\pi`, `\sigma`, `\phi`, `\omega`, `\Gamma`, `\Delta`, `\Sigma`, `\Omega` (and more)

**Operators and relations:** `\infty`, `\partial`, `\nabla`, `\cdot`, `\times`, `\pm`, `\neq`, `\leq`, `\geq`, `\approx`, `\equiv`, `\in`, `\subset`, `\cup`, `\cap`, `\forall`, `\exists`, `\therefore`

**Arrows:** `\rightarrow`, `\leftarrow`, `\Rightarrow`, `\Leftrightarrow`, `\to`, `\mapsto`, `\uparrow`, `\downarrow`

**Ellipsis:** `\ldots`, `\cdots`, `\vdots`, `\ddots`

---

### Images and Figures

```latex
\includegraphics{photo.jpg}
\includegraphics[width=0.5\textwidth]{photo.jpg}
\includegraphics[width=0.8\textwidth]{diagram.png}
```

The `width` option accepts a fraction of `\textwidth` (e.g. `0.5\textwidth` → `max-width: 50%`). Images never overflow the page.

Wrap in a figure environment for captions:

```latex
\begin{figure}
  \includegraphics[width=0.6\textwidth]{chart.png}
  \caption{Monthly revenue}
  \label{fig:revenue}
\end{figure}
```

---

### Links

```latex
\href{https://example.com}{Visit Example}
\url{https://example.com}
```

`javascript:`, `vbscript:`, and `data:` URLs are automatically blocked and replaced with `#`.

---

### Colors

```latex
\textcolor{red}{This text is red}
\textcolor{#3498db}{Custom hex color}
\colorbox{yellow}{Highlighted text}
\fcolorbox{red}{yellow}{Framed and highlighted}
\definecolor{myblue}{rgb}{0,0,1}   % silently ignored
```

---

### Spacing and Layout

```latex
\newpage          % page break
\pagebreak        % page break
\clearpage        % page break

\\                % line break
\newline          % line break
\linebreak        % line break

\noindent         % suppress indent
\par              % paragraph break
\indent           % explicit indent

\hspace{1cm}      % horizontal space (renders as &nbsp;)
\vspace{1cm}      % vertical space
\quad             % em space
\qquad            % double em space
\hfill            % push content apart

\smallskip        % small vertical gap
\medskip          % medium vertical gap
\bigskip          % large vertical gap
```

---

### Boxes

```latex
\fbox{Boxed text}
\framebox{Framed text}
\mbox{No line break here}
\parbox{5cm}{Fixed width paragraph content}
\makebox[3cm]{Centered in box}
```

---

### References and Bibliography

```latex
\label{sec:intro}
\ref{sec:intro}
\pageref{sec:intro}
\autoref{sec:intro}
\cite{knuth1984}
\footnote{This is a footnote.}
```

Manual bibliography:

```latex
\begin{thebibliography}{9}
  \bibitem{knuth1984}
    Donald Knuth, \textit{The TeXbook}, 1984.
\end{thebibliography}
```

---

### Environments

| Environment | Renders as |
|---|---|
| `document` | renders children |
| `center` | `<div style="text-align:center">` |
| `flushleft` | `<div style="text-align:left">` |
| `flushright` | `<div style="text-align:right">` |
| `itemize` | `<ul>` |
| `enumerate` | `<ol>` |
| `description` | `<dl>` |
| `tabular` | `<table>` |
| `tabularx` | `<table>` |
| `table` | `<figure class="latex-table-float">` |
| `figure` | `<figure class="latex-figure">` |
| `minipage` | `<div style="display:inline-block">` |
| `quote` | `<blockquote>` |
| `quotation` | `<blockquote>` |
| `verbatim` | `<pre><code>` |
| `lstlisting` | `<pre><code>` |
| `minted` | `<pre><code data-lang="...">` |
| `abstract` | `<section class="latex-abstract">` |
| `equation` | MathML display block |
| `equation*` | MathML display block |
| `align` | MathML display block |
| `align*` | MathML display block |
| `gather` | MathML display block |
| `gather*` | MathML display block |
| `matrix` / `pmatrix` / `bmatrix` | MathML display block |
| `cases` | MathML display block |
| `thebibliography` | `<section class="latex-bibliography">` |
| `comment` | suppressed entirely |
| `multicols` | `<div style="column-count:N">` |
| `titlepage` | `<div class="latex-titlepage">` |

---

### Escaped Symbols

```latex
\%   →  %
\$   →  $
\#   →  #
\&   →  &amp;
\_   →  _
\{   →  {
\}   →  }
\\   →  <br />
```

---

### Comments

```latex
This is visible. % This entire line comment is stripped
This is also visible.
```

Everything from `%` to the end of the line is silently removed before parsing.

---

## Advanced Usage

### Unsupported Command Policies

Control what happens when an unknown command is encountered:

```ts
import { renderLatex } from "latexlite";

// Default: render the command's children
renderLatex("\\unknown{text}");
// → "text"

// Ignore: drop the command and its children entirely
renderLatex("\\unknown{text}", { unsupportedPolicy: "ignore" });
// → ""

// Comment: emit an HTML comment before the children
renderLatex("\\unknown{text}", { unsupportedPolicy: "comment" });
// → "<!-- unsupported command \unknown -->text"

// Warn: call a callback, then render children
renderLatex("\\unknown{text}", {
  unsupportedPolicy: "warn",
  onWarn: (w) => console.warn(`[latexlite] ${w.message}`),
});

// Throw: throw a LatexUnsupportedSyntaxError
renderLatex("\\unknown{text}", { unsupportedPolicy: "throw" });
```

---

### Custom Commands

Register your own commands on top of the defaults:

```ts
import { renderLatex, createDefaultCommandRegistry } from "latexlite";

const registry = createDefaultCommandRegistry();

registry.register({
  name: "highlight",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<mark>${ctx.renderChildren(node.children)}</mark>`,
});

const html = renderLatex("\\highlight{important}", { commandRegistry: registry });
// → <mark>important</mark>
```

---

### Custom Environments

```ts
import { renderLatex, createDefaultEnvironmentRegistry } from "latexlite";

const envRegistry = createDefaultEnvironmentRegistry();

envRegistry.register({
  name: "warning",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<div class="warning">${ctx.renderChildren(node.children)}</div>`,
});

const html = renderLatex(
  "\\begin{warning}\nBe careful!\n\\end{warning}",
  { environmentRegistry: envRegistry }
);
// → <div class="warning">Be careful!</div>
```

---

### Inspect Capabilities

Check which commands and environments in a document are supported before rendering:

```ts
import { parseLatex, inspectCapabilities } from "latexlite";

const ast = parseLatex("\\section{Intro}\n\\customMacro{value}");
const report = inspectCapabilities(ast);

console.log(report.supported);          // ["\\section"]
console.log(report.unsupported);        // ["\\customMacro"]
console.log(report.isFullySupported);   // false
```

---

### Access the AST

The AST is fully typed and available for custom processing:

```ts
import { parseLatex } from "latexlite";
import type { DocumentNode, CommandNode, MathNode } from "latexlite";

const ast = parseLatex("\\textbf{Hello} $x^2$");

for (const node of ast.children) {
  if (node.type === "command") {
    console.log(node.name, node.children);
  }
  if (node.type === "math") {
    console.log(node.mode, node.value); // "inline", "x^2"
  }
}
```

---

## Security

LatexLite is designed to be safe for user-controlled input:

- All text content is HTML-escaped before rendering — `<`, `>`, `&`, `"`, `'` are never passed through raw
- `javascript:`, `vbscript:`, and `data:` URLs in `\href` and `\url` are blocked
- `eval()` is never used
- No JavaScript from LaTeX source is ever executed
- `\begin{comment}...\end{comment}` content is suppressed entirely
- `%` line comments are stripped at the tokenizer level

---

## What LatexLite Is Not

LatexLite is a **LaTeX subset renderer**, not a full TeX engine.

It does **not** support:

- `\newcommand` / `\def` macro expansion (commands are silently ignored)
- Counter-based numbering (`\ref` renders the label key, not a resolved number)
- Cross-reference resolution
- BibTeX / bibliography sorting
- Font loading or exact LaTeX typography
- TikZ, PGF, or any drawing packages
- Custom package loading

If you need full LaTeX compilation, use a server-side TeX distribution (e.g. `pdflatex`, `xelatex`) or a WASM-based engine.

---

## TypeScript

LatexLite is written in TypeScript and ships with full type declarations.

```ts
import type {
  DocumentNode,
  ASTNode,
  CommandNode,
  EnvironmentNode,
  MathNode,
  TextNode,
  RenderOptions,
  CommandDefinition,
  EnvironmentDefinition,
  CapabilityReport,
} from "latexlite";
```

---

## License

MIT © [CoderArmy](https://github.com/CoderArmyDev)
