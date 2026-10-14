import { describe, it, expect } from "vitest";
import { tokenize } from "../../src/core/tokenizer";

describe("Tokenizer", () => {
  it("should tokenize plain text", () => {
    const tokens = tokenize("Hello world");
    expect(tokens).toEqual([
      {
        type: "TEXT",
        value: "Hello",
        raw: "Hello",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 6, offset: 5 },
        },
      },
      {
        type: "WHITESPACE",
        value: " ",
        raw: " ",
        loc: {
          start: { line: 1, column: 6, offset: 5 },
          end: { line: 1, column: 7, offset: 6 },
        },
      },
      {
        type: "TEXT",
        value: "world",
        raw: "world",
        loc: {
          start: { line: 1, column: 7, offset: 6 },
          end: { line: 1, column: 12, offset: 11 },
        },
      },
      {
        type: "EOF",
        value: "",
        raw: "",
        loc: {
          start: { line: 1, column: 12, offset: 11 },
          end: { line: 1, column: 12, offset: 11 },
        },
      },
    ]);
  });

  it("should tokenize commands", () => {
    const tokens = tokenize("\\textbf");
    expect(tokens).toEqual([
      {
        type: "COMMAND",
        value: "textbf",
        raw: "\\textbf",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 8, offset: 7 },
        },
      },
      {
        type: "EOF",
        value: "",
        raw: "",
        loc: {
          start: { line: 1, column: 8, offset: 7 },
          end: { line: 1, column: 8, offset: 7 },
        },
      },
    ]);
  });

  it("should tokenize command followed by text and braces", () => {
    const tokens = tokenize("\\textbf{Hello World}");
    expect(tokens.map((t) => ({ type: t.type, value: t.value }))).toEqual([
      { type: "COMMAND", value: "textbf" },
      { type: "OPEN_BRACE", value: "{" },
      { type: "TEXT", value: "Hello" },
      { type: "WHITESPACE", value: " " },
      { type: "TEXT", value: "World" },
      { type: "CLOSE_BRACE", value: "}" },
      { type: "EOF", value: "" },
    ]);
  });

  it("should tokenize braces", () => {
    const tokens = tokenize("{ }");
    expect(tokens.map((t) => t.type)).toEqual([
      "OPEN_BRACE",
      "WHITESPACE",
      "CLOSE_BRACE",
      "EOF",
    ]);
  });

  it("should tokenize brackets", () => {
    const tokens = tokenize("[12pt]");
    expect(tokens.map((t) => ({ type: t.type, value: t.value }))).toEqual([
      { type: "OPEN_BRACKET", value: "[" },
      { type: "TEXT", value: "12pt" },
      { type: "CLOSE_BRACKET", value: "]" },
      { type: "EOF", value: "" },
    ]);
  });

  it("should tokenize whitespace (spaces and tabs)", () => {
    const tokens = tokenize("   \t  ");
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({
      type: "WHITESPACE",
      value: "   \t  ",
      raw: "   \t  ",
      loc: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 7, offset: 6 },
      },
    });
    expect(tokens[1].type).toBe("EOF");
  });

  it("should tokenize newlines (\\n, \\r\\n, and \\r)", () => {
    const tokens = tokenize("Line 1\nLine 2\r\nLine 3");
    expect(tokens.map((t) => ({ type: t.type, value: t.value }))).toEqual([
      { type: "TEXT", value: "Line" },
      { type: "WHITESPACE", value: " " },
      { type: "TEXT", value: "1" },
      { type: "NEWLINE", value: "\n" },
      { type: "TEXT", value: "Line" },
      { type: "WHITESPACE", value: " " },
      { type: "TEXT", value: "2" },
      { type: "NEWLINE", value: "\r\n" },
      { type: "TEXT", value: "Line" },
      { type: "WHITESPACE", value: " " },
      { type: "TEXT", value: "3" },
      { type: "EOF", value: "" },
    ]);

    // Check line numbers for line 3
    const line3Token = tokens.find((t) => t.value === "3");
    expect(line3Token?.loc.start.line).toBe(3);
  });

  it("should tokenize escaped backslash and escaped symbols", () => {
    const tokens = tokenize("\\\\ \\% \\& \\$ \\# \\_ \\{ \\}");
    expect(tokens.filter((t) => t.type === "COMMAND").map((t) => ({ value: t.value, raw: t.raw }))).toEqual([
      { value: "\\", raw: "\\\\" },
      { value: "%", raw: "\\%" },
      { value: "&", raw: "\\&" },
      { value: "$", raw: "\\$" },
      { value: "#", raw: "\\#" },
      { value: "_", raw: "\\_" },
      { value: "{", raw: "\\{" },
      { value: "}", raw: "\\}" },
    ]);
  });

  it("should tokenize unescaped special characters", () => {
    // % is now a COMMENT token, $ is now MATH_INLINE/MATH_DISPLAY
    // Only &, #, _, ^, ~ remain as SPECIAL_CHAR
    const tokens = tokenize("& # _ ^ ~");
    expect(tokens.filter((t) => t.type === "SPECIAL_CHAR").map((t) => t.value)).toEqual([
      "&",
      "#",
      "_",
      "^",
      "~",
    ]);
  });

  it("should tokenize % as a COMMENT token", () => {
    const tokens = tokenize("Hello % this is a comment\nWorld");
    const comment = tokens.find((t) => t.type === "COMMENT");
    expect(comment).toBeDefined();
    expect(comment?.value).toBe("% this is a comment");
    // comment content should not appear in TEXT tokens
    const textValues = tokens.filter((t) => t.type === "TEXT").map((t) => t.value);
    expect(textValues).toContain("Hello");
    expect(textValues).toContain("World");
  });

  it("should tokenize $...$ as MATH_INLINE", () => {
    const tokens = tokenize("$x^2 + y^2$");
    const math = tokens.find((t) => t.type === "MATH_INLINE");
    expect(math).toBeDefined();
    expect(math?.value).toBe("x^2 + y^2");
  });

  it("should tokenize $$...$$ as MATH_DISPLAY", () => {
    const tokens = tokenize("$$E = mc^2$$");
    const math = tokens.find((t) => t.type === "MATH_DISPLAY");
    expect(math).toBeDefined();
    expect(math?.value).toBe("E = mc^2");
  });

  it("should tokenize \\[...\\] as MATH_DISPLAY", () => {
    const tokens = tokenize("\\[E = mc^2\\]");
    const math = tokens.find((t) => t.type === "MATH_DISPLAY");
    expect(math).toBeDefined();
    expect(math?.value).toBe("E = mc^2");
  });

  it("should tokenize \\verb|...| as VERB", () => {
    const tokens = tokenize("\\verb|const x = 1;|");
    const verb = tokens.find((t) => t.type === "VERB");
    expect(verb).toBeDefined();
    expect(verb?.value).toBe("const x = 1;");
  });

  it("should tokenize starred commands like \\section*", () => {
    const tokens = tokenize("\\section*");
    const cmd = tokens.find((t) => t.type === "COMMAND");
    expect(cmd?.value).toBe("section*");
  });

  it("should tokenize unknown commands", () => {
    const tokens = tokenize("\\someTotallyUnknownCommand{abc}");
    expect(tokens[0]).toEqual({
      type: "COMMAND",
      value: "someTotallyUnknownCommand",
      raw: "\\someTotallyUnknownCommand",
      loc: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 27, offset: 26 },
      },
    });
  });

  it("should accurately track source positions across multiple lines", () => {
    const source = "A\n\\foo{\n  B\n}";
    const tokens = tokenize(source);

    const fooToken = tokens.find((t) => t.value === "foo");
    expect(fooToken?.loc).toEqual({
      start: { line: 2, column: 1, offset: 2 },
      end: { line: 2, column: 5, offset: 6 },
    });

    const bToken = tokens.find((t) => t.value === "B");
    expect(bToken?.loc).toEqual({
      start: { line: 3, column: 3, offset: 10 },
      end: { line: 3, column: 4, offset: 11 },
    });

    const closeBrace = tokens.find((t) => t.type === "CLOSE_BRACE");
    expect(closeBrace?.loc).toEqual({
      start: { line: 4, column: 1, offset: 12 },
      end: { line: 4, column: 2, offset: 13 },
    });
  });

  it("should handle empty source", () => {
    const tokens = tokenize("");
    expect(tokens).toEqual([
      {
        type: "EOF",
        value: "",
        raw: "",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      },
    ]);
  });
});
