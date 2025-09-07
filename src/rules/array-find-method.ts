import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const arrayFindMethodRule: RuleDefinition = {
  name: 'array-find-method',
  description: 'Replace manual loops with Array.find() and Array.findIndex()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: for loop with break when item found
    if (t.isForStatement(node) && node.body && t.isBlockStatement(node.body)) {
      const hasBreak = hasBreakStatement(node.body);
      const hasReturn = hasReturnStatement(node.body);
      
      if (hasBreak || hasReturn) {
        const loc = node.loc;
        if (!loc) return;

        const suggestion = hasReturn ? 'Array.find()' : 'Array.findIndex()';

        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: 'for loop with break/return',
          newCode: suggestion,
          description: `${suggestion} is Baseline stable and more readable than manual loops`,
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'array-find-method',
          severity: 'info'
        });
      }
    }
    
    // Pattern: arr.filter(condition)[0] -> should use find()
    if (t.isMemberExpression(node) &&
        node.computed &&
        t.isNumericLiteral(node.property) &&
        node.property.value === 0 &&
        t.isCallExpression(node.object) &&
        t.isMemberExpression(node.object.callee) &&
        t.isIdentifier(node.object.callee.property) &&
        node.object.callee.property.name === 'filter') {
      
      const loc = node.loc;
      if (!loc) return;

      const arrayCode = context.sourceCode.slice(node.object.callee.object.start!, node.object.callee.object.end!);
      const filterArg = context.sourceCode.slice(node.object.arguments[0].start!, node.object.arguments[0].end!);

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: `${arrayCode}.filter(${filterArg})[0]`,
        newCode: `${arrayCode}.find(${filterArg})`,
        description: 'Array.find() is more efficient and clearer than filter()[0]',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'array-find-method',
        severity: 'info'
      });
    }
  }
};

// Helper functions
function hasBreakStatement(blockStatement: any): boolean {
  return findInBlock(blockStatement, t.isBreakStatement);
}

function hasReturnStatement(blockStatement: any): boolean {
  return findInBlock(blockStatement, t.isReturnStatement);
}

function findInBlock(blockStatement: any, predicate: (node: any) => boolean): boolean {
  if (!blockStatement.body) return false;
  
  for (const stmt of blockStatement.body) {
    if (predicate(stmt)) return true;
    if (t.isIfStatement(stmt)) {
      if (stmt.consequent && findInBlock(stmt.consequent, predicate)) return true;
      if (stmt.alternate && findInBlock(stmt.alternate, predicate)) return true;
    }
  }
  return false;
};