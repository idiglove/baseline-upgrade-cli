import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const varToConstLetRule: RuleDefinition = {
  name: 'var-to-const-let',
  description: 'Replace var declarations with const/let for better scoping',
  category: 'javascript',
  severity: 'warn',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    if (t.isVariableDeclaration(node) && node.kind === 'var') {
      const loc = node.loc;
      if (!loc) return;

      // Analyze if variable is reassigned to suggest const vs let
      const declarator = node.declarations[0];
      if (!t.isVariableDeclarator(declarator) || !t.isIdentifier(declarator.id)) return;

      const varName = declarator.id.name;
      const hasInit = !!declarator.init;
      
      // Simple heuristic: if no init or looks like it might be reassigned, suggest let
      // Otherwise suggest const
      const suggestedKeyword = !hasInit || varName.match(/^(i|j|k|index|count)$/) ? 'let' : 'const';
      
      const oldCode = context.sourceCode.slice(node.start!, node.end!);
      const newCode = oldCode.replace(/^var\b/, suggestedKeyword);

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: `var ${varName}`,
        newCode: `${suggestedKeyword} ${varName}`,
        description: `${suggestedKeyword} is Baseline stable and provides block scoping, preventing hoisting issues`,
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      });
    }
  }
};