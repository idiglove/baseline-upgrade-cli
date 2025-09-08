export interface RuleContext {
  filename: string;
  sourceCode: string;
  report: (suggestion: ModernizationSuggestion) => void;
  reportAutofix?: (suggestion: ModernizationSuggestion & AutofixCapable) => void;
}

export interface AutofixCapable {
  // Position information for precise text replacement
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface ModernizationSuggestion {
  file: string;
  line: number;
  column: number;
  oldCode: string;
  newCode: string;
  description: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  ruleId: string;
  severity: 'error' | 'warn' | 'info';
}

export interface RuleDefinition {
  name: string;
  description: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  severity: 'error' | 'warn' | 'info';
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  
  // For JavaScript/TypeScript rules
  visitNode?: (node: any, context: RuleContext) => void;
  
  // For CSS rules  
  visitCSSRule?: (rule: any, context: RuleContext) => void;
  
  // For text-based pattern matching
  visitPattern?: (context: RuleContext) => void;
}

export interface RuleConfig {
  [ruleId: string]: 'off' | 'warn' | 'error' | 'info' | [string, any];
}

export interface BaselineUpgradeConfig {
  rules: RuleConfig;
  extends?: string[];
  ignorePatterns?: string[];
  parserOptions?: {
    ecmaVersion?: number;
    sourceType?: 'module' | 'script';
    ecmaFeatures?: {
      jsx?: boolean;
      tsx?: boolean;
    };
  };
}