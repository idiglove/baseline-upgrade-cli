import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const xhrToFetchRule: RuleDefinition = {
  name: 'xhr-to-fetch',
  description: 'Replace XMLHttpRequest with modern fetch() API',
  category: 'javascript',
  severity: 'warn',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Detect: new XMLHttpRequest()
    if (t.isNewExpression(node) && 
        t.isIdentifier(node.callee) && 
        node.callee.name === 'XMLHttpRequest') {
      
      const loc = node.loc;
      if (!loc) return;

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: 'new XMLHttpRequest()',
        newCode: 'fetch(url)',
        description: 'fetch() is Baseline stable and provides cleaner Promise-based syntax',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'xhr-to-fetch',
        severity: 'warn'
      });
    }
    
    // Detect: XMLHttpRequest variable references
    if (t.isIdentifier(node) && node.name === 'XMLHttpRequest') {
      const loc = node.loc;
      if (!loc) return;

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: 'XMLHttpRequest',
        newCode: 'fetch() API',
        description: 'Consider migrating to fetch() for modern Promise-based HTTP requests',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'xhr-to-fetch',
        severity: 'info'
      });
    }
  }
};