import { SourcePosition, SourceLocation, Token, TokenType } from "../types/token";

// % and $ are handled specially — not treated as generic SPECIAL_CHAR
const SPECIAL_CHARS = new Set(["&", "#", "_", "^", "~"]);

export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.input = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    const eofPos = this.currentPosition();
    tokens.push({
      type: "EOF",
      value: "",
      raw: "",
      loc: {
        start: eofPos,
        end: { ...eofPos },
      },
    });

    return tokens;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  private peek(): string {
    return this.input[this.pos] ?? "";
  }

  private peekNext(): string {
    return this.input[this.pos + 1] ?? "";
  }

  private currentPosition(): SourcePosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.pos,
    };
  }

  private advance(): string {
    const char = this.input[this.pos];
    if (char === "\r") {
      if (this.peekNext() === "\n") {
        this.pos += 2;
        this.line++;
        this.column = 1;
        return "\r\n";
      }
      this.pos++;
      this.line++;
      this.column = 1;
      return "\r";
    } else if (char === "\n") {
      this.pos++;
      this.line++;
      this.column = 1;
      return "\n";
    } else {
      this.pos++;
      this.column++;
      return char;
    }
  }

  private nextToken(): Token | null {
    const char = this.peek();
    const startPos = this.currentPosition();

    // 1. Backslash commands / escapes
    if (char === "\\") {
      return this.tokenizeCommand(startPos);
    }

    // 2. Braces and Brackets
    if (char === "{") {
      this.advance();
      return {
        type: "OPEN_BRACE",
        value: "{",
        raw: "{",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    if (char === "}") {
      this.advance();
      return {
        type: "CLOSE_BRACE",
        value: "}",
        raw: "}",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    if (char === "[") {
      this.advance();
      return {
        type: "OPEN_BRACKET",
        value: "[",
        raw: "[",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    if (char === "]") {
      this.advance();
      return {
        type: "CLOSE_BRACKET",
        value: "]",
        raw: "]",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // 3. Newlines
    if (char === "\n" || char === "\r") {
      const newlineStr = this.advance();
      return {
        type: "NEWLINE",
        value: newlineStr,
        raw: newlineStr,
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // 4. Whitespace (spaces and tabs)
    if (char === " " || char === "\t") {
      let value = "";
      while (!this.isAtEnd() && (this.peek() === " " || this.peek() === "\t")) {
        value += this.advance();
      }
      return {
        type: "WHITESPACE",
        value,
        raw: value,
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // 5. % line comment — consume to end of line, emit COMMENT token
    if (char === "%") {
      let value = "";
      while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
        value += this.advance();
      }
      return {
        type: "COMMENT",
        value,
        raw: value,
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // 6. $ — inline math $...$ or display math $$...$$
    if (char === "$") {
      return this.tokenizeMath(startPos);
    }

    // 7. Special characters
    if (SPECIAL_CHARS.has(char)) {
      this.advance();
      return {
        type: "SPECIAL_CHAR",
        value: char,
        raw: char,
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // 8. Plain text
    return this.tokenizeText(startPos);
  }

  private tokenizeCommand(startPos: SourcePosition): Token {
    this.advance(); // consume '\\'

    if (this.isAtEnd()) {
      return {
        type: "COMMAND",
        value: "",
        raw: "\\",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    const nextChar = this.peek();

    // \[ ... \] display math
    if (nextChar === "[") {
      return this.tokenizeDisplayMath(startPos);
    }

    // \verb|...| or \verb*|...|
    if (nextChar === "v" && this.input.slice(this.pos, this.pos + 4) === "verb") {
      return this.tokenizeVerb(startPos);
    }

    // If followed by letters (e.g. \textbf, \textit, \section)
    if (/[a-zA-Z]/.test(nextChar)) {
      let name = "";
      while (!this.isAtEnd() && /[a-zA-Z]/.test(this.peek())) {
        name += this.advance();
      }
      // Consume optional trailing * (e.g. \section*, \begin used separately)
      if (!this.isAtEnd() && this.peek() === "*") {
        name += this.advance();
      }
      return {
        type: "COMMAND",
        value: name,
        raw: "\\" + name,
        loc: { start: startPos, end: this.currentPosition() },
      };
    }

    // Followed by a non-letter character (e.g. \\, \%, \&, \$, \#, \_, \{, \}, \ )
    const symbol = this.advance();
    return {
      type: "COMMAND",
      value: symbol,
      raw: "\\" + symbol,
      loc: { start: startPos, end: this.currentPosition() },
    };
  }

  private tokenizeDisplayMath(startPos: SourcePosition): Token {
    this.advance(); // consume '['
    let content = "";
    while (!this.isAtEnd()) {
      if (this.peek() === "\\" && this.input[this.pos + 1] === "]") {
        this.advance(); // consume '\\'
        this.advance(); // consume ']'
        break;
      }
      content += this.advance();
    }
    return {
      type: "MATH_DISPLAY",
      value: content,
      raw: "\\[" + content + "\\]",
      loc: { start: startPos, end: this.currentPosition() },
    };
  }

  private tokenizeVerb(startPos: SourcePosition): Token {
    // consume 'verb'
    for (let i = 0; i < 4; i++) this.advance();
    // optional star
    if (!this.isAtEnd() && this.peek() === "*") this.advance();
    if (this.isAtEnd()) {
      return { type: "TEXT", value: "", raw: "", loc: { start: startPos, end: this.currentPosition() } };
    }
    const delimiter = this.advance(); // e.g. '|'
    let content = "";
    while (!this.isAtEnd() && this.peek() !== delimiter) {
      content += this.advance();
    }
    if (!this.isAtEnd()) this.advance(); // consume closing delimiter
    return {
      type: "VERB",
      value: content,
      raw: `\\verb${delimiter}${content}${delimiter}`,
      loc: { start: startPos, end: this.currentPosition() },
    };
  }

  private tokenizeMath(startPos: SourcePosition): Token {
    this.advance(); // consume first '$'
    // $$...$$ display math
    if (!this.isAtEnd() && this.peek() === "$") {
      this.advance(); // consume second '$'
      let content = "";
      while (!this.isAtEnd()) {
        if (this.peek() === "$" && this.input[this.pos + 1] === "$") {
          this.advance();
          this.advance();
          break;
        }
        content += this.advance();
      }
      return {
        type: "MATH_DISPLAY",
        value: content,
        raw: "$$" + content + "$$",
        loc: { start: startPos, end: this.currentPosition() },
      };
    }
    // $...$ inline math
    let content = "";
    while (!this.isAtEnd() && this.peek() !== "$") {
      if (this.peek() === "\n" || this.peek() === "\r") break; // unclosed inline math
      content += this.advance();
    }
    if (!this.isAtEnd() && this.peek() === "$") this.advance(); // consume closing '$'
    return {
      type: "MATH_INLINE",
      value: content,
      raw: "$" + content + "$",
      loc: { start: startPos, end: this.currentPosition() },
    };
  }

  private tokenizeText(startPos: SourcePosition): Token {
    let value = "";

    while (!this.isAtEnd()) {
      const c = this.peek();
      if (
        c === "\\" ||
        c === "{" ||
        c === "}" ||
        c === "[" ||
        c === "]" ||
        c === "\n" ||
        c === "\r" ||
        c === " " ||
        c === "\t" ||
        c === "%" ||
        c === "$" ||
        SPECIAL_CHARS.has(c)
      ) {
        break;
      }
      value += this.advance();
    }

    return {
      type: "TEXT",
      value,
      raw: value,
      loc: { start: startPos, end: this.currentPosition() },
    };
  }
}

export function tokenize(source: string): Token[] {
  return new Tokenizer(source).tokenize();
}
