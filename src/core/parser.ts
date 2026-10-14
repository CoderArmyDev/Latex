import {
  ASTNode,
  CommandArgument,
  CommandNode,
  DocumentNode,
  EnvironmentNode,
  MathNode,
  TextNode,
} from "../types/ast";
import { SourcePosition, Token, TokenType } from "../types/token";
import { tokenize } from "./tokenizer";
import { LatexParseError } from "./errors";

interface MacroDefinition {
  name: string;
  parameterCount: number;
  defaultArgument?: Token[];
  body: Token[];
  loc: Token["loc"];
}

interface TokenGroup {
  tokens: Token[];
  openToken: Token;
  closeToken: Token;
}

const MACRO_DEFINITION_COMMANDS = new Set([
  "newcommand",
  "renewcommand",
  "providecommand",
]);

const ASSIGNMENT_COMMANDS = new Set(["pdfgentounicode"]);

const COMMAND_REQUIRED_ARG_LIMITS = new Map<string, number>([
  ["textbf", 1],
  ["textit", 1],
  ["emph", 1],
  ["texttt", 1],
  ["underline", 1],
  ["textsl", 1],
  ["textnormal", 1],
  ["textsuperscript", 1],
  ["textsubscript", 1],
  ["textsc", 1],
  ["textrm", 1],
  ["textsf", 1],
  ["small", 1],
  ["tiny", 1],
  ["scriptsize", 1],
  ["footnotesize", 1],
  ["normalsize", 1],
  ["large", 1],
  ["Large", 1],
  ["LARGE", 1],
  ["huge", 1],
  ["Huge", 1],
  ["hspace", 1],
  ["vspace", 1],
  ["href", 2],
  ["url", 1],
  ["item", 1],
]);

const MAX_MACRO_EXPANSIONS = 1000;

const EXTERNALLY_DEFINED_RENEWABLE_MACROS = new Set([
  "footrulewidth",
  "headrulewidth",
  "labelitemii",
]);

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private macros: Map<string, MacroDefinition> = new Map();
  private macroExpansionCount: number = 0;

  constructor(tokensOrSource: Token[] | string) {
    if (typeof tokensOrSource === "string") {
      this.tokens = tokenize(tokensOrSource);
    } else {
      this.tokens = tokensOrSource;
    }
  }

  public parse(): DocumentNode {
    const children = this.parseNodes(() => this.isAtEnd());

    if (!this.isAtEnd()) {
      const token = this.peek();
      if (token.type === "COMMAND" && token.value === "end") {
        throw new LatexParseError(
          "Unexpected '\\end' without matching '\\begin'",
          token.loc
        );
      }
      if (token.type === "CLOSE_BRACE") {
        throw new LatexParseError("Unexpected closing brace '}'", token.loc);
      }
      throw new LatexParseError(`Unexpected token '${token.value}'`, token.loc);
    }

    const startLoc =
      children[0]?.loc?.start ??
      this.tokens[0]?.loc?.start ?? { line: 1, column: 1, offset: 0 };
    const endLoc =
      this.tokens[this.tokens.length - 1]?.loc?.end ?? startLoc;

    return {
      type: "document",
      children,
      loc: { start: startLoc, end: endLoc },
    };
  }

  private parseNodes(stopCondition: () => boolean): ASTNode[] {
    const nodes: ASTNode[] = [];
    let pendingText = "";
    let textStartLoc: SourcePosition | null = null;
    let textEndLoc: SourcePosition | null = null;

    const flushText = () => {
      if (pendingText.length > 0) {
        nodes.push({
          type: "text",
          value: pendingText,
          loc: {
            start: textStartLoc!,
            end: textEndLoc!,
          },
        });
        pendingText = "";
        textStartLoc = null;
        textEndLoc = null;
      }
    };

    while (!this.isAtEnd() && !stopCondition()) {
      const token = this.peek();

      if (
        token.type === "TEXT" ||
        token.type === "WHITESPACE" ||
        token.type === "NEWLINE" ||
        token.type === "SPECIAL_CHAR" ||
        token.type === "OPEN_BRACKET" ||
        token.type === "CLOSE_BRACKET"
      ) {
        this.advance();
        if (pendingText.length === 0) {
          textStartLoc = token.loc.start;
        }
        textEndLoc = token.loc.end;
        pendingText += token.raw ?? token.value;
      } else if (token.type === "COMMENT") {
        // strip comments entirely
        this.advance();
      } else if (token.type === "MATH_INLINE" || token.type === "MATH_DISPLAY") {
        flushText();
        this.advance();
        const mathNode: MathNode = {
          type: "math",
          mode: token.type === "MATH_INLINE" ? "inline" : "display",
          value: token.value,
          loc: token.loc,
        };
        nodes.push(mathNode);
      } else if (token.type === "VERB") {
        flushText();
        this.advance();
        nodes.push({
          type: "command",
          name: "verb",
          args: [],
          children: [{ type: "text", value: token.value, loc: token.loc }],
          loc: token.loc,
        } as CommandNode);
      } else if (token.type === "COMMAND") {
        if (MACRO_DEFINITION_COMMANDS.has(token.value)) {
          flushText();
          this.parseMacroDefinition();
        } else if (this.macros.has(token.value)) {
          flushText();
          this.expandMacroInvocation(token.value, token);
        } else if (ASSIGNMENT_COMMANDS.has(token.value)) {
          flushText();
          this.parseAssignmentCommand();
        } else if (token.value === "begin") {
          flushText();
          nodes.push(this.parseEnvironment());
        } else if (token.value === "end") {
          break;
        } else {
          flushText();
          nodes.push(this.parseCommand());
        }
      } else if (token.type === "OPEN_BRACE") {
        flushText();
        const groupNodes = this.parseGroup();
        nodes.push(...groupNodes);
      } else if (token.type === "CLOSE_BRACE") {
        break;
      } else {
        break;
      }
    }

    flushText();
    return nodes;
  }

  private parseEnvironment(): EnvironmentNode {
    const beginToken = this.advance(); // consume \begin

    if (!this.match("OPEN_BRACE")) {
      throw new LatexParseError(
        "Expected '{' after \\begin with environment name",
        beginToken.loc
      );
    }
    const openBraceToken = this.previous();

    let envName = "";
    while (!this.isAtEnd() && !this.check("CLOSE_BRACE")) {
      const t = this.advance();
      if (t.type === "TEXT" || t.type === "SPECIAL_CHAR") {
        envName += t.value;
      } else if (t.type === "COMMAND" && t.value === "*") {
        // allow \begin{equation*} where * was consumed as a command symbol
        envName += "*";
      } else {
        throw new LatexParseError(
          "Invalid character in environment name",
          t.loc
        );
      }
    }
    envName = envName.trim();
    if (!envName) {
      throw new LatexParseError(
        "Environment name cannot be empty",
        openBraceToken.loc
      );
    }

    if (!this.match("CLOSE_BRACE")) {
      throw new LatexParseError(
        `Unmatched opening brace in \\begin{${envName}}`,
        openBraceToken.loc
      );
    }

    const args = this.parseDelimitedArguments();

    const children = this.parseNodes(() => {
      return this.check("COMMAND") && this.peek().value === "end";
    });

    if (this.isAtEnd()) {
      throw new LatexParseError(
        `Missing '\\end{${envName}}' for environment started`,
        beginToken.loc
      );
    }

    const endToken = this.advance(); // consume \end
    if (!this.match("OPEN_BRACE")) {
      throw new LatexParseError(
        "Expected '{' after \\end with environment name",
        endToken.loc
      );
    }
    const endOpenBraceToken = this.previous();
    let closingEnvName = "";
    while (!this.isAtEnd() && !this.check("CLOSE_BRACE")) {
      const t = this.advance();
      if (t.type === "TEXT" || t.type === "SPECIAL_CHAR") {
        closingEnvName += t.value;
      }
    }
    closingEnvName = closingEnvName.trim();

    if (!this.match("CLOSE_BRACE")) {
      throw new LatexParseError(
        `Unmatched opening brace in \\end{${closingEnvName}}`,
        endOpenBraceToken.loc
      );
    }

    if (closingEnvName !== envName) {
      throw new LatexParseError(
        `Mismatched environment: expected '\\end{${envName}}', but found '\\end{${closingEnvName}}'`,
        endToken.loc
      );
    }

    const endLoc = this.previous().loc.end;

    return {
      type: "environment",
      name: envName,
      args: args.length > 0 ? args : undefined,
      children,
      loc: {
        start: beginToken.loc.start,
        end: endLoc,
      },
    };
  }

  private parseCommand(): CommandNode {
    const cmdToken = this.advance();
    const name = cmdToken.value;
    let endLoc = cmdToken.loc.end;
    const args = this.parseDelimitedArguments(name);
    if (args.length > 0) {
      endLoc = args[args.length - 1].loc?.end ?? endLoc;
    }

    let children: ASTNode[] = [];
    const requiredArgs = args.filter((a) => a.type === "required");
    if (requiredArgs.length === 1) {
      children = requiredArgs[0].children;
    } else if (requiredArgs.length > 1) {
      children = requiredArgs[requiredArgs.length - 1].children;
    } else if (args.length > 0) {
      children = args[0].children;
    }

    return {
      type: "command",
      name,
      args,
      children,
      loc: {
        start: cmdToken.loc.start,
        end: endLoc,
      },
    };
  }

  private parseDelimitedArguments(commandName?: string): CommandArgument[] {
    const args: CommandArgument[] = [];
    const requiredArgLimit = commandName
      ? COMMAND_REQUIRED_ARG_LIMITS.get(commandName)
      : undefined;
    let requiredArgCount = 0;

    while (!this.isAtEnd()) {
      if (
        requiredArgLimit !== undefined &&
        requiredArgCount >= requiredArgLimit &&
        this.check("OPEN_BRACE")
      ) {
        break;
      }

      if (this.match("OPEN_BRACKET")) {
        const openBracketToken = this.previous();
        const argChildren = this.parseNodes(() => this.check("CLOSE_BRACKET"));

        if (!this.match("CLOSE_BRACKET")) {
          throw new LatexParseError(
            "Unmatched opening bracket '['",
            openBracketToken.loc
          );
        }

        const bracketEndLoc = this.previous().loc.end;
        args.push({
          type: "optional",
          children: argChildren,
          loc: {
            start: openBracketToken.loc.start,
            end: bracketEndLoc,
          },
        });
      } else if (this.match("OPEN_BRACE")) {
        const openBraceToken = this.previous();
        const argChildren = this.parseNodes(() => this.check("CLOSE_BRACE"));

        if (!this.match("CLOSE_BRACE")) {
          throw new LatexParseError(
            "Unmatched opening brace '{'",
            openBraceToken.loc
          );
        }

        const braceEndLoc = this.previous().loc.end;
        args.push({
          type: "required",
          children: argChildren,
          loc: {
            start: openBraceToken.loc.start,
            end: braceEndLoc,
          },
        });
        requiredArgCount++;
      } else {
        break;
      }
    }

    return args;
  }

  private parseGroup(): ASTNode[] {
    const openBraceToken = this.advance();
    const nodes = this.parseNodes(() => this.check("CLOSE_BRACE"));

    if (!this.match("CLOSE_BRACE")) {
      throw new LatexParseError(
        "Unmatched opening brace '{'",
        openBraceToken.loc
      );
    }

    return nodes;
  }

  private parseMacroDefinition(): void {
    const definitionToken = this.advance();
    const mode = definitionToken.value;
    const macroName = this.readMacroDefinitionName(definitionToken);
    this.skipTrivia();

    let parameterCount = 0;
    if (this.check("OPEN_BRACKET")) {
      const countGroup = this.collectBalancedBracket();
      const countText = this.tokensToPlainText(countGroup.tokens).trim();
      if (!/^[0-9]+$/.test(countText)) {
        throw new LatexParseError(
          `Invalid parameter count for \\${macroName}`,
          countGroup.openToken.loc
        );
      }
      parameterCount = Number(countText);
      if (parameterCount > 9) {
        throw new LatexParseError(
          `Macro \\${macroName} supports at most 9 parameters`,
          countGroup.openToken.loc
        );
      }
      this.skipTrivia();
    }

    let defaultArgument: Token[] | undefined;
    if (parameterCount > 0 && this.check("OPEN_BRACKET")) {
      defaultArgument = this.collectBalancedBracket().tokens;
      this.skipTrivia();
    }

    if (!this.check("OPEN_BRACE")) {
      throw new LatexParseError(
        `Expected macro body for \\${macroName}`,
        definitionToken.loc
      );
    }
    const bodyGroup = this.collectBalancedGroup();

    if (mode === "newcommand" && this.macros.has(macroName)) {
      throw new LatexParseError(
        `Macro \\${macroName} is already defined`,
        definitionToken.loc
      );
    }
    if (
      mode === "renewcommand" &&
      !this.macros.has(macroName) &&
      !EXTERNALLY_DEFINED_RENEWABLE_MACROS.has(macroName)
    ) {
      throw new LatexParseError(
        `Cannot renew undefined macro \\${macroName}`,
        definitionToken.loc
      );
    }
    if (mode === "providecommand" && this.macros.has(macroName)) {
      return;
    }

    this.validateMacroBodyPlaceholders(
      macroName,
      bodyGroup.tokens,
      parameterCount
    );

    this.macros.set(macroName, {
      name: macroName,
      parameterCount,
      defaultArgument,
      body: bodyGroup.tokens,
      loc: {
        start: definitionToken.loc.start,
        end: bodyGroup.closeToken.loc.end,
      },
    });
  }

  private parseAssignmentCommand(): void {
    this.advance();
    this.skipTrivia();

    if (!this.isAtEnd() && this.peek().type === "TEXT") {
      const token = this.peek();
      if (token.value.startsWith("=")) {
        this.advance();
      }
    }
  }

  private readMacroDefinitionName(definitionToken: Token): string {
    this.skipTrivia();

    if (this.check("OPEN_BRACE")) {
      const nameGroup = this.collectBalancedGroup();
      const nameTokens = nameGroup.tokens.filter((token) => {
        return (
          token.type !== "WHITESPACE" &&
          token.type !== "NEWLINE" &&
          token.type !== "COMMENT"
        );
      });

      if (nameTokens.length === 1 && nameTokens[0].type === "COMMAND") {
        return nameTokens[0].value;
      }

      throw new LatexParseError(
        `Expected macro name like {\\name} after \\${definitionToken.value}`,
        nameGroup.openToken.loc
      );
    }

    if (this.check("COMMAND")) {
      return this.advance().value;
    }

    throw new LatexParseError(
      `Expected macro name after \\${definitionToken.value}`,
      definitionToken.loc
    );
  }

  private expandMacroInvocation(name: string, invocationToken: Token): void {
    const macro = this.macros.get(name);
    if (!macro) return;

    this.macroExpansionCount++;
    if (this.macroExpansionCount > MAX_MACRO_EXPANSIONS) {
      throw new LatexParseError(
        "Macro expansion limit exceeded; possible recursive macro",
        invocationToken.loc
      );
    }

    this.advance();
    const args = this.readMacroInvocationArguments(macro, invocationToken);
    const expandedTokens = this.substituteMacroArguments(macro, args);
    this.tokens.splice(this.current, 0, ...expandedTokens);
  }

  private readMacroInvocationArguments(
    macro: MacroDefinition,
    invocationToken: Token
  ): Token[][] {
    const args: Token[][] = [];
    let requiredCount = macro.parameterCount;

    if (macro.defaultArgument) {
      this.skipTrivia();
      if (this.check("OPEN_BRACKET")) {
        args.push(this.collectBalancedBracket().tokens);
      } else {
        args.push(macro.defaultArgument);
      }
      requiredCount--;
    }

    for (let index = 0; index < requiredCount; index++) {
      this.skipTrivia();
      if (!this.check("OPEN_BRACE")) {
        throw new LatexParseError(
          `Missing argument ${args.length + 1} for macro \\${macro.name}`,
          invocationToken.loc
        );
      }
      args.push(this.collectBalancedGroup().tokens);
    }

    return args;
  }

  private substituteMacroArguments(
    macro: MacroDefinition,
    args: Token[][]
  ): Token[] {
    const result: Token[] = [];

    for (let index = 0; index < macro.body.length; index++) {
      const token = macro.body[index];

      if (token.type !== "SPECIAL_CHAR" || token.value !== "#") {
        result.push(this.cloneToken(token));
        continue;
      }

      const next = macro.body[index + 1];
      if (next?.type === "SPECIAL_CHAR" && next.value === "#") {
        result.push({
          ...this.cloneToken(token),
          raw: "#",
          value: "#",
        });
        index++;
        continue;
      }

      const parameterNumber = this.readParameterNumber(next);
      if (parameterNumber === null) {
        throw new LatexParseError(
          `Invalid parameter placeholder in macro \\${macro.name}`,
          token.loc
        );
      }

      const replacement = args[parameterNumber - 1];
      if (!replacement) {
        throw new LatexParseError(
          `Macro \\${macro.name} has no argument #${parameterNumber}`,
          token.loc
        );
      }

      result.push(...replacement.map((argToken) => this.cloneToken(argToken)));
      const suffix = this.parameterTokenSuffix(next);
      if (suffix) {
        result.push({
          ...this.cloneToken(next!),
          value: suffix,
          raw: suffix,
        });
      }
      index++;
    }

    return result;
  }

  private validateMacroBodyPlaceholders(
    macroName: string,
    bodyTokens: Token[],
    parameterCount: number
  ): void {
    for (let index = 0; index < bodyTokens.length; index++) {
      const token = bodyTokens[index];
      if (token.type !== "SPECIAL_CHAR" || token.value !== "#") continue;

      const next = bodyTokens[index + 1];
      if (next?.type === "SPECIAL_CHAR" && next.value === "#") {
        index++;
        continue;
      }

      const parameterNumber = this.readParameterNumber(next);
      if (parameterNumber === null) {
        throw new LatexParseError(
          `Invalid parameter placeholder in macro \\${macroName}`,
          token.loc
        );
      }
      if (parameterNumber < 1 || parameterNumber > parameterCount) {
        throw new LatexParseError(
          `Macro \\${macroName} uses parameter #${parameterNumber} but declares ${parameterCount}`,
          token.loc
        );
      }
      index++;
    }
  }

  private readParameterNumber(token: Token | undefined): number | null {
    if (!token || token.type !== "TEXT") return null;
    const firstChar = token.value[0];
    if (!/^[1-9]$/.test(firstChar)) return null;
    return Number(firstChar);
  }

  private parameterTokenSuffix(token: Token | undefined): string {
    if (!token || token.type !== "TEXT") return "";
    return token.value.slice(1);
  }

  private collectBalancedGroup(): TokenGroup {
    if (!this.check("OPEN_BRACE")) {
      throw new LatexParseError("Expected opening brace '{'", this.peek().loc);
    }

    const openToken = this.advance();
    const tokens: Token[] = [];
    let depth = 1;

    while (!this.isAtEnd()) {
      const token = this.advance();

      if (token.type === "OPEN_BRACE") {
        depth++;
        tokens.push(token);
        continue;
      }

      if (token.type === "CLOSE_BRACE") {
        depth--;
        if (depth === 0) {
          return { tokens, openToken, closeToken: token };
        }
        tokens.push(token);
        continue;
      }

      tokens.push(token);
    }

    throw new LatexParseError("Unmatched opening brace '{'", openToken.loc);
  }

  private collectBalancedBracket(): TokenGroup {
    if (!this.check("OPEN_BRACKET")) {
      throw new LatexParseError("Expected opening bracket '['", this.peek().loc);
    }

    const openToken = this.advance();
    const tokens: Token[] = [];
    let bracketDepth = 1;
    let braceDepth = 0;

    while (!this.isAtEnd()) {
      const token = this.advance();

      if (token.type === "OPEN_BRACE") {
        braceDepth++;
        tokens.push(token);
        continue;
      }

      if (token.type === "CLOSE_BRACE") {
        if (braceDepth > 0) braceDepth--;
        tokens.push(token);
        continue;
      }

      if (token.type === "OPEN_BRACKET" && braceDepth === 0) {
        bracketDepth++;
        tokens.push(token);
        continue;
      }

      if (token.type === "CLOSE_BRACKET" && braceDepth === 0) {
        bracketDepth--;
        if (bracketDepth === 0) {
          return { tokens, openToken, closeToken: token };
        }
        tokens.push(token);
        continue;
      }

      tokens.push(token);
    }

    throw new LatexParseError("Unmatched opening bracket '['", openToken.loc);
  }

  private tokensToPlainText(tokens: Token[]): string {
    return tokens.map((token) => token.raw ?? token.value).join("");
  }

  private cloneToken(token: Token): Token {
    return {
      ...token,
      loc: {
        start: { ...token.loc.start },
        end: { ...token.loc.end },
      },
    };
  }

  private skipTrivia(): void {
    while (
      !this.isAtEnd() &&
      (this.check("WHITESPACE") ||
        this.check("NEWLINE") ||
        this.check("COMMENT"))
    ) {
      this.advance();
    }
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF" || this.current >= this.tokens.length;
  }

  private peek(): Token {
    return (
      this.tokens[this.current] ?? {
        type: "EOF",
        value: "",
        loc: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      }
    );
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
}

export function parse(tokensOrSource: Token[] | string): DocumentNode {
  return new Parser(tokensOrSource).parse();
}
