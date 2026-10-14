import { CommandRegistry } from "./registry";
import { registerFormattingCommands } from "./formatting";
import { registerResumeCommands } from "./resume";
import { registerMathCommands } from "./math";

export function createDefaultCommandRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  registerFormattingCommands(registry);
  registerResumeCommands(registry);
  registerMathCommands(registry);
  return registry;
}
