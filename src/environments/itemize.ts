import { ASTNode } from "../types/ast";
import { EnvironmentDefinition } from "./types";
import { EnvironmentRegistry } from "./registry";

function textContent(nodes: ASTNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "command" || node.type === "environment") {
        return textContent(node.children);
      }
      return "";
    })
    .join("");
}

export const itemizeEnvironment: EnvironmentDefinition = {
  name: "itemize",
  description: "Renders an unordered bullet list (<ul>)",
  status: "SUPPORTED",
  render: (node, ctx) => {
    const items: ASTNode[][] = [];
    let currentItem: ASTNode[] | null = null;

    const visit = (children: ASTNode[]) => {
      for (const child of children) {
        if (child.type === "command" && child.name === "item") {
          if (currentItem !== null) {
            items.push(currentItem);
          }
          currentItem = [...child.children];
        } else if (
          currentItem === null &&
          child.type === "command" &&
          child.children.length > 0
        ) {
          visit(child.children);
        } else if (currentItem !== null) {
          currentItem.push(child);
        }
      }
    };

    visit(node.children);

    if (currentItem !== null) {
      items.push(currentItem);
    }

    if (items.length === 0) {
      const fallback = ctx.renderChildren(node.children).trim();
      return fallback ? `<ul>${fallback}</ul>` : "<ul></ul>";
    }

    const renderedItems = items
      .map((itemNodes) => {
        const rendered = ctx.renderChildren(itemNodes).trim();
        return `<li>${rendered}</li>`;
      })
      .join("");

    const optionText = (node.args ?? [])
      .filter((arg) => arg.type === "optional")
      .map((arg) => textContent(arg.children))
      .join(",");
    const className = /label\s*=\s*(?:\{\s*\})?(?:,|$)/.test(optionText)
      ? ' class="latex-list-no-label"'
      : "";

    return `<ul${className}>${renderedItems}</ul>`;
  },
};

export function registerItemizeEnvironment(registry: EnvironmentRegistry): void {
  registry.register(itemizeEnvironment, { override: true });
}
