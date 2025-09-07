import { Node } from '@babel/types';

export interface Match {
  node: Node;
  filePath: string;
  line: number;
  column: number;
  oldCode: string;
}

export interface Suggestion {
  file: string;
  line: number;
  column: number;
  oldCode: string;
  newCode: string;
  message: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  baselineStatus: 'stable' | 'newly-available' | 'limited';
  confidence: 'high' | 'medium' | 'low';
  ruleId: string;
}

export interface RuleContext {
  filePath: string;
  fileContent: string;
  sourceCode: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  baselineFeature?: string;
  detect: (node: Node, context: RuleContext) => Match[];
  suggest: (match: Match) => Suggestion;
}