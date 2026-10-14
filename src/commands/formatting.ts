import { CommandDefinition } from "./types";
import { CommandRegistry } from "./registry";

export const textbfCommand: CommandDefinition = {
  name: "textbf",
  description: "Renders bold text",
  status: "SUPPORTED",
  render: (node, ctx) => `<strong>${ctx.renderChildren(node.children)}</strong>`,
};

export const textitCommand: CommandDefinition = {
  name: "textit",
  description: "Renders italicized text",
  status: "SUPPORTED",
  render: (node, ctx) => `<em>${ctx.renderChildren(node.children)}</em>`,
};

export const emphCommand: CommandDefinition = {
  name: "emph",
  description: "Renders emphasized text",
  status: "SUPPORTED",
  render: (node, ctx) => `<em>${ctx.renderChildren(node.children)}</em>`,
};

export const textttCommand: CommandDefinition = {
  name: "texttt",
  description: "Renders monospace / typewriter text",
  status: "SUPPORTED",
  render: (node, ctx) => `<code>${ctx.renderChildren(node.children)}</code>`,
};

export const underlineCommand: CommandDefinition = {
  name: "underline",
  description: "Renders underlined text",
  status: "SUPPORTED",
  render: (node, ctx) => `<u>${ctx.renderChildren(node.children)}</u>`,
};

export const textslCommand: CommandDefinition = {
  name: "textsl",
  description: "Slanted text",
  status: "SUPPORTED",
  render: (node, ctx) => `<span style="font-style:oblique">${ctx.renderChildren(node.children)}</span>`,
};

export const textnormalCommand: CommandDefinition = {
  name: "textnormal",
  description: "Normal text",
  status: "SUPPORTED",
  render: (node, ctx) => `<span style="font-weight:normal;font-style:normal">${ctx.renderChildren(node.children)}</span>`,
};

export const textsuperscriptCommand: CommandDefinition = {
  name: "textsuperscript",
  description: "Superscript text",
  status: "SUPPORTED",
  render: (node, ctx) => `<sup>${ctx.renderChildren(node.children)}</sup>`,
};

export const textsubscriptCommand: CommandDefinition = {
  name: "textsubscript",
  description: "Subscript text",
  status: "SUPPORTED",
  render: (node, ctx) => `<sub>${ctx.renderChildren(node.children)}</sub>`,
};

export const verbCommand: CommandDefinition = {
  name: "verb",
  description: "Inline verbatim",
  status: "SUPPORTED",
  render: (node, ctx) => `<code>${ctx.renderChildren(node.children)}</code>`,
};

// Font size commands
const fontSizes: Array<[string, string]> = [
  ["tiny",         "0.5em"],
  ["scriptsize",   "0.7em"],
  ["footnotesize", "0.8em"],
  ["small",        "0.9em"],
  ["normalsize",   "1em"],
  ["large",        "1.2em"],
  ["Large",        "1.44em"],
  ["LARGE",        "1.73em"],
  ["huge",         "2.07em"],
  ["Huge",         "2.49em"],
];

export const fontSizeCommands: CommandDefinition[] = fontSizes.map(([name, size]) => ({
  name,
  description: `Font size ${name}`,
  status: "SUPPORTED" as const,
  render: (node: import("../types/ast").CommandNode, ctx: import("./types").CommandRenderContext) =>
    `<span style="font-size:${size}">${ctx.renderChildren(node.children)}</span>`,
}));

export const formattingCommands: CommandDefinition[] = [
  textbfCommand,
  textitCommand,
  emphCommand,
  textttCommand,
  underlineCommand,
  textslCommand,
  textnormalCommand,
  textsuperscriptCommand,
  textsubscriptCommand,
  verbCommand,
  ...fontSizeCommands,
];

export function registerFormattingCommands(registry: CommandRegistry): void {
  for (const cmd of formattingCommands) {
    registry.register(cmd, { override: true });
  }
}
