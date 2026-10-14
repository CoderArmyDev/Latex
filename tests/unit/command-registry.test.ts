import { describe, it, expect, beforeEach } from "vitest";
import { CommandRegistry, createCommandRegistry } from "../../src/commands/registry";
import { CommandDefinition } from "../../src/commands/types";

describe("CommandRegistry", () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = createCommandRegistry();
  });

  it("should register and retrieve a command definition", () => {
    const textbfDef: CommandDefinition = {
      name: "textbf",
      description: "Renders bold text",
      status: "SUPPORTED",
      render: (node, ctx) => `<strong>${ctx.renderChildren(node.children)}</strong>`,
    };

    registry.register(textbfDef);

    expect(registry.has("textbf")).toBe(true);
    expect(registry.get("textbf")).toEqual(textbfDef);
  });

  it("should check whether a command exists and is supported", () => {
    registry.register({
      name: "textbf",
      status: "SUPPORTED",
    });
    registry.register({
      name: "deprecatedCmd",
      status: "UNSUPPORTED",
    });

    expect(registry.has("textbf")).toBe(true);
    expect(registry.isSupported("textbf")).toBe(true);

    expect(registry.has("deprecatedCmd")).toBe(true);
    expect(registry.isSupported("deprecatedCmd")).toBe(false);

    expect(registry.has("unknownCmd")).toBe(false);
    expect(registry.isSupported("unknownCmd")).toBe(false);
  });

  it("should return undefined for unknown commands", () => {
    expect(registry.get("nonExistentCommand")).toBeUndefined();
    expect(registry.has("nonExistentCommand")).toBe(false);
  });

  it("should disallow duplicate registration by default", () => {
    registry.register({ name: "textbf" });

    expect(() => {
      registry.register({ name: "textbf" });
    }).toThrowError(/already registered/);
  });

  it("should allow duplicate registration when override option is true", () => {
    registry.register({ name: "textbf", description: "First" });
    registry.register({ name: "textbf", description: "Second" }, { override: true });

    expect(registry.get("textbf")?.description).toBe("Second");
  });

  it("should validate command name on registration", () => {
    expect(() => {
      registry.register({ name: "" });
    }).toThrowError(/non-empty name/);
  });

  it("should list all registered commands and names", () => {
    registry.register({ name: "cmdA" });
    registry.register({ name: "cmdB" });

    expect(registry.getNames()).toEqual(["cmdA", "cmdB"]);
    expect(registry.getAll()).toHaveLength(2);
  });

  it("should unregister and clear commands", () => {
    registry.register({ name: "cmdA" });
    registry.register({ name: "cmdB" });

    expect(registry.unregister("cmdA")).toBe(true);
    expect(registry.has("cmdA")).toBe(false);
    expect(registry.has("cmdB")).toBe(true);

    registry.clear();
    expect(registry.getNames()).toHaveLength(0);
  });
});
