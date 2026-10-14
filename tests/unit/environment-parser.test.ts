import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { LatexParseError } from "../../src/core/errors";
import { EnvironmentNode } from "../../src/types/ast";

describe("Environment Parsing", () => {
  it("should parse a simple environment", () => {
    const ast = parse("\\begin{itemize}\nHello itemize\n\\end{itemize}");
    expect(ast.children).toHaveLength(1);
    const env = ast.children[0] as EnvironmentNode;

    expect(env.type).toBe("environment");
    expect(env.name).toBe("itemize");
    expect(env.children).toHaveLength(1);
    expect(env.children[0]).toMatchObject({
      type: "text",
      value: "\nHello itemize\n",
    });
  });

  it("should parse nested environments", () => {
    const source = `\\begin{outer}
\\begin{inner}
Nested Content
\\end{inner}
\\end{outer}`;

    const ast = parse(source);
    expect(ast.children).toHaveLength(1);
    const outerEnv = ast.children[0] as EnvironmentNode;

    expect(outerEnv.name).toBe("outer");
    const innerEnv = outerEnv.children.find(
      (c) => c.type === "environment",
    ) as EnvironmentNode;

    expect(innerEnv).toBeDefined();
    expect(innerEnv.name).toBe("inner");
    expect(innerEnv.children[0]).toMatchObject({
      type: "text",
      value: "\nNested Content\n",
    });
  });

  it("should parse empty environments", () => {
    const ast = parse("\\begin{center}\\end{center}");
    expect(ast.children).toHaveLength(1);
    const env = ast.children[0] as EnvironmentNode;

    expect(env.name).toBe("center");
    expect(env.children).toHaveLength(0);
  });

  it("should parse nested commands inside an environment", () => {
    const ast = parse(
      "\\begin{center}\n\\textbf{Bold Title} and \\textit{italic subtitle}\n\\end{center}",
    );
    const env = ast.children[0] as EnvironmentNode;

    expect(env.name).toBe("center");
    expect(env.children).toMatchObject([
      { type: "text", value: "\n" },
      {
        type: "command",
        name: "textbf",
        children: [{ type: "text", value: "Bold Title" }],
      },
      { type: "text", value: " and " },
      {
        type: "command",
        name: "textit",
        children: [{ type: "text", value: "italic subtitle" }],
      },
      { type: "text", value: "\n" },
    ]);
  });

  it("should throw LatexParseError on mismatched environment names", () => {
    expect(() => parse("\\begin{itemize}\n\\end{center}")).toThrow(
      LatexParseError,
    );

    try {
      parse("\\begin{itemize}\n\\end{center}");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain(
        "Mismatched environment: expected '\\end{itemize}', but found '\\end{center}'",
      );
    }
  });

  it("should throw LatexParseError on missing \\end", () => {
    expect(() => parse("\\begin{itemize}\nSome content")).toThrow(
      LatexParseError,
    );

    try {
      parse("\\begin{itemize}\nSome content");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain(
        "Missing '\\end{itemize}' for environment started",
      );
      expect(parseError.position).toEqual({ line: 1, column: 1, offset: 0 });
    }
  });

  it("should throw LatexParseError on unexpected \\end without \\begin", () => {
    expect(() => parse("Some text\n\\end{itemize}")).toThrow(LatexParseError);

    try {
      parse("Some text\n\\end{itemize}");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain(
        "Unexpected '\\end' without matching '\\begin'",
      );
    }
  });

  it("should preserve source locations on EnvironmentNode", () => {
    const ast = parse("\\begin{center}Hi\\end{center}");
    const env = ast.children[0] as EnvironmentNode;
    expect(env.loc).toEqual({
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 29, offset: 28 },
    });
  });
});
