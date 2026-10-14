/**
 * PDF document layer.
 *
 * Wraps rendered HTML body content in a complete, print-ready HTML document
 * with print-ready page CSS. This output can be fed directly to a headless browser
 * (Puppeteer / Playwright) to produce a PDF.
 *
 * The parser and renderer are intentionally unaware of this layer.
 */

export interface DocumentOptions {
  title?: string;
  /** Page size, defaults to "Letter" */
  pageSize?: string;
  /** Page margins, defaults to "0.5in" */
  pageMargin?: string;
  /** Additional CSS to inject */
  extraCss?: string;
}

/**
 * Build the print-ready CSS for PDF output.
 */
export function buildPrintCss(options: DocumentOptions = {}): string {
  const pageSize = options.pageSize ?? "Letter";
  const pageMargin = options.pageMargin ?? "0.5in";

  return `
    /* ── Reset ─────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; }

    /* ── Page layout ────────────────────────────────────────────── */
    @page {
      size: ${pageSize};
      margin: ${pageMargin};
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
      line-height: 1.12;
      color: #000;
      background: #fff;
    }

    /* ── Typography ─────────────────────────────────────────────── */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 0.75em;
      margin-bottom: 0.25em;
      line-height: 1.05;
      break-after: avoid;
    }

    h1.latex-title   { font-size: 2em;   text-align: center; }
    h1.latex-chapter { font-size: 1.8em; }
    h2.latex-section {
      font-size: 13.5pt;
      font-weight: normal;
      font-variant: small-caps;
      letter-spacing: 0;
      text-transform: none;
      border-bottom: 0.5pt solid #000;
      padding-bottom: 1pt;
      margin-top: 0.65em;
      margin-bottom: 0.28em;
    }
    h3.latex-subsection    { font-size: 1.2em; }
    h4.latex-subsubsection { font-size: 1.1em; }

    p.latex-author { text-align: center; font-size: 1.1em; }
    p.latex-date   { text-align: center; color: #444; }

    p {
      margin: 0.25em 0;
      text-align: left;
    }

    /* ── Lists ──────────────────────────────────────────────────── */
    ul, ol {
      margin: 0.18em 0 0.35em 1.45em;
      padding: 0;
      list-style-type: disc;
    }

    li {
      margin: 0.12em 0;
      padding-left: 0.15em;
    }

    ul ul,
    ol ol,
    ul ol,
    ol ul {
      margin-top: 0.12em;
      margin-bottom: 0.2em;
      margin-left: 1.25em;
      list-style-type: disc;
    }

    ul.latex-list-no-label {
      list-style: none;
      margin-left: 0;
    }

    ul.latex-list-no-label > li {
      list-style: none;
      padding-left: 0;
    }

    ul.latex-list-no-label ul {
      list-style-type: disc;
      margin-left: 1.35em;
    }

    /* ── Tables ─────────────────────────────────────────────────── */
    table.latex-table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
      font-size: 11pt;
    }

    table.latex-table th,
    table.latex-table td {
      border: 1px solid #000;
      padding: 4pt 8pt;
      text-align: left;
    }

    table.latex-table th {
      background: #f0f0f0;
      font-weight: bold;
    }

    .latex-tabular-star {
      width: 100%;
      margin: 0;
    }

    .latex-tabular-row {
      display: flex;
      justify-content: space-between;
      gap: 1.25em;
      width: 100%;
      margin: 0.05em 0;
    }

    .latex-tabular-cell {
      min-width: 0;
    }

    .latex-tabular-cell:last-child {
      margin-left: auto;
      text-align: right;
      white-space: nowrap;
    }

    .latex-tabular-cell:first-child strong {
      font-size: 10.5pt;
    }

    /* ── Figures ────────────────────────────────────────────────── */
    figure.latex-figure,
    figure.latex-table-float {
      margin: 1em auto;
      text-align: center;
    }

    figcaption.latex-caption {
      font-size: 10pt;
      color: #333;
      margin-top: 4pt;
    }

    /* ── Images ─────────────────────────────────────────────────── */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    /* ── Math ───────────────────────────────────────────────────── */
    .latex-equation,
    .latex-align {
      margin: 1em 0;
      text-align: center;
      overflow-x: auto;
    }

    math[display="block"] {
      display: block;
      margin: 0 auto;
    }

    /* ── Code / verbatim ────────────────────────────────────────── */
    pre.latex-verbatim {
      background: #f8f8f8;
      border: 1px solid #ddd;
      padding: 8pt;
      font-size: 10pt;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 10pt;
    }

    /* ── Quotes ─────────────────────────────────────────────────── */
    blockquote.latex-quote,
    blockquote.latex-quotation {
      margin: 1em 2em;
      padding-left: 1em;
      border-left: 3px solid #ccc;
      color: #333;
    }

    /* ── Abstract ───────────────────────────────────────────────── */
    section.latex-abstract {
      margin: 1.5em 3em;
      padding: 1em;
      border: 1px solid #ccc;
    }

    section.latex-abstract h2 {
      text-align: center;
      font-size: 1.1em;
    }

    /* ── Links ──────────────────────────────────────────────────── */
    a {
      color: #000;
      text-decoration: underline;
    }

    /* ── Footnotes ──────────────────────────────────────────────── */
    sup.latex-footnote {
      cursor: help;
      color: #555;
    }

    /* ── Centering ──────────────────────────────────────────────── */
    .text-center {
      text-align: center;
      line-height: 1.15;
      margin-bottom: 0.75em;
    }

    .text-center strong {
      display: inline-block;
      font-size: 24pt;
      line-height: 1;
      margin-bottom: 0.12em;
    }

    /* ── Page breaks ────────────────────────────────────────────── */
    @media print {
      .page-break {
        break-before: page;
        page-break-before: always;
      }

      .avoid-break {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      h1, h2, h3, h4 {
        break-after: avoid;
        page-break-after: avoid;
      }

      table.latex-table {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      img {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

    /* ── Screen preview (mirrors print layout) ──────────────────── */
    @media screen {
      body {
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
        box-shadow: 0 0 8px rgba(0,0,0,0.15);
        min-height: 11in;
      }

      .page-break {
        border-top: 2px dashed #aaa;
        margin: 2em 0;
      }
    }

    ${options.extraCss ?? ""}
  `.trim();
}

/**
 * Wrap an HTML body fragment in a complete, print-ready HTML document.
 */
export function generatePrintHtml(bodyHtml: string, options: DocumentOptions = {}): string {
  const title = options.title ?? "Document";
  const css = buildPrintCss(options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Alias kept for backwards compatibility / explicit naming.
 */
export const renderDocument = generatePrintHtml;
