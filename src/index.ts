export const VERSION = "0.1.0";

// Core
export { tokenize, Tokenizer } from "./core/tokenizer";
export { parse, Parser } from "./core/parser";
export { inspectCapabilities } from "./core/capabilities";
export type { CapabilityReport } from "./core/capabilities";
export { LatexParseError, LatexUnsupportedSyntaxError } from "./core/errors";

// Types
export type { ASTNode, DocumentNode, CommandNode, EnvironmentNode, TextNode, MathNode, CommandArgument } from "./types/ast";
export type { Token, TokenType, SourcePosition, SourceLocation } from "./types/token";

// Renderers
export { HtmlRenderer, renderHtml } from "./renderers/html";
export type { Renderer, RenderOptions, UnsupportedPolicy, UnsupportedWarning } from "./renderers/renderer";

// Commands
export { CommandRegistry, createCommandRegistry } from "./commands/registry";
export { createDefaultCommandRegistry } from "./commands/default";
export type { CommandDefinition, CommandRenderContext, CommandSupportStatus } from "./commands/types";

// Environments
export { EnvironmentRegistry, createEnvironmentRegistry } from "./environments/registry";
export { createDefaultEnvironmentRegistry } from "./environments/default";
export type { EnvironmentDefinition, EnvironmentRenderContext, EnvironmentSupportStatus } from "./environments/types";

// PDF
export { renderDocument, generatePrintHtml, buildPrintCss } from "./pdf/document";
export type { DocumentOptions } from "./pdf/document";

import { parse } from "./core/parser";
import { renderHtml } from "./renderers/html";
import { generatePrintHtml } from "./pdf/document";
import type { DocumentNode } from "./types/ast";
import type { RenderOptions } from "./renderers/renderer";

/**
 * Parse LaTeX source into an AST DocumentNode.
 */
export function parseLatex(source: string): DocumentNode {
  return parse(source);
}

/**
 * Parse LaTeX source and render it to an HTML string.
 */
export function renderLatex(source: string, options?: RenderOptions): string {
  return renderHtml(parse(source), options);
}

/**
 * Render an already-parsed AST to an HTML string.
 */
export function renderAst(ast: DocumentNode, options?: RenderOptions): string {
  return renderHtml(ast, options);
}

/**
 * Parse LaTeX source and render it as a complete, print-ready HTML document
 * suitable for PDF generation via a headless browser.
 */
export function renderLatexDocument(source: string, options?: RenderOptions & { title?: string }): string {
  const body = renderHtml(parse(source), options);
  return generatePrintHtml(body, { title: options?.title });
}
