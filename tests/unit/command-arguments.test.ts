import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { LatexParseError } from "../../src/core/errors";
import { CommandNode } from "../../src/types/ast";

describe("Command Arguments", () => {
  it("should parse single required argument and populate args array", () => {
    const ast = parse("\\textbf{Hello}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.type).toBe("command");
    expect(cmd.name).toBe("textbf");
    expect(cmd.args).toHaveLength(1);
    expect(cmd.args?.[0]).toMatchObject({
      type: "required",
      children: [{ type: "text", value: "Hello" }],
    });
    expect(cmd.children).toMatchObject([{ type: "text", value: "Hello" }]);
  });

  it("should parse multiple required arguments", () => {
    const ast = parse("\\customlink{https://example.com}{My Website}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.name).toBe("customlink");
    expect(cmd.args).toHaveLength(2);
    expect(cmd.args?.[0]).toMatchObject({
      type: "required",
      children: [{ type: "text", value: "https://example.com" }],
    });
    expect(cmd.args?.[1]).toMatchObject({
      type: "required",
      children: [{ type: "text", value: "My Website" }],
    });
  });

  it("should parse optional bracket argument followed by required argument", () => {
    const ast = parse("\\makebox[2in]{Centered text}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.name).toBe("makebox");
    expect(cmd.args).toHaveLength(2);
    expect(cmd.args?.[0]).toMatchObject({
      type: "optional",
      children: [{ type: "text", value: "2in" }],
    });
    expect(cmd.args?.[1]).toMatchObject({
      type: "required",
      children: [{ type: "text", value: "Centered text" }],
    });
  });

  it("should parse multiple optional arguments", () => {
    const ast = parse("\\mycmd[opt1][opt2]{arg}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.name).toBe("mycmd");
    expect(cmd.args).toHaveLength(3);
    expect(cmd.args?.[0]).toMatchObject({
      type: "optional",
      children: [{ type: "text", value: "opt1" }],
    });
    expect(cmd.args?.[1]).toMatchObject({
      type: "optional",
      children: [{ type: "text", value: "opt2" }],
    });
    expect(cmd.args?.[2]).toMatchObject({
      type: "required",
      children: [{ type: "text", value: "arg" }],
    });
  });

  it("should parse nested commands inside optional and required arguments", () => {
    const ast = parse("\\cmd[\\textbf{bold opt}]{\\textit{italic text}}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.args?.[0].children[0]).toMatchObject({
      type: "command",
      name: "textbf",
      children: [{ type: "text", value: "bold opt" }],
    });

    expect(cmd.args?.[1].children[0]).toMatchObject({
      type: "command",
      name: "textit",
      children: [{ type: "text", value: "italic text" }],
    });
  });

  it("should treat brackets in plain text as text when not following a command", () => {
    const ast = parse("See reference [1] for details.");
    expect(ast.children).toHaveLength(1);
    expect(ast.children[0]).toMatchObject({
      type: "text",
      value: "See reference [1] for details.",
    });
  });

  it("should throw LatexParseError on unmatched opening bracket in command argument", () => {
    expect(() => parse("\\cmd[unfinished")).toThrow(LatexParseError);
    try {
      parse("\\cmd[unfinished");
    } catch (err) {
      expect(err).toBeInstanceOf(LatexParseError);
      const parseError = err as LatexParseError;
      expect(parseError.message).toContain("Unmatched opening bracket");
      expect(parseError.position).toEqual({ line: 1, column: 5, offset: 4 });
    }
  });

  it("should track precise source locations for arguments", () => {
    const ast = parse("\\cmd[opt]{req}");
    const cmd = ast.children[0] as CommandNode;

    expect(cmd.args?.[0].loc).toEqual({
      start: { line: 1, column: 5, offset: 4 },
      end: { line: 1, column: 10, offset: 9 },
    });

    expect(cmd.args?.[1].loc).toEqual({
      start: { line: 1, column: 10, offset: 9 },
      end: { line: 1, column: 15, offset: 14 },
    });
  });
});
