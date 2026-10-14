import { ASTNode } from "../types/ast";
import { EnvironmentDefinition } from "./types";
import { EnvironmentRegistry } from "./registry";

export const enumerateEnvironment: EnvironmentDefinition = {
  name: "enumerate",
  description: "Renders an ordered numbered list (<ol>)",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const items: ASTNode[][] = [];
    let currentItem: ASTNode[] | null = null;

    for (const child of node.children) {
      if (child.type === "command" && child.name === "item") {
        if (currentItem !== null) items.push(currentItem);
        currentItem = [];
      } else if (currentItem !== null) {
        currentItem.push(child);
      }
    }
    if (currentItem !== null) items.push(currentItem);

    if (items.length === 0) {
      const fallback = ctx.renderChildren(node.children).trim();
      return fallback ? `<ol>${fallback}</ol>` : "<ol></ol>";
    }

    const renderedItems = items
      .map((itemNodes) => `<li>${ctx.renderChildren(itemNodes).trim()}</li>`)
      .join("");

    return `<ol>${renderedItems}</ol>`;
  },
};

export function registerEnumerateEnvironment(registry: EnvironmentRegistry): void {
  registry.register(enumerateEnvironment, { override: true });
}
