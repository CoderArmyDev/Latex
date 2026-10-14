import { EnvironmentRegistry } from "./registry";
import { registerItemizeEnvironment } from "./itemize";
import { registerResumeEnvironments } from "./resume";
import { registerEnumerateEnvironment } from "./enumerate";
import { registerPdfEnvironments } from "./pdf";
import { registerExtraEnvironments } from "./extra";

export function createDefaultEnvironmentRegistry(): EnvironmentRegistry {
  const registry = new EnvironmentRegistry();
  registerItemizeEnvironment(registry);
  registerEnumerateEnvironment(registry);
  registerResumeEnvironments(registry);
  registerPdfEnvironments(registry);
  registerExtraEnvironments(registry);
  return registry;
}
