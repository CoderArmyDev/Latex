import { ASTNode, CommandNode } from "../types/ast";

export type CommandSupportStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED";

export interface CommandRenderContext {
  renderNode: (node: ASTNode) => string;
  renderChildren: (children: ASTNode[]) => string;
  options?: Record<string, unknown>;
}

export interface CommandDefinition {
  name: string;
  description?: string;
  status?: CommandSupportStatus;
  render?: (node: CommandNode, context: CommandRenderContext) => string;
}
