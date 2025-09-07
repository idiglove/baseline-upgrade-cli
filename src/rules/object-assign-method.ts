import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const objectAssignMethodRule: RuleDefinition = {
  name: 'object-assign-method',
  description: 'Replace manual property copying with Object.assign()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: for-in loop copying properties
    if (t.isForInStatement(node)) {
      // Look for assignment pattern in the body: target[key] = source[key]
      if (t.isBlockStatement(node.body) &&
          hasCopyingPattern(node.body, node.left, node.right)) {
        
        const loc = node.loc;
        if (!loc) return;

        const sourceCode = context.sourceCode.slice(node.right.start!, node.right.end!);
        
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: 'for-in loop copying properties',
          newCode: `Object.assign(target, ${sourceCode})`,
          description: 'Object.assign() is Baseline stable and more concise than manual property copying',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'object-assign-method',
          severity: 'info'
        });
      }
    }
    
    // Pattern: Manual object spreading before Object.assign
    // var result = {}; result.a = obj1.a; result.b = obj2.b; etc.
    if (t.isVariableDeclarator(node) &&
        t.isObjectExpression(node.init) &&
        node.init.properties.length === 0) {
      
      // This is a simple heuristic - empty object followed by property assignments
      // might benefit from Object.assign
      const loc = node.loc;
      if (!loc) return;

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: 'empty object with manual property assignment',
        newCode: 'Object.assign() or object spread syntax',
        description: 'Consider Object.assign() or spread syntax for object composition',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'object-assign-method',
        severity: 'info'
      });
    }
    
    // Pattern: Multiple property assignments that could be Object.assign
    if (t.isAssignmentExpression(node) && 
        t.isMemberExpression(node.left) &&
        node.operator === '=') {
      
      // Look for patterns like: obj.prop1 = source.prop1; obj.prop2 = source.prop2
      // This would require more sophisticated analysis, so we'll keep it simple
      const loc = node.loc;
      if (!loc) return;

      // Only suggest if the right side is a member expression (copying from another object)
      if (t.isMemberExpression(node.right)) {
        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: 'manual property assignment',
          newCode: 'Object.assign() for multiple properties',
          description: 'Consider Object.assign() for copying multiple properties',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'object-assign-method',
          severity: 'info'
        });
      }
    }
  }
};

function hasCopyingPattern(blockStatement: any, keyVariable: any, sourceObject: any): boolean {
  if (!blockStatement.body || !t.isIdentifier(keyVariable)) return false;
  
  for (const stmt of blockStatement.body) {
    // Look for: target[key] = source[key]
    if (t.isExpressionStatement(stmt) &&
        t.isAssignmentExpression(stmt.expression) &&
        stmt.expression.operator === '=' &&
        t.isMemberExpression(stmt.expression.left) &&
        stmt.expression.left.computed &&
        t.isIdentifier(stmt.expression.left.property) &&
        stmt.expression.left.property.name === keyVariable.name &&
        t.isMemberExpression(stmt.expression.right) &&
        stmt.expression.right.computed &&
        t.isIdentifier(stmt.expression.right.property) &&
        stmt.expression.right.property.name === keyVariable.name) {
      return true;
    }
  }
  return false;
}