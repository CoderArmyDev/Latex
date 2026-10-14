import { ASTNode } from "../types/ast";
import { EnvironmentDefinition } from "./types";
import { EnvironmentRegistry } from "./registry";

// ── description list ──────────────────────────────────────────────────────────
export const descriptionEnvironment: EnvironmentDefinition = {
  name: "description",
  description: "Description list with <dl>",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const items: Array<{ label: ASTNode[]; body: ASTNode[] }> = [];
    let currentLabel: ASTNode[] | null = null;
    let currentBody: ASTNode[] = [];

    for (const child of node.children) {
      if (child.type === "command" && child.name === "item") {
        if (currentLabel !== null) items.push({ label: currentLabel, body: currentBody });
        // optional arg is the label
        const optArg = (child.args ?? []).find((a) => a.type === "optional");
        currentLabel = optArg ? optArg.children : [];
        currentBody = [];
      } else if (currentLabel !== null) {
        currentBody.push(child);
      }
    }
    if (currentLabel !== null) items.push({ label: currentLabel, body: currentBody });

    if (items.length === 0) return `<dl>${ctx.renderChildren(node.children)}</dl>`;

    const rows = items
      .map(({ label, body }) =>
        `<dt>${ctx.renderChildren(label)}</dt><dd>${ctx.renderChildren(body).trim()}</dd>`
      )
      .join("");
    return `<dl class="latex-description">${rows}</dl>`;
  },
};

// ── alignment environments ────────────────────────────────────────────────────
export const flushLeftEnvironment: EnvironmentDefinition = {
  name: "flushleft",
  description: "Left-aligned content",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<div style="text-align:left">${ctx.renderChildren(node.children)}</div>`,
};

export const flushRightEnvironment: EnvironmentDefinition = {
  name: "flushright",
  description: "Right-aligned content",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<div style="text-align:right">${ctx.renderChildren(node.children)}</div>`,
};

// ── minipage ──────────────────────────────────────────────────────────────────
export const minipageEnvironment: EnvironmentDefinition = {
  name: "minipage",
  description: "Minipage box",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const reqArg = (node.args ?? []).find((a) => a.type === "required");
    const w = reqArg?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "auto";
    return `<div style="display:inline-block;width:${w};vertical-align:top">${ctx.renderChildren(node.children)}</div>`;
  },
};

// ── code listing environments ─────────────────────────────────────────────────
export const lstlistingEnvironment: EnvironmentDefinition = {
  name: "lstlisting",
  description: "Code listing block",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<pre class="latex-lstlisting"><code>${ctx.renderChildren(node.children)}</code></pre>`,
};

export const mintedEnvironment: EnvironmentDefinition = {
  name: "minted",
  description: "Minted syntax-highlighted code block",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const langArg = (node.args ?? []).find((a) => a.type === "required");
    const lang = langArg?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "";
    return `<pre class="latex-minted" data-lang="${lang}"><code>${ctx.renderChildren(node.children)}</code></pre>`;
  },
};

// ── math environments ─────────────────────────────────────────────────────────
const mathEnvWrapper = (name: string, desc: string) => ({
  name,
  description: desc,
  status: "SUPPORTED" as const,
  render: (node: import("../types/ast").EnvironmentNode, ctx: import("./types").EnvironmentRenderContext) => {
    const inner = ctx.renderChildren(node.children).trim();
    return `<div class="latex-math-env avoid-break"><math display="block"><mrow><mtext>${inner}</mtext></mrow></math></div>`;
  },
});

export const gatherEnvironment = mathEnvWrapper("gather", "Centered equations");
export const gatherStarEnvironment = mathEnvWrapper("gather*", "Unnumbered centered equations");
export const equationStarEnvironment = mathEnvWrapper("equation*", "Unnumbered equation");
export const multlineEnvironment = mathEnvWrapper("multline", "Multi-line equation");
export const multlineStarEnvironment = mathEnvWrapper("multline*", "Unnumbered multi-line equation");

export const matrixEnvironment = mathEnvWrapper("matrix", "Matrix without brackets");
export const pmatrixEnvironment = mathEnvWrapper("pmatrix", "Parenthesized matrix");
export const bmatrixEnvironment = mathEnvWrapper("bmatrix", "Square-bracket matrix");
export const BmatrixEnvironment = mathEnvWrapper("Bmatrix", "Curly-bracket matrix");
export const vmatrixEnvironment = mathEnvWrapper("vmatrix", "Determinant matrix");
export const VmatrixEnvironment = mathEnvWrapper("Vmatrix", "Double-bar matrix");
export const casesEnvironment = mathEnvWrapper("cases", "Piecewise cases");
export const splitEnvironment = mathEnvWrapper("split", "Split equation");
export const subequationsEnvironment = mathEnvWrapper("subequations", "Sub-equations");

// ── bibliography ──────────────────────────────────────────────────────────────
export const thebibliographyEnvironment: EnvironmentDefinition = {
  name: "thebibliography",
  description: "Manual bibliography",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<section class="latex-bibliography"><h2>References</h2><ol>${ctx.renderChildren(node.children)}</ol></section>`,
};

// ── comment (block comment) ───────────────────────────────────────────────────
export const commentEnvironment: EnvironmentDefinition = {
  name: "comment",
  description: "Block comment — content suppressed",
  status: "SUPPORTED",
  render: () => "",
};

// ── tabularx ──────────────────────────────────────────────────────────────────
export const tabularxEnvironment: EnvironmentDefinition = {
  name: "tabularx",
  description: "Flexible-width table (treated as tabular)",
  status: "SUPPORTED",
  render: (node, ctx) => {
    // Reuse tabular rendering logic — strip the first required arg (width)
    // and treat the rest as a normal tabular
    const rows: ASTNode[][] = [];
    let currentRow: ASTNode[] = [];

    for (const child of node.children) {
      if (child.type === "command" && child.name === "\\") {
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentRow.push(child);
      }
    }
    if (currentRow.some((n) => n.type !== "text" || (n as import("../types/ast").TextNode).value.trim() !== "")) {
      rows.push(currentRow);
    }

    const renderRow = (rowNodes: ASTNode[], tag: "th" | "td"): string => {
      const cells: ASTNode[][] = [];
      let currentCell: ASTNode[] = [];
      for (const n of rowNodes) {
        if (n.type === "text" && n.value === "&") {
          cells.push(currentCell);
          currentCell = [];
        } else {
          currentCell.push(n);
        }
      }
      cells.push(currentCell);
      return cells.map((c) => `<${tag}>${ctx.renderChildren(c).trim()}</${tag}>`).join("");
    };

    if (rows.length === 0) return "<table></table>";
    const [headerRow, ...bodyRows] = rows;
    const thead = `<thead><tr>${renderRow(headerRow, "th")}</tr></thead>`;
    const tbody = bodyRows.length > 0
      ? `<tbody>${bodyRows.map((r) => `<tr>${renderRow(r, "td")}</tr>`).join("")}</tbody>`
      : "";
    return `<table class="latex-table latex-tabularx">${thead}${tbody}</table>`;
  },
};

// ── multicols ─────────────────────────────────────────────────────────────────
export const multicolsEnvironment: EnvironmentDefinition = {
  name: "multicols",
  description: "Multi-column layout",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const reqArg = (node.args ?? []).find((a) => a.type === "required");
    const cols = reqArg?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "2";
    return `<div style="column-count:${cols};column-gap:2em">${ctx.renderChildren(node.children)}</div>`;
  },
};

// ── titlepage ─────────────────────────────────────────────────────────────────
export const titlepageEnvironment: EnvironmentDefinition = {
  name: "titlepage",
  description: "Title page",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<div class="latex-titlepage page-break">${ctx.renderChildren(node.children)}</div>`,
};

export const extraEnvironments: EnvironmentDefinition[] = [
  descriptionEnvironment,
  flushLeftEnvironment,
  flushRightEnvironment,
  minipageEnvironment,
  lstlistingEnvironment,
  mintedEnvironment,
  gatherEnvironment,
  gatherStarEnvironment,
  equationStarEnvironment,
  multlineEnvironment,
  multlineStarEnvironment,
  matrixEnvironment,
  pmatrixEnvironment,
  bmatrixEnvironment,
  BmatrixEnvironment,
  vmatrixEnvironment,
  VmatrixEnvironment,
  casesEnvironment,
  splitEnvironment,
  subequationsEnvironment,
  thebibliographyEnvironment,
  commentEnvironment,
  tabularxEnvironment,
  multicolsEnvironment,
  titlepageEnvironment,
];

export function registerExtraEnvironments(registry: EnvironmentRegistry): void {
  for (const env of extraEnvironments) {
    registry.register(env, { override: true });
  }
}
