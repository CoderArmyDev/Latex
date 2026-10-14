import { SourceLocation } from "./token";

export interface TextNode {
  type: "text";
  value: string;
  loc?: SourceLocation;
}

export interface MathNode {
  type: "math";
  mode: "inline" | "display";
  value: string;
  loc?: SourceLocation;
}

export type ArgumentType = "required" | "optional";

export interface CommandArgument {
  type: ArgumentType;
  children: ASTNode[];
  loc?: SourceLocation;
}

export interface CommandNode {
  type: "command";
  name: string;
  args?: CommandArgument[];
  children: ASTNode[];
  loc?: SourceLocation;
}

export interface EnvironmentNode {
  type: "environment";
  name: string;
  args?: CommandArgument[];
  children: ASTNode[];
  loc?: SourceLocation;
}

export type ASTNode = TextNode | MathNode | CommandNode | EnvironmentNode;

export interface DocumentNode {
  type: "document";
  children: ASTNode[];
  loc?: SourceLocation;
}
