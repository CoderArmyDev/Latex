import { SourceLocation, SourcePosition } from "../types/token";

export class LatexParseError extends Error {
  public position?: SourcePosition;
  public loc?: SourceLocation;

  constructor(message: string, location?: SourceLocation | SourcePosition) {
    let formattedMessage = message;
    if (location) {
      const pos = "start" in location ? location.start : location;
      formattedMessage = `${message} (${pos.line}:${pos.column})`;
    }
    super(formattedMessage);
    this.name = "LatexParseError";

    if (location) {
      if ("start" in location) {
        this.loc = location;
        this.position = location.start;
      } else {
        this.position = location;
        this.loc = { start: location, end: location };
      }
    }

    Object.setPrototypeOf(this, LatexParseError.prototype);
  }
}

export class LatexUnsupportedSyntaxError extends Error {
  public syntaxType: "command" | "environment";
  public syntaxName: string;
  public position?: SourcePosition;
  public loc?: SourceLocation;

  constructor(
    syntaxType: "command" | "environment",
    syntaxName: string,
    location?: SourceLocation | SourcePosition
  ) {
    const displayName =
      syntaxType === "command" ? `\\${syntaxName}` : syntaxName;
    let formattedMessage = `Unsupported ${syntaxType} '${displayName}'`;
    if (location) {
      const pos = "start" in location ? location.start : location;
      formattedMessage += ` (${pos.line}:${pos.column})`;
    }
    super(formattedMessage);
    this.name = "LatexUnsupportedSyntaxError";
    this.syntaxType = syntaxType;
    this.syntaxName = syntaxName;

    if (location) {
      if ("start" in location) {
        this.loc = location;
        this.position = location.start;
      } else {
        this.position = location;
        this.loc = { start: location, end: location };
      }
    }

    Object.setPrototypeOf(this, LatexUnsupportedSyntaxError.prototype);
  }
}
