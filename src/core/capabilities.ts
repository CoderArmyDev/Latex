import { ASTNode, DocumentNode } from "../types/ast";
import { CommandRegistry } from "../commands/registry";
import { createDefaultCommandRegistry } from "../commands/default";
import { EnvironmentRegistry } from "../environments/registry";
import { createDefaultEnvironmentRegistry } from "../environments/default";

export interface CapabilityReport {
  supported: string[];
  partiallySupported: string[];
  unsupported: string[];
  isFullySupported: boolean;
}

export function inspectCapabilities(
  ast: ASTNode | DocumentNode,
  options?: {
    commandRegistry?: CommandRegistry;
    environmentRegistry?: EnvironmentRegistry;
  }
): CapabilityReport {
  const commandRegistry =
    options?.commandRegistry ?? createDefaultCommandRegistry();
  const envRegistry =
    options?.environmentRegistry ?? createDefaultEnvironmentRegistry();

  const supported = new Set<string>();
  const partiallySupported = new Set<string>();
  const unsupported = new Set<string>();

  function traverse(node: ASTNode | DocumentNode) {
    if (node.type === "document") {
      node.children.forEach(traverse);
    } else if (node.type === "math") {
      supported.add(node.mode === "inline" ? "$...$" : "\\[...\\]");
    } else if (node.type === "command") {
      const def = commandRegistry.get(node.name);
      const name = `\\${node.name}`;
      if (!def) {
        unsupported.add(name);
      } else if (def.status === "SUPPORTED") {
        supported.add(name);
      } else if (def.status === "PARTIALLY_SUPPORTED") {
        partiallySupported.add(name);
      } else {
        unsupported.add(name);
      }
      if (node.args) {
        node.args.forEach((arg) => arg.children.forEach(traverse));
      } else {
        node.children.forEach(traverse);
      }
    } else if (node.type === "environment") {
      const def = envRegistry.get(node.name);
      const name = node.name;
      if (!def) {
        unsupported.add(name);
      } else if (def.status === "SUPPORTED") {
        supported.add(name);
      } else if (def.status === "PARTIALLY_SUPPORTED") {
        partiallySupported.add(name);
      } else {
        unsupported.add(name);
      }
      if (node.args) {
        node.args.forEach((arg) => arg.children.forEach(traverse));
      }
      node.children.forEach(traverse);
    }
  }

  traverse(ast);

  return {
    supported: Array.from(supported),
    partiallySupported: Array.from(partiallySupported),
    unsupported: Array.from(unsupported),
    isFullySupported: unsupported.size === 0 && partiallySupported.size === 0,
  };
}
