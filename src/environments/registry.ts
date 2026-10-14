import { EnvironmentDefinition } from "./types";

export interface RegisterEnvironmentOptions {
  override?: boolean;
}

export class EnvironmentRegistry {
  private environments: Map<string, EnvironmentDefinition> = new Map();

  public register(
    definition: EnvironmentDefinition,
    options?: RegisterEnvironmentOptions
  ): void {
    if (
      !definition ||
      typeof definition.name !== "string" ||
      !definition.name.trim()
    ) {
      throw new Error("Environment definition must have a non-empty name");
    }

    const name = definition.name.trim();

    if (this.environments.has(name) && !options?.override) {
      throw new Error(`Environment '${name}' is already registered`);
    }

    this.environments.set(name, {
      ...definition,
      name,
    });
  }

  public get(name: string): EnvironmentDefinition | undefined {
    return this.environments.get(name);
  }

  public has(name: string): boolean {
    return this.environments.has(name);
  }

  public unregister(name: string): boolean {
    return this.environments.delete(name);
  }

  public getAll(): EnvironmentDefinition[] {
    return Array.from(this.environments.values());
  }

  public getNames(): string[] {
    return Array.from(this.environments.keys());
  }

  public isSupported(name: string): boolean {
    const env = this.get(name);
    if (!env) return false;
    return env.status !== "UNSUPPORTED";
  }

  public clear(): void {
    this.environments.clear();
  }
}

export function createEnvironmentRegistry(): EnvironmentRegistry {
  return new EnvironmentRegistry();
}
