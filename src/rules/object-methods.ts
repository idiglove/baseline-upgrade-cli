import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const objectMethodsRule: RuleDefinition = {
  name: 'object-methods',
  description: 'Replace manual object iteration with modern Object methods',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: Object.keys(obj).map(key => obj[key]) -> Object.values(obj)
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'map') {
      
      // Check if called on Object.keys()
      if (t.isCallExpression(node.callee.object) &&
          t.isMemberExpression(node.callee.object.callee) &&
          t.isIdentifier(node.callee.object.callee.object) &&
          node.callee.object.callee.object.name === 'Object' &&
          t.isIdentifier(node.callee.object.callee.property) &&
          node.callee.object.callee.property.name === 'keys') {
        
        // Check if map function is key => obj[key] pattern
        const mapArg = node.arguments[0];
        if (t.isArrowFunctionExpression(mapArg) &&
            mapArg.params.length === 1 &&
            t.isIdentifier(mapArg.params[0])) {
          
          const keyParam = mapArg.params[0].name;
          
          if (t.isMemberExpression(mapArg.body) &&
              mapArg.body.computed &&
              t.isIdentifier(mapArg.body.property) &&
              mapArg.body.property.name === keyParam) {
            
            const loc = node.loc;
            if (!loc) return;

            const objCode = context.sourceCode.slice(node.callee.object.arguments[0].start!, node.callee.object.arguments[0].end!);
            
            context.report({
              file: context.filename,
              line: loc.start.line,
              column: loc.start.column,
              oldCode: `Object.keys(${objCode}).map(key => ${objCode}[key])`,
              newCode: `Object.values(${objCode})`,
              description: 'Object.values() is Baseline stable and more direct than keys().map()',
              category: 'javascript',
              baselineStatus: 'high',
              ruleId: 'object-methods',
              severity: 'info'
            });
          }
        }
      }
    }
    
    // Pattern: for-in with hasOwnProperty -> Object.keys() or Object.entries()
    if (t.isForInStatement(node)) {
      // Look for hasOwnProperty check in the body
      if (t.isBlockStatement(node.body) && 
          hasHasOwnPropertyCheck(node.body, node.left)) {
        
        const loc = node.loc;
        if (!loc) return;

        const objCode = context.sourceCode.slice(node.right.start!, node.right.end!);
        
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: 'for-in with hasOwnProperty check',
          newCode: `Object.keys(${objCode}).forEach()`,
          description: 'Object.keys() is more explicit and doesn\'t require hasOwnProperty checks',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'object-methods',
          severity: 'info'
        });
      }
    }
  }
};

function hasHasOwnPropertyCheck(blockStatement: any, keyVariable: any): boolean {
  if (!blockStatement.body || !t.isIdentifier(keyVariable)) return false;
  
  for (const stmt of blockStatement.body) {
    if (t.isIfStatement(stmt) && 
        t.isCallExpression(stmt.test) &&
        t.isMemberExpression(stmt.test.callee) &&
        t.isIdentifier(stmt.test.callee.property) &&
        stmt.test.callee.property.name === 'hasOwnProperty' &&
        stmt.test.arguments.length === 1 &&
        t.isIdentifier(stmt.test.arguments[0]) &&
        stmt.test.arguments[0].name === keyVariable.name) {
      return true;
    }
  }
  return false;
};