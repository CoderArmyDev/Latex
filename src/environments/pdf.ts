import { ASTNode, TextNode } from "../types/ast";
import { EnvironmentDefinition } from "./types";
import { EnvironmentRegistry } from "./registry";

function splitRows(children: ASTNode[]): ASTNode[][] {
  const rows: ASTNode[][] = [];
  let currentRow: ASTNode[] = [];

  for (const child of children) {
    if (child.type === "command" && child.name === "\\") {
      rows.push(currentRow);
      currentRow = [];
    } else {
      currentRow.push(child);
    }
  }

  if (
    currentRow.some(
      (n) => n.type !== "text" || (n as TextNode).value.trim() !== "",
    )
  ) {
    rows.push(currentRow);
  }

  return rows;
}

function splitCells(rowNodes: ASTNode[]): ASTNode[][] {
  const cells: ASTNode[][] = [];
  let currentCell: ASTNode[] = [];

  for (const node of rowNodes) {
    if (node.type !== "text" || !node.value.includes("&")) {
      currentCell.push(node);
      continue;
    }

    const parts = node.value.split("&");
    parts.forEach((part, index) => {
      if (index > 0) {
        cells.push(currentCell);
        currentCell = [];
      }
      if (part.length > 0) {
        currentCell.push({
          ...node,
          value: part,
        });
      }
    });
  }

  cells.push(currentCell);
  return cells;
}

// ── tabular ──────────────────────────────────────────────────────────────────
// Parses \\ row separators and & column separators from the child text nodes.
export const tabularEnvironment: EnvironmentDefinition = {
  name: "tabular",
  description: "Renders an HTML table",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const rows = splitRows(node.children);

    const renderRow = (rowNodes: ASTNode[], tag: "th" | "td"): string => {
      const cells = splitCells(rowNodes);
      return cells
        .map((cellNodes) => `<${tag}>${ctx.renderChildren(cellNodes).trim()}</${tag}>`)
        .join("");
    };

    if (rows.length === 0) return "<table></table>";

    const [headerRow, ...bodyRows] = rows;
    const thead = `<thead><tr>${renderRow(headerRow, "th")}</tr></thead>`;
    const tbody =
      bodyRows.length > 0
        ? `<tbody>${bodyRows.map((r) => `<tr>${renderRow(r, "td")}</tr>`).join("")}</tbody>`
        : "";

    return `<table class="latex-table">${thead}${tbody}</table>`;
  },
};

export const tabularStarEnvironment: EnvironmentDefinition = {
  name: "tabular*",
  description: "Renders a borderless tabular* layout",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const rows = splitRows(node.children);
    const renderedRows = rows
      .map((rowNodes) => {
        const cells = splitCells(rowNodes);
        const renderedCells = cells
          .map(
            (cellNodes, index) =>
              `<span class="latex-tabular-cell latex-tabular-cell-${index + 1}">${ctx
                .renderChildren(cellNodes)
                .trim()}</span>`,
          )
          .join("");
        return `<div class="latex-tabular-row">${renderedCells}</div>`;
      })
      .join("");

    return `<div class="latex-tabular-star">${renderedRows}</div>`;
  },
};

// ── table ─────────────────────────────────────────────────────────────────────
export const tableEnvironment: EnvironmentDefinition = {
  name: "table",
  description: "Float wrapper for tabular",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<figure class="latex-table-float avoid-break">${ctx.renderChildren(node.children)}</figure>`,
};

// ── figure ────────────────────────────────────────────────────────────────────
export const figureEnvironment: EnvironmentDefinition = {
  name: "figure",
  description: "Float wrapper for figures",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<figure class="latex-figure avoid-break">${ctx.renderChildren(node.children)}</figure>`,
};

// ── quote ─────────────────────────────────────────────────────────────────────
export const quoteEnvironment: EnvironmentDefinition = {
  name: "quote",
  description: "Block quote",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<blockquote class="latex-quote">${ctx.renderChildren(node.children)}</blockquote>`,
};

// ── quotation ─────────────────────────────────────────────────────────────────
export const quotationEnvironment: EnvironmentDefinition = {
  name: "quotation",
  description: "Block quotation",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<blockquote class="latex-quotation">${ctx.renderChildren(node.children)}</blockquote>`,
};

// ── verbatim ──────────────────────────────────────────────────────────────────
export const verbatimEnvironment: EnvironmentDefinition = {
  name: "verbatim",
  description: "Verbatim / preformatted text",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<pre class="latex-verbatim"><code>${ctx.renderChildren(node.children)}</code></pre>`,
};

// ── abstract ──────────────────────────────────────────────────────────────────
export const abstractEnvironment: EnvironmentDefinition = {
  name: "abstract",
  description: "Document abstract",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<section class="latex-abstract avoid-break"><h2>Abstract</h2>${ctx.renderChildren(node.children)}</section>`,
};

// ── equation (display math) ───────────────────────────────────────────────────
export const equationEnvironment: EnvironmentDefinition = {
  name: "equation",
  description: "Numbered display math",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const inner = ctx.renderChildren(node.children).trim();
    return `<div class="latex-equation avoid-break"><math display="block"><mrow><mtext>${inner}</mtext></mrow></math></div>`;
  },
};

// ── align ─────────────────────────────────────────────────────────────────────
export const alignEnvironment: EnvironmentDefinition = {
  name: "align",
  description: "Aligned display math",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const inner = ctx.renderChildren(node.children).trim();
    return `<div class="latex-align avoid-break"><math display="block"><mrow><mtext>${inner}</mtext></mrow></math></div>`;
  },
};

// ── align* ────────────────────────────────────────────────────────────────────
export const alignStarEnvironment: EnvironmentDefinition = {
  name: "align*",
  description: "Unnumbered aligned display math",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const inner = ctx.renderChildren(node.children).trim();
    return `<div class="latex-align avoid-break"><math display="block"><mrow><mtext>${inner}</mtext></mrow></math></div>`;
  },
};

export const pdfEnvironments: EnvironmentDefinition[] = [
  tabularEnvironment,
  tabularStarEnvironment,
  tableEnvironment,
  figureEnvironment,
  quoteEnvironment,
  quotationEnvironment,
  verbatimEnvironment,
  abstractEnvironment,
  equationEnvironment,
  alignEnvironment,
  alignStarEnvironment,
];

export function registerPdfEnvironments(registry: EnvironmentRegistry): void {
  for (const env of pdfEnvironments) {
    registry.register(env, { override: true });
  }
}
