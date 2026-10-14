import { describe, it, expect, beforeEach } from "vitest";
import {
  EnvironmentRegistry,
  createEnvironmentRegistry,
} from "../../src/environments/registry";
import { EnvironmentDefinition } from "../../src/environments/types";

describe("EnvironmentRegistry", () => {
  let registry: EnvironmentRegistry;

  beforeEach(() => {
    registry = createEnvironmentRegistry();
  });

  it("should register and retrieve an environment definition", () => {
    const centerDef: EnvironmentDefinition = {
      name: "center",
      description: "Center aligned content",
      status: "SUPPORTED",
      render: (node, ctx) => `<div class="center">${ctx.renderChildren(node.children)}</div>`,
    };

    registry.register(centerDef);

    expect(registry.has("center")).toBe(true);
    expect(registry.get("center")).toEqual(centerDef);
  });

  it("should check support status for environments", () => {
    registry.register({ name: "itemize", status: "SUPPORTED" });
    registry.register({ name: "unsupportedEnv", status: "UNSUPPORTED" });

    expect(registry.isSupported("itemize")).toBe(true);
    expect(registry.isSupported("unsupportedEnv")).toBe(false);
    expect(registry.isSupported("unknownEnv")).toBe(false);
  });

  it("should return undefined for unknown environments", () => {
    expect(registry.get("unknownEnv")).toBeUndefined();
    expect(registry.has("unknownEnv")).toBe(false);
  });

  it("should disallow duplicate registration by default", () => {
    registry.register({ name: "itemize" });

    expect(() => {
      registry.register({ name: "itemize" });
    }).toThrowError(/already registered/);
  });

  it("should allow overriding with option", () => {
    registry.register({ name: "itemize", description: "First" });
    registry.register({ name: "itemize", description: "Second" }, { override: true });

    expect(registry.get("itemize")?.description).toBe("Second");
  });

  it("should list, unregister, and clear environments", () => {
    registry.register({ name: "env1" });
    registry.register({ name: "env2" });

    expect(registry.getNames()).toEqual(["env1", "env2"]);
    expect(registry.getAll()).toHaveLength(2);

    expect(registry.unregister("env1")).toBe(true);
    expect(registry.has("env1")).toBe(false);

    registry.clear();
    expect(registry.getNames()).toHaveLength(0);
  });
});
