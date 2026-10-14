export type TokenType =
  | "TEXT"
  | "COMMAND"
  | "OPEN_BRACE"
  | "CLOSE_BRACE"
  | "OPEN_BRACKET"
  | "CLOSE_BRACKET"
  | "NEWLINE"
  | "WHITESPACE"
  | "SPECIAL_CHAR"
  | "COMMENT"
  | "MATH_INLINE"
  | "MATH_DISPLAY"
  | "VERB"
  | "EOF";

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
  raw?: string;
}
