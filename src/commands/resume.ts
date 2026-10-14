import { CommandDefinition } from "./types";
import { CommandRegistry } from "./registry";
import { escapeHtml } from "../utils/escapeHtml";

function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Disallow javascript:, vbscript:, data:text/html, etc.
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return "#";
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("#")) {
    return escapeHtml(trimmed);
  }
  if (/^(?:www\.|[a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:[/:?#]|$)/i.test(trimmed)) {
    return escapeHtml(`https://${trimmed}`);
  }
  return escapeHtml(trimmed);
}

function renderAnchor(href: string, labelHtml: string): string {
  return `<a class="latex-link" href="${href}">${labelHtml}</a>`;
}

export const itemCommand: CommandDefinition = {
  name: "item",
  description: "List item",
  status: "SUPPORTED",
  render: (node, ctx) => ctx.renderChildren(node.children),
};

export const lineBreakCommand: CommandDefinition = {
  name: "\\",
  description: "Line break",
  status: "SUPPORTED",
  render: () => "<br />",
};

export const newlineCommand: CommandDefinition = {
  name: "newline",
  description: "Line break",
  status: "SUPPORTED",
  render: () => "<br />",
};

export const sectionCommand: CommandDefinition = {
  name: "section",
  description: "Section heading",
  status: "SUPPORTED",
  render: (node, ctx) => `<h2 class="latex-section">${ctx.renderChildren(node.children)}</h2>`,
};

export const subsectionCommand: CommandDefinition = {
  name: "subsection",
  description: "Sub-section heading",
  status: "SUPPORTED",
  render: (node, ctx) => `<h3 class="latex-subsection">${ctx.renderChildren(node.children)}</h3>`,
};

export const subsubsectionCommand: CommandDefinition = {
  name: "subsubsection",
  description: "Sub-sub-section heading",
  status: "SUPPORTED",
  render: (node, ctx) => `<h4 class="latex-subsubsection">${ctx.renderChildren(node.children)}</h4>`,
};

export const chapterCommand: CommandDefinition = {
  name: "chapter",
  description: "Chapter heading",
  status: "SUPPORTED",
  render: (node, ctx) => `<h1 class="latex-chapter">${ctx.renderChildren(node.children)}</h1>`,
};

export const titleCommand: CommandDefinition = {
  name: "title",
  description: "Document title",
  status: "SUPPORTED",
  render: (node, ctx) => `<h1 class="latex-title">${ctx.renderChildren(node.children)}</h1>`,
};

export const authorCommand: CommandDefinition = {
  name: "author",
  description: "Document author",
  status: "SUPPORTED",
  render: (node, ctx) => `<p class="latex-author">${ctx.renderChildren(node.children)}</p>`,
};

export const dateCommand: CommandDefinition = {
  name: "date",
  description: "Document date",
  status: "SUPPORTED",
  render: (node, ctx) => `<p class="latex-date">${ctx.renderChildren(node.children)}</p>`,
};

export const maketitleCommand: CommandDefinition = {
  name: "maketitle",
  description: "Render document title block",
  status: "SUPPORTED",
  render: () => "",
};

export const includegraphicsCommand: CommandDefinition = {
  name: "includegraphics",
  description: "Include an image",
  status: "SUPPORTED",
  render: (node) => {
    const optionalArg = (node.args ?? []).find((a) => a.type === "optional");
    const requiredArg = (node.args ?? []).find((a) => a.type === "required");
    const src = requiredArg?.children
      .map((c) => (c.type === "text" ? c.value : ""))
      .join("") ?? "";
    const safeSrc = escapeHtml(src.trim());

    let styleAttr = "max-width:100%;height:auto;";
    if (optionalArg) {
      // Flatten all text and command names from the optional arg to reconstruct
      // strings like "width=0.5\textwidth"
      const optText = optionalArg.children
        .map((c) => {
          if (c.type === "text") return c.value;
          if (c.type === "command") return c.name; // e.g. "textwidth"
          return "";
        })
        .join("");
      const widthMatch = optText.match(/width\s*=\s*([\d.]+)/);
      if (widthMatch) {
        const pct = Math.round(parseFloat(widthMatch[1]) * 100);
        styleAttr = `max-width:${pct}%;height:auto;`;
      }
    }

    return `<img src="${safeSrc}" alt="${safeSrc}" style="${styleAttr}" />`;
  },
};

export const captionCommand: CommandDefinition = {
  name: "caption",
  description: "Figure/table caption",
  status: "SUPPORTED",
  render: (node, ctx) => `<figcaption class="latex-caption">${ctx.renderChildren(node.children)}</figcaption>`,
};

export const labelCommand: CommandDefinition = {
  name: "label",
  description: "Label for cross-referencing",
  status: "SUPPORTED",
  render: (node) => {
    const id = node.children.map((c) => (c.type === "text" ? c.value : "")).join("");
    return `<span id="${escapeHtml(id.trim())}" class="latex-label"></span>`;
  },
};

export const refCommand: CommandDefinition = {
  name: "ref",
  description: "Cross-reference",
  status: "SUPPORTED",
  render: (node) => {
    const id = node.children.map((c) => (c.type === "text" ? c.value : "")).join("");
    return `<a href="#${escapeHtml(id.trim())}" class="latex-ref">${escapeHtml(id.trim())}</a>`;
  },
};

export const footnoteCommand: CommandDefinition = {
  name: "footnote",
  description: "Footnote",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<sup class="latex-footnote" title="${ctx.renderChildren(node.children).replace(/"/g, "&quot;")}">*</sup>`,
};

export const textscCommand: CommandDefinition = {
  name: "textsc",
  description: "Small caps text",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<span style="font-variant:small-caps">${ctx.renderChildren(node.children)}</span>`,
};

export const textrm: CommandDefinition = {
  name: "textrm",
  description: "Roman (serif) text",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<span style="font-family:serif">${ctx.renderChildren(node.children)}</span>`,
};

export const textsf: CommandDefinition = {
  name: "textsf",
  description: "Sans-serif text",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<span style="font-family:sans-serif">${ctx.renderChildren(node.children)}</span>`,
};

export const hspaceCommand: CommandDefinition = {
  name: "hspace",
  description: "Horizontal space",
  status: "SUPPORTED",
  render: () => "&nbsp;",
};

export const vspaceCommand: CommandDefinition = {
  name: "vspace",
  description: "Vertical space",
  status: "SUPPORTED",
  render: () => "",
};

export const noindentCommand: CommandDefinition = {
  name: "noindent",
  description: "No paragraph indent",
  status: "SUPPORTED",
  render: () => "",
};

export const parCommand: CommandDefinition = {
  name: "par",
  description: "Paragraph break",
  status: "SUPPORTED",
  render: () => "</p><p>",
};

export const pagebreakCommand: CommandDefinition = {
  name: "pagebreak",
  description: "Page break",
  status: "SUPPORTED",
  render: () => '<div class="page-break"></div>',
};

export const newpageCommand: CommandDefinition = {
  name: "newpage",
  description: "New page",
  status: "SUPPORTED",
  render: () => '<div class="page-break"></div>',
};

export const clearPageCommand: CommandDefinition = {
  name: "clearpage",
  description: "Clear page",
  status: "SUPPORTED",
  render: () => '<div class="page-break"></div>',
};

export const hrefCommand: CommandDefinition = {
  name: "href",
  description: "Hyperlink",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const requiredArgs = (node.args ?? []).filter((a) => a.type === "required");
    if (requiredArgs.length >= 2) {
      const rawUrl = requiredArgs[0].children
        .map((c) => (c.type === "text" ? c.value : ""))
        .join("");
      const safeUrl = sanitizeUrl(rawUrl);
      const labelHtml = ctx.renderChildren(requiredArgs[1].children);
      return renderAnchor(safeUrl, labelHtml.trim() || safeUrl);
    }
    return "";
  },
};

export const urlCommand: CommandDefinition = {
  name: "url",
  description: "URL link",
  status: "SUPPORTED",
  render: (node) => {
    const rawUrl = node.children
      .map((c) => (c.type === "text" ? c.value : ""))
      .join("");
    const safeUrl = sanitizeUrl(rawUrl);
    return renderAnchor(safeUrl, safeUrl);
  },
};

export const escapedSymbols: CommandDefinition[] = [
  { name: "%", status: "SUPPORTED", render: () => "%" },
  { name: "&", status: "SUPPORTED", render: () => "&amp;" },
  { name: "$", status: "SUPPORTED", render: () => "$" },
  { name: "#", status: "SUPPORTED", render: () => "#" },
  { name: "_", status: "SUPPORTED", render: () => "_" },
  { name: "{", status: "SUPPORTED", render: () => "{" },
  { name: "}", status: "SUPPORTED", render: () => "}" },
  { name: " ", status: "SUPPORTED", render: () => " " },
];

export const preambleCommands: CommandDefinition[] = [
  { name: "documentclass", status: "SUPPORTED", render: () => "" },
  { name: "usepackage", status: "SUPPORTED", render: () => "" },
  { name: "input", status: "SUPPORTED", render: () => "" },
  { name: "pagestyle", status: "SUPPORTED", render: () => "" },
  { name: "thispagestyle", status: "SUPPORTED", render: () => "" },
  { name: "geometry", status: "SUPPORTED", render: () => "" },
  { name: "setlength", status: "SUPPORTED", render: () => "" },
  { name: "addtolength", status: "SUPPORTED", render: () => "" },
  { name: "urlstyle", status: "SUPPORTED", render: () => "" },
  { name: "titleformat", status: "SUPPORTED", render: () => "" },
  { name: "fancyhf", status: "SUPPORTED", render: () => "" },
  { name: "fancyfoot", status: "SUPPORTED", render: () => "" },
  { name: "raggedbottom", status: "SUPPORTED", render: () => "" },
  { name: "raggedright", status: "SUPPORTED", render: () => "" },
];

export const resumeCommands: CommandDefinition[] = [
  itemCommand,
  lineBreakCommand,
  newlineCommand,
  sectionCommand,
  subsectionCommand,
  subsubsectionCommand,
  chapterCommand,
  titleCommand,
  authorCommand,
  dateCommand,
  maketitleCommand,
  includegraphicsCommand,
  captionCommand,
  labelCommand,
  refCommand,
  footnoteCommand,
  textscCommand,
  textrm,
  textsf,
  hspaceCommand,
  vspaceCommand,
  noindentCommand,
  parCommand,
  pagebreakCommand,
  newpageCommand,
  clearPageCommand,
  hrefCommand,
  urlCommand,
  ...escapedSymbols,
  ...preambleCommands,
];

export function registerResumeCommands(registry: CommandRegistry): void {
  for (const cmd of resumeCommands) {
    registry.register(cmd, { override: true });
  }
}
