import { CommandDefinition } from "./types";

export interface RegisterOptions {
  override?: boolean;
}

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();

  public register(
    definition: CommandDefinition,
    options?: RegisterOptions
  ): void {
    if (
      !definition ||
      typeof definition.name !== "string" ||
      definition.name.length === 0
    ) {
      throw new Error("Command definition must have a non-empty name");
    }

    const name = definition.name;

    if (this.commands.has(name) && !options?.override) {
      throw new Error(`Command '\\${name}' is already registered`);
    }

    this.commands.set(name, {
      ...definition,
      name,
    });
  }

  public get(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  public has(name: string): boolean {
    return this.commands.has(name);
  }

  public unregister(name: string): boolean {
    return this.commands.delete(name);
  }

  public getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public getNames(): string[] {
    return Array.from(this.commands.keys());
  }

  public isSupported(name: string): boolean {
    const cmd = this.get(name);
    if (!cmd) return false;
    return cmd.status !== "UNSUPPORTED";
  }

  public clear(): void {
    this.commands.clear();
  }
}

export function createCommandRegistry(): CommandRegistry {
  return new CommandRegistry();
}

