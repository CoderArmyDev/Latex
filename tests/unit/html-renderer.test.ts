import { describe, it, expect } from "vitest";
import { parse } from "../../src/core/parser";
import { HtmlRenderer, renderHtml } from "../../src/renderers/html";
import { createCommandRegistry } from "../../src/commands/registry";
import { DocumentNode } from "../../src/types/ast";

describe("HtmlRenderer", () => {
  it("should render plain text with HTML escaping", () => {
    const ast = parse("Hello & <World>");
    const html = renderHtml(ast);
    expect(html).toBe("Hello &amp; &lt;World&gt;");
  });

  it("should render command node using registered command definition", () => {
    const registry = createCommandRegistry();
    registry.register({
      name: "textbf",
      render: (node, ctx) => `<strong>${ctx.renderChildren(node.children)}</strong>`,
    });

    const ast = parse("Hello \\textbf{World}");
    const html = renderHtml(ast, { commandRegistry: registry });
    expect(html).toBe("Hello <strong>World</strong>");
  });

  it("should render nested commands correctly", () => {
    const registry = createCommandRegistry();
    registry.register({
      name: "textbf",
      render: (node, ctx) => `<strong>${ctx.renderChildren(node.children)}</strong>`,
    });
    registry.register({
      name: "textit",
      render: (node, ctx) => `<em>${ctx.renderChildren(node.children)}</em>`,
    });

    const ast = parse("\\textbf{Hello \\textit{world}}");
    const html = renderHtml(ast, { commandRegistry: registry });
    expect(html).toBe("<strong>Hello <em>world</em></strong>");
  });

  it("should safely fallback for unknown commands by default", () => {
    const ast = parse("\\unknownCommand{some text}");
    const html = renderHtml(ast);
    expect(html).toBe("some text");
  });

  it("should throw in strict mode for unknown commands", () => {
    const ast = parse("\\unknownCommand{some text}");
    expect(() => renderHtml(ast, { strict: true })).toThrow(
      /unknownCommand/
    );
  });

  it("should escape malicious HTML and script tags (XSS security test)", () => {
    const maliciousInput = '<script>alert("x")</script><img src=x onerror=alert(1)>';
    const ast = parse(maliciousInput);
    const html = renderHtml(ast);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  it("should escape malicious content inside commands", () => {
    const registry = createCommandRegistry();
    registry.register({
      name: "textbf",
      render: (node, ctx) => `<strong>${ctx.renderChildren(node.children)}</strong>`,
    });

    const ast = parse('\\textbf{<script>alert("hack")</script>}');
    const html = renderHtml(ast, { commandRegistry: registry });
    expect(html).toBe('<strong>&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;</strong>');
  });

  it("should render empty document node to empty string", () => {
    const emptyAst: DocumentNode = {
      type: "document",
      children: [],
    };
    expect(renderHtml(emptyAst)).toBe("");
  });
});
