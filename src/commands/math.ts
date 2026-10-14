import { CommandDefinition } from "./types";
import { CommandRegistry } from "./registry";

// ── Math structure commands ───────────────────────────────────────────────────

export const fracCommand: CommandDefinition = {
  name: "frac",
  description: "Fraction",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const args = (node.args ?? []).filter((a) => a.type === "required");
    const num = args[0] ? ctx.renderChildren(args[0].children) : "";
    const den = args[1] ? ctx.renderChildren(args[1].children) : "";
    return `<math display="inline"><mfrac><mrow>${num}</mrow><mrow>${den}</mrow></mfrac></math>`;
  },
};

export const sqrtCommand: CommandDefinition = {
  name: "sqrt",
  description: "Square root",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const optArg = (node.args ?? []).find((a) => a.type === "optional");
    const reqArg = (node.args ?? []).find((a) => a.type === "required");
    const inner = reqArg ? ctx.renderChildren(reqArg.children) : ctx.renderChildren(node.children);
    if (optArg) {
      const n = ctx.renderChildren(optArg.children);
      return `<math display="inline"><mroot><mrow>${inner}</mrow><mrow>${n}</mrow></mroot></math>`;
    }
    return `<math display="inline"><msqrt><mrow>${inner}</mrow></msqrt></math>`;
  },
};

export const textMathCommand: CommandDefinition = {
  name: "text",
  description: "Normal text inside math",
  status: "SUPPORTED",
  render: (node, ctx) => `<mtext>${ctx.renderChildren(node.children)}</mtext>`,
};

export const mathbfCommand: CommandDefinition = {
  name: "mathbf",
  description: "Bold math",
  status: "SUPPORTED",
  render: (node, ctx) => `<mstyle mathvariant="bold">${ctx.renderChildren(node.children)}</mstyle>`,
};

export const mathrmCommand: CommandDefinition = {
  name: "mathrm",
  description: "Roman math",
  status: "SUPPORTED",
  render: (node, ctx) => `<mstyle mathvariant="normal">${ctx.renderChildren(node.children)}</mstyle>`,
};

export const mathbbCommand: CommandDefinition = {
  name: "mathbb",
  description: "Blackboard bold",
  status: "SUPPORTED",
  render: (node, ctx) => `<mstyle mathvariant="double-struck">${ctx.renderChildren(node.children)}</mstyle>`,
};

export const mathcalCommand: CommandDefinition = {
  name: "mathcal",
  description: "Calligraphic math",
  status: "SUPPORTED",
  render: (node, ctx) => `<mstyle mathvariant="script">${ctx.renderChildren(node.children)}</mstyle>`,
};

export const mathfrakCommand: CommandDefinition = {
  name: "mathfrak",
  description: "Fraktur math",
  status: "SUPPORTED",
  render: (node, ctx) => `<mstyle mathvariant="fraktur">${ctx.renderChildren(node.children)}</mstyle>`,
};

// ── Symbol commands (render as HTML entities / Unicode) ───────────────────────

const symbolMap: Record<string, string> = {
  // Greek lowercase
  alpha: "&alpha;", beta: "&beta;", gamma: "&gamma;", delta: "&delta;",
  epsilon: "&epsilon;", varepsilon: "&varepsilon;", zeta: "&zeta;", eta: "&eta;",
  theta: "&theta;", vartheta: "&vartheta;", iota: "&iota;", kappa: "&kappa;",
  lambda: "&lambda;", mu: "&mu;", nu: "&nu;", xi: "&xi;",
  pi: "&pi;", varpi: "&varpi;", rho: "&rho;", varrho: "&varrho;",
  sigma: "&sigma;", varsigma: "&varsigma;", tau: "&tau;", upsilon: "&upsilon;",
  phi: "&phi;", varphi: "&varphi;", chi: "&chi;", psi: "&psi;", omega: "&omega;",
  // Greek uppercase
  Gamma: "&Gamma;", Delta: "&Delta;", Theta: "&Theta;", Lambda: "&Lambda;",
  Xi: "&Xi;", Pi: "&Pi;", Sigma: "&Sigma;", Upsilon: "&Upsilon;",
  Phi: "&Phi;", Psi: "&Psi;", Omega: "&Omega;",
  // Arrows
  rightarrow: "&rarr;", leftarrow: "&larr;", leftrightarrow: "&harr;",
  Rightarrow: "&rArr;", Leftarrow: "&lArr;", Leftrightarrow: "&hArr;",
  to: "&rarr;", mapsto: "&#x21A6;", uparrow: "&uarr;", downarrow: "&darr;",
  iff: "&hArr;", implies: "&rArr;",
  // Math operators / relations
  infty: "&infin;", partial: "&part;", nabla: "&nabla;",
  cdot: "&sdot;", times: "&times;", pm: "&plusmn;", mp: "&#x2213;",
  neq: "&ne;", leq: "&le;", geq: "&ge;", approx: "&asymp;",
  equiv: "&equiv;", propto: "&prop;",
  in: "&isin;", notin: "&notin;", subset: "&sub;", subseteq: "&sube;",
  supset: "&sup;", supseteq: "&supe;",
  cup: "&cup;", cap: "&cap;", emptyset: "&empty;",
  forall: "&forall;", exists: "&exist;", nexists: "&#x2204;",
  therefore: "&there4;", because: "&#x2235;",
  // Ellipsis
  ldots: "&hellip;", cdots: "&#x22EF;", vdots: "&#x22EE;", ddots: "&#x22F1;",
  // Misc math
  sum: "&sum;", prod: "&prod;", int: "&int;", oint: "&#x222E;",
  lim: "lim", log: "log", ln: "ln", sin: "sin", cos: "cos", tan: "tan",
  exp: "exp", max: "max", min: "min", sup: "sup", inf: "inf",
  // Spacing (math mode)
  quad: "&emsp;", qquad: "&emsp;&emsp;",
  ",": "&#x2009;", ":": "&#x205F;", ";": "&#x2004;", "!": "",
  // Misc symbols
  hbar: "&#x210F;", ell: "&#x2113;", wp: "&#x2118;", Re: "&#x211C;", Im: "&#x2111;",
  aleph: "&#x2135;", angle: "&ang;", perp: "&perp;", parallel: "&#x2225;",
  div: "&divide;", ast: "*", star: "&#x22C6;", circ: "&#x2218;",
  bullet: "&bull;", oplus: "&oplus;", otimes: "&otimes;",
  langle: "&lang;", rangle: "&rang;",
  lceil: "&lceil;", rceil: "&rceil;", lfloor: "&lfloor;", rfloor: "&rfloor;",
  // Text symbols
  textbackslash: "\\", textasciitilde: "~", textasciicircum: "^",
  dag: "&dagger;", ddag: "&Dagger;", S: "&sect;", P: "&para;",
  copyright: "&copy;", registered: "&reg;", trademark: "&#x2122;",
  pounds: "&pound;", euro: "&euro;",
  // Accents (simplified)
  ldq: "&#x201C;", rdq: "&#x201D;", lq: "&#x2018;", rq: "&#x2019;",
};

export const symbolCommands: CommandDefinition[] = Object.entries(symbolMap).map(
  ([name, html]) => ({
    name,
    description: `Symbol \\${name}`,
    status: "SUPPORTED" as const,
    render: () => html,
  })
);

// ── Spacing / layout commands ─────────────────────────────────────────────────

export const spacingCommands: CommandDefinition[] = [
  { name: "quad",      status: "SUPPORTED", render: () => "&emsp;" },
  { name: "qquad",     status: "SUPPORTED", render: () => "&emsp;&emsp;" },
  { name: "hfill",     status: "SUPPORTED", render: () => '<span style="flex:1 1 auto;display:inline-block"></span>' },
  { name: "vfill",     status: "SUPPORTED", render: () => '<div style="flex:1 1 auto"></div>' },
  { name: "smallskip", status: "SUPPORTED", render: () => '<div style="margin-top:0.3em"></div>' },
  { name: "medskip",   status: "SUPPORTED", render: () => '<div style="margin-top:0.6em"></div>' },
  { name: "bigskip",   status: "SUPPORTED", render: () => '<div style="margin-top:1.2em"></div>' },
  { name: "linebreak", status: "SUPPORTED", render: () => "<br />" },
  { name: "indent",    status: "SUPPORTED", render: () => '<span style="display:inline-block;width:1.5em"></span>' },
];

// ── Layout / alignment commands ───────────────────────────────────────────────

export const layoutCommands: CommandDefinition[] = [
  { name: "centering",   status: "SUPPORTED", render: () => "" }, // handled by parent env
  { name: "raggedright", status: "SUPPORTED", render: () => "" },
  { name: "raggedleft",  status: "SUPPORTED", render: () => "" },
  {
    name: "paragraph",
    status: "SUPPORTED",
    render: (node, ctx) => `<h5 class="latex-paragraph">${ctx.renderChildren(node.children)}</h5>`,
  },
  {
    name: "rule",
    status: "SUPPORTED",
    render: (node) => {
      const args = (node.args ?? []).filter((a) => a.type === "required");
      const w = args[0]?.children.map((c) => (c.type === "text" ? c.value : "")).join("") ?? "100%";
      const h = args[1]?.children.map((c) => (c.type === "text" ? c.value : "")).join("") ?? "1pt";
      return `<hr style="width:${w};height:${h};border:none;background:#000;display:inline-block" />`;
    },
  },
];

// ── Box commands ──────────────────────────────────────────────────────────────

export const boxCommands: CommandDefinition[] = [
  {
    name: "fbox",
    status: "SUPPORTED",
    render: (node, ctx) =>
      `<span style="border:1px solid currentColor;padding:2px 4px">${ctx.renderChildren(node.children)}</span>`,
  },
  {
    name: "mbox",
    status: "SUPPORTED",
    render: (node, ctx) =>
      `<span style="white-space:nowrap">${ctx.renderChildren(node.children)}</span>`,
  },
  {
    name: "parbox",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const args = (node.args ?? []).filter((a) => a.type === "required");
      const w = args[0]?.children.map((c) => (c.type === "text" ? c.value : "")).join("") ?? "auto";
      const content = args[1] ? ctx.renderChildren(args[1].children) : ctx.renderChildren(node.children);
      return `<div style="display:inline-block;width:${w};vertical-align:top">${content}</div>`;
    },
  },
  {
    name: "makebox",
    status: "SUPPORTED",
    render: (node, ctx) => ctx.renderChildren(node.children),
  },
  {
    name: "framebox",
    status: "SUPPORTED",
    render: (node, ctx) =>
      `<span style="border:1px solid currentColor;padding:2px 4px">${ctx.renderChildren(node.children)}</span>`,
  },
];

// ── Color commands ────────────────────────────────────────────────────────────

export const colorCommands: CommandDefinition[] = [
  {
    name: "textcolor",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const args = (node.args ?? []).filter((a) => a.type === "required");
      const color = args[0]?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "inherit";
      const content = args[1] ? ctx.renderChildren(args[1].children) : ctx.renderChildren(node.children);
      return `<span style="color:${color}">${content}</span>`;
    },
  },
  {
    name: "color",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const color = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return color ? `<span style="color:${color}">` : "";
    },
  },
  {
    name: "colorbox",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const args = (node.args ?? []).filter((a) => a.type === "required");
      const color = args[0]?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "yellow";
      const content = args[1] ? ctx.renderChildren(args[1].children) : ctx.renderChildren(node.children);
      return `<span style="background-color:${color};padding:1px 3px">${content}</span>`;
    },
  },
  {
    name: "fcolorbox",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const args = (node.args ?? []).filter((a) => a.type === "required");
      const border = args[0]?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "black";
      const bg = args[1]?.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim() ?? "yellow";
      const content = args[2] ? ctx.renderChildren(args[2].children) : ctx.renderChildren(node.children);
      return `<span style="border:1px solid ${border};background-color:${bg};padding:1px 3px">${content}</span>`;
    },
  },
  {
    name: "definecolor",
    status: "SUPPORTED",
    render: () => "",
  },
];

// ── Reference / bibliography commands ────────────────────────────────────────

export const referenceCommands: CommandDefinition[] = [
  {
    name: "pageref",
    status: "SUPPORTED",
    render: (node) => {
      const id = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return `<a href="#${id}" class="latex-pageref">${id}</a>`;
    },
  },
  {
    name: "autoref",
    status: "SUPPORTED",
    render: (node) => {
      const id = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return `<a href="#${id}" class="latex-autoref">${id}</a>`;
    },
  },
  {
    name: "cite",
    status: "SUPPORTED",
    render: (node) => {
      const key = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return `<cite class="latex-cite">[${key}]</cite>`;
    },
  },
  {
    name: "bibitem",
    status: "SUPPORTED",
    render: (node, ctx) => {
      const key = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return `<li id="${key}" class="latex-bibitem">`;
    },
  },
  { name: "bibliography",      status: "SUPPORTED", render: () => "" },
  { name: "bibliographystyle", status: "SUPPORTED", render: () => "" },
  {
    name: "nolinkurl",
    status: "SUPPORTED",
    render: (node) => {
      const url = node.children.map((c) => (c.type === "text" ? c.value : "")).join("").trim();
      return `<span class="latex-nolinkurl">${url}</span>`;
    },
  },
  { name: "hypersetup",    status: "SUPPORTED", render: () => "" },
  { name: "pagenumbering", status: "SUPPORTED", render: () => "" },
];

// ── Macro definition commands (silently ignored) ──────────────────────────────

export const macroCommands: CommandDefinition[] = [
  { name: "newcommand",     status: "SUPPORTED", render: () => "" },
  { name: "renewcommand",   status: "SUPPORTED", render: () => "" },
  { name: "providecommand", status: "SUPPORTED", render: () => "" },
  { name: "newenvironment", status: "SUPPORTED", render: () => "" },
  { name: "renewenvironment",status: "SUPPORTED", render: () => "" },
  { name: "def",            status: "SUPPORTED", render: () => "" },
  { name: "input",          status: "SUPPORTED", render: () => "" },
  { name: "include",        status: "SUPPORTED", render: () => "" },
  { name: "tableofcontents",status: "SUPPORTED", render: () => "" },
  { name: "listoffigures",  status: "SUPPORTED", render: () => "" },
  { name: "listoftables",   status: "SUPPORTED", render: () => "" },
  { name: "appendix",       status: "SUPPORTED", render: () => "" },
  { name: "lstset",         status: "SUPPORTED", render: () => "" },
  { name: "lstinline",      status: "SUPPORTED", render: (node, ctx) => `<code>${ctx.renderChildren(node.children)}</code>` },
  { name: "setlist",        status: "SUPPORTED", render: () => "" },
  { name: "titleformat",    status: "SUPPORTED", render: () => "" },
  { name: "titlespacing",   status: "SUPPORTED", render: () => "" },
  { name: "titlespacing*",  status: "SUPPORTED", render: () => "" },
];

export function registerMathCommands(registry: CommandRegistry): void {
  const all: CommandDefinition[] = [
    fracCommand,
    sqrtCommand,
    textMathCommand,
    mathbfCommand,
    mathrmCommand,
    mathbbCommand,
    mathcalCommand,
    mathfrakCommand,
    ...symbolCommands,
    ...spacingCommands,
    ...layoutCommands,
    ...boxCommands,
    ...colorCommands,
    ...referenceCommands,
    ...macroCommands,
  ];
  for (const cmd of all) {
    registry.register(cmd, { override: true });
  }
}
