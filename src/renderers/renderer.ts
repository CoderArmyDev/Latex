import { ASTNode, DocumentNode } from "../types/ast";
import { CommandRegistry } from "../commands/registry";
import { EnvironmentRegistry } from "../environments/registry";
import { SourceLocation } from "../types/token";

export type UnsupportedPolicy =
  | "render_children"
  | "ignore"
  | "warn"
  | "throw"
  | "comment";

export interface UnsupportedWarning {
  type: "command" | "environment";
  name: string;
  message: string;
  loc?: SourceLocation;
}

export interface RenderOptions {
  commandRegistry?: CommandRegistry;
  environmentRegistry?: EnvironmentRegistry;
  unsupportedPolicy?: UnsupportedPolicy;
  onWarn?: (warning: UnsupportedWarning) => void;
  strict?: boolean;
}

export interface Renderer {
  render(node: ASTNode | DocumentNode): string;
}
