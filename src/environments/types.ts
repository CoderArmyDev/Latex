import { ASTNode, EnvironmentNode } from "../types/ast";

export type EnvironmentSupportStatus =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "UNSUPPORTED";

export interface EnvironmentRenderContext {
  renderNode: (node: ASTNode) => string;
  renderChildren: (children: ASTNode[]) => string;
  options?: Record<string, unknown>;
}

export interface EnvironmentDefinition {
  name: string;
  description?: string;
  status?: EnvironmentSupportStatus;
  render?: (
    node: EnvironmentNode,
    context: EnvironmentRenderContext
  ) => string;
}
