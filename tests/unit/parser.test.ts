import { describe, it, expect } from "vitest";
import { parse, Parser } from "../../src/core/parser";
import { LatexParseError } from "../../src/core/errors";

describe("Parser", () => {
  it("should parse plain text", () => {
    const ast = parse("Hello world");
    expect(ast.type).toBe("document");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "text",
      value: "Hello world",
    });
  });

  it("should parse a simple command with a braced argument", () => {
    const ast = parse("\\textbf{Hello}");
    expect(ast.type).toBe("document");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "command",
      name: "textbf",
      children: [
        {
          type: "text",
          value: "Hello",
        },
      ],
    });
  });

  it("should parse nested commands", () => {
    const ast = parse("\\textbf{Hello \\textit{world}}");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "command",
      name: "textbf",
      children: [
        {
          type: "text",
          value: "Hello ",
        },
        {
          type: "command",
          name: "textit",
          children: [
            {
              type: "text",
              value: "world",
            },
          ],
        },
      ],
    });
  });

  it("should parse multiple commands and text nodes", () => {
    const ast = parse("Hello \\textbf{world}! And \\emph{everyone}!");
    expect(ast.children).toHaveLength(5);
    expect(ast.children).toMatchObject([
      { type: "text", value: "Hello " },
      {
        type: "command",
        name: "textbf",
        children: [{ type: "text", value: "world" }],
      },
      { type: "text", value: "! And " },
      {
        type: "command",
        name: "emph",
        children: [{ type: "text", value: "everyone" }],
      },
      { type: "text", value: "!" },
    ]);
  });

  it("should parse empty command argument and empty groups", () => {
    const ast1 = parse("\\textbf{}");
    expect(ast1.children[0]).toMatchObject({
      type: "command",
      name: "textbf",
      children: [],
    });

    const ast2 = parse("{}");
    expect(ast2.children).toHaveLength(0);

    const ast3 = parse("{Hello}");
    expect(ast3.children).toMatchObject([
      { type: "text", value: "Hello" },
    ]);
  });

  it("should parse command without argument", () => {
    const ast = parse("\\textbf");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "command",
      name: "textbf",
      children: [],
    });
  });

  it("should parse unknown commands as CommandNode without error", () => {
    const ast = parse("\\unknownCommand{custom text}");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "command",
      name: "unknownCommand",
      children: [
        {
          type: "text",
          value: "custom text",
        },
      ],
    });
  });

  it("should throw LatexParseError on unmatched opening brace", () => {
    expect(() => parse("\\textbf{Hello")).toThrow(LatexParseError);
    try {
      parse("\\textbf{Hello");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain("Unmatched opening brace");
      expect(parseError.position).toEqual({ line: 1, column: 8, offset: 7 });
    }
  });

  it("should throw LatexParseError on unmatched closing brace", () => {
    expect(() => parse("Hello}")).toThrow(LatexParseError);
    try {
      parse("Hello}");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain("Unexpected closing brace");
      expect(parseError.position).toEqual({ line: 1, column: 6, offset: 5 });
    }
  });

  it("should preserve source locations on AST nodes", () => {
    const ast = parse("\\textbf{Hi}");
    const cmd = ast.children[0];
    expect(cmd.loc).toEqual({
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 12, offset: 11 },
    });
  });
});
