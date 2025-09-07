import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const asyncAwaitRule: RuleDefinition = {
  name: 'async-await',
  description: 'Replace Promise chains with async/await for better readability',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: Promise chains with .then().catch()
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property)) {
      
      const methodName = node.callee.property.name;
      
      // Look for .then() calls
      if (methodName === 'then') {
        // Check if this is chained (has another .then() or .catch())
        let hasChain = false;
        
        // Simple heuristic: if the parent expression is also a call expression
        // with .then() or .catch(), it's likely a chain
        if (isInPromiseChain(node, context)) {
          hasChain = true;
        }
        
        if (hasChain) {
          const loc = node.loc;
          if (!loc) return;

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: 'Promise chains with .then().catch()',
            newCode: 'async/await syntax',
            description: 'async/await is Baseline stable and more readable than Promise chains',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'async-await',
            severity: 'info'
          });
        }
      }
    }
    
    // Pattern: new Promise() constructor when simple async function would work
    if (t.isNewExpression(node) &&
        t.isIdentifier(node.callee) &&
        node.callee.name === 'Promise' &&
        node.arguments.length === 1) {
      
      const promiseExecutor = node.arguments[0];
      if (t.isArrowFunctionExpression(promiseExecutor) ||
          t.isFunctionExpression(promiseExecutor)) {
        
        // Check if it's a simple case that could be async function
        if (promiseExecutor.params.length === 2) {
          const loc = node.loc;
          if (!loc) return;

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: 'new Promise() constructor',
            newCode: 'async function',
            description: 'Consider using async functions instead of Promise constructor when possible',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'async-await',
            severity: 'info'
          });
        }
      }
    }
  }
};

function isInPromiseChain(node: any, context: RuleContext): boolean {
  // Look ahead in the source to see if there's more chaining
  const sourceAfter = context.sourceCode.slice(node.end!, node.end! + 50);
  return /\.(then|catch|finally)\s*\(/.test(sourceAfter);
};