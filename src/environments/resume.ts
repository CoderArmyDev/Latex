import { EnvironmentDefinition } from "./types";
import { EnvironmentRegistry } from "./registry";

export const documentEnvironment: EnvironmentDefinition = {
  name: "document",
  description: "Root document environment",
  status: "SUPPORTED",
  render: (node, ctx) => ctx.renderChildren(node.children),
};

export const centerEnvironment: EnvironmentDefinition = {
  name: "center",
  description: "Center aligned content",
  status: "SUPPORTED",
  render: (node, ctx) =>
    `<div class="text-center">${ctx.renderChildren(node.children)}</div>`,
};

export const resumeEnvironments: EnvironmentDefinition[] = [
  documentEnvironment,
  centerEnvironment,
];

export function registerResumeEnvironments(
  registry: EnvironmentRegistry
): void {
  for (const env of resumeEnvironments) {
    registry.register(env, { override: true });
  }
}
