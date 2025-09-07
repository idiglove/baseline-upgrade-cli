import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const stringMethodsRule: RuleDefinition = {
  name: 'string-methods',
  description: 'Replace string patterns with modern String methods',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: str.indexOf(substring) !== -1 -> str.includes(substring)
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
          description: 'String.includes() is Baseline stable and more readable than indexOf comparison',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'string-methods',
          severity: 'info'
        });
      }
    }
    
    // Pattern: str.indexOf(prefix) === 0 -> str.startsWith(prefix)
    if (t.isBinaryExpression(node) && 
        node.operator === '===' &&
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
          oldCode: `${objectCode}.indexOf(${argCode}) === 0`,
          newCode: `${objectCode}.startsWith(${argCode})`,
          description: 'String.startsWith() is Baseline stable and more semantic than indexOf === 0',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'string-methods',
          severity: 'info'
        });
      }
    }
    
    // Pattern: str.lastIndexOf(suffix) === str.length - suffix.length -> str.endsWith(suffix)
    if (t.isBinaryExpression(node) && 
        node.operator === '===' &&
        t.isBinaryExpression(node.right) &&
        node.right.operator === '-') {
      
      if (t.isCallExpression(node.left) &&
          t.isMemberExpression(node.left.callee) &&
          t.isIdentifier(node.left.callee.property) &&
          node.left.callee.property.name === 'lastIndexOf') {
        
        // This is a complex pattern, suggest endsWith in general
        const loc = node.loc;
        if (!loc) return;

        const objectCode = context.sourceCode.slice(node.left.callee.object.start!, node.left.callee.object.end!);
        const argCode = context.sourceCode.slice(node.left.arguments[0].start!, node.left.arguments[0].end!);
        
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: 'lastIndexOf suffix length comparison',
          newCode: `${objectCode}.endsWith(${argCode})`,
          description: 'String.endsWith() is Baseline stable and clearer than lastIndexOf calculations',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'string-methods',
          severity: 'info'
        });
      }
    }
  }
};