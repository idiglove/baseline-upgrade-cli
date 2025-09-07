import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const indexOfToIncludesRule: RuleDefinition = {
  name: 'indexOf-to-includes',
  description: 'Replace .indexOf() !== -1 patterns with .includes()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: arr.indexOf(item) !== -1
    if (t.isBinaryExpression(node) && 
        node.operator === '!==' &&
        t.isUnaryExpression(node.right) &&
        node.right.operator === '-' &&
        t.isNumericLiteral(node.right.argument) &&
        node.right.argument.value === 1) {
      
      if (t.isCallExpression(node.left) &&
          t.isMemberExpression(node.left.callee) &&
          t.isIdentifier(node.left.callee.property) &&
          node.left.callee.property.name === 'indexOf') {
        
        const loc = node.loc;
        if (!loc) return;

        const objectCode = context.sourceCode.slice(node.left.callee.object.start!, node.left.callee.object.end!);
        const argCode = context.sourceCode.slice(node.left.arguments[0].start!, node.left.arguments[0].end!);
        
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: `${objectCode}.indexOf(${argCode}) !== -1`,
          newCode: `${objectCode}.includes(${argCode})`,
          description: 'Array.includes() is Baseline stable and more readable than indexOf comparison',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'indexOf-to-includes',
          severity: 'info'
        });
      }
    }
    
    // Pattern: arr.indexOf(item) >= 0
    if (t.isBinaryExpression(node) && 
        node.operator === '>=' &&
        t.isNumericLiteral(node.right) &&
        node.right.value === 0) {
      
      if (t.isCallExpression(node.left) &&
          t.isMemberExpression(node.left.callee) &&
          t.isIdentifier(node.left.callee.property) &&
          node.left.callee.property.name === 'indexOf') {
        
        const loc = node.loc;
        if (!loc) return;

        const objectCode = context.sourceCode.slice(node.left.callee.object.start!, node.left.callee.object.end!);
        const argCode = context.sourceCode.slice(node.left.arguments[0].start!, node.left.arguments[0].end!);
        
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: `${objectCode}.indexOf(${argCode}) >= 0`,
          newCode: `${objectCode}.includes(${argCode})`,
          description: 'Array.includes() is Baseline stable and more readable than indexOf comparison',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'indexOf-to-includes',
          severity: 'info'
        });
      }
    }
  }
};