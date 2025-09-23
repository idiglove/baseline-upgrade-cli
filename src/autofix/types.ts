export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextEdit {
  range: Range;
  newText: string;
}

export interface AutofixSuggestion {
  file: string;
  ruleId: string;
  edit: TextEdit;
  description: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  severity: 'error' | 'warn' | 'info';
}

export interface AutofixResult {
  success: boolean;
  appliedEdits: number;
  errors: AutofixError[];
  modifiedContent?: string;
}

export interface AutofixError {
  ruleId: string;
  message: string;
  position?: Position;
}

export interface AutofixOptions {
  dryRun?: boolean;
  safeOnly?: boolean;
  experimental?: boolean;
  maxEdits?: number;
}