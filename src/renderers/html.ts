import {
  ASTNode,
  CommandNode,
  DocumentNode,
  EnvironmentNode,
  TextNode,
} from "../types/ast";
import { CommandRegistry } from "../commands/registry";
import { createDefaultCommandRegistry } from "../commands/default";
import { EnvironmentRegistry } from "../environments/registry";
import { createDefaultEnvironmentRegistry } from "../environments/default";
import { escapeHtml } from "../utils/escapeHtml";
import { Renderer, RenderOptions } from "./renderer";
import { CommandRenderContext } from "../commands/types";
import { EnvironmentRenderContext } from "../environments/types";
import { LatexUnsupportedSyntaxError } from "../core/errors";

export class HtmlRenderer implements Renderer {
  private commandRegistry: CommandRegistry;
  private environmentRegistry: EnvironmentRegistry;
  private options: RenderOptions;

  constructor(options?: RenderOptions) {
    this.options = options ?? {};
    this.commandRegistry =
      this.options.commandRegistry ?? createDefaultCommandRegistry();
    this.environmentRegistry =
      this.options.environmentRegistry ?? createDefaultEnvironmentRegistry();
  }

  public render(node: ASTNode | DocumentNode): string {
    if (node.type === "document") {
      return this.renderChildren(node.children);
    }
    return this.renderNode(node);
  }

  public renderChildren(children: ASTNode[]): string {
    return children.map((child) => this.renderNode(child)).join("");
  }

  public renderNode(node: ASTNode): string {
    switch (node.type) {
      case "text":
        return this.renderText(node);
      case "math":
        return this.renderMath(node);
      case "command":
        return this.renderCommand(node);
      case "environment":
        return this.renderEnvironment(node);
      default:
        return "";
    }
  }

  private renderText(node: TextNode): string {
    return escapeHtml(node.value);
  }

  private renderMath(node: import("../types/ast").MathNode): string {
    const escaped = escapeHtml(node.value);
    if (node.mode === "display") {
      return `<div class="latex-math-display avoid-break"><math display="block"><mrow><mtext>${escaped}</mtext></mrow></math></div>`;
    }
    return `<math display="inline"><mrow><mtext>${escaped}</mtext></mrow></math>`;
  }

  private renderCommand(node: CommandNode): string {
    const definition = this.commandRegistry.get(node.name);

    if (definition && typeof definition.render === "function") {
      const context: CommandRenderContext = {
        renderNode: (n: ASTNode) => this.renderNode(n),
        renderChildren: (children: ASTNode[]) => this.renderChildren(children),
        options: this.options as Record<string, unknown>,
      };
      return definition.render(node, context);
    }

    // Unknown command — apply unsupportedPolicy
    const policy = this.options.unsupportedPolicy ?? "render_children";

    if (this.options.strict || policy === "throw") {
      throw new LatexUnsupportedSyntaxError("command", node.name, node.loc);
    }

    if (policy === "ignore") {
      return "";
    }

    if (policy === "comment") {
      return `<!-- unsupported command \\${node.name} -->${this.renderChildren(node.children)}`;
    }

    if (policy === "warn") {
      this.options.onWarn?.({
        type: "command",
        name: node.name,
        message: `Unsupported command \\${node.name}`,
        loc: node.loc,
      });
    }

    return this.renderChildren(node.children);
  }

  private renderEnvironment(node: EnvironmentNode): string {
    const definition = this.environmentRegistry.get(node.name);

    if (definition && typeof definition.render === "function") {
      const context: EnvironmentRenderContext = {
        renderNode: (n: ASTNode) => this.renderNode(n),
        renderChildren: (children: ASTNode[]) => this.renderChildren(children),
        options: this.options as Record<string, unknown>,
      };
      return definition.render(node, context);
    }

    // Unknown environment — apply unsupportedPolicy
    const policy = this.options.unsupportedPolicy ?? "render_children";

    if (this.options.strict || policy === "throw") {
      throw new LatexUnsupportedSyntaxError("environment", node.name, node.loc);
    }

    if (policy === "ignore") {
      return "";
    }

    if (policy === "comment") {
      return `<!-- unsupported environment ${node.name} -->${this.renderChildren(node.children)}`;
    }

    if (policy === "warn") {
      this.options.onWarn?.({
        type: "environment",
        name: node.name,
        message: `Unsupported environment ${node.name}`,
        loc: node.loc,
      });
    }

    return this.renderChildren(node.children);
  }
}

export function renderHtml(
  ast: ASTNode | DocumentNode,
  options?: RenderOptions,
): string {
  return new HtmlRenderer(options).render(ast);
}
