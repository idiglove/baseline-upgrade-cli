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

        // First report the issue for display
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

        // Then report with autofix capability if possible
        if (context.reportAutofix) {
          const autofixCode = generateAutofixForLoop(node, context.sourceCode, hasReturn);
          if (autofixCode) {
            context.reportAutofix({
              file: context.filename,
              line: loc.start.line,
              column: loc.start.column,
              oldCode: 'for loop with break/return',
              newCode: autofixCode,
              description: `${suggestion} is Baseline stable and more readable than manual loops`,
              category: 'javascript',
              baselineStatus: 'high',
              ruleId: 'array-find-method',
              severity: 'info',
              startLine: loc.start.line,
              startColumn: loc.start.column,
              endLine: loc.end.line,
              endColumn: loc.end.column
            });
          }
        }
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
      const oldCode = `${arrayCode}.filter(${filterArg})[0]`;
      const newCode = `${arrayCode}.find(${filterArg})`;

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode,
        newCode,
        description: 'Array.find() is more efficient and clearer than filter()[0]',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'array-find-method',
        severity: 'info'
      });

      // Report autofix capability
      if (context.reportAutofix) {
        context.reportAutofix({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode,
          newCode,
          description: 'Array.find() is more efficient and clearer than filter()[0]',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'array-find-method',
          severity: 'info',
          startLine: loc.start.line,
          startColumn: loc.start.column,
          endLine: loc.end.line,
          endColumn: loc.end.column
        });
      }
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
}

function generateAutofixForLoop(node: any, sourceCode: string, hasReturn: boolean): string | null {
  // This is a complex transformation that would require sophisticated AST analysis
  // For now, we'll return null to indicate that manual review is needed
  // In a full implementation, this would:
  // 1. Parse the for loop structure
  // 2. Extract the array being iterated
  // 3. Extract the condition being checked
  // 4. Generate the appropriate Array.find() or Array.findIndex() call
  
  // Simple pattern matching for basic cases could be implemented here
  // For the hackathon, we'll focus on the filter()[0] pattern which is easier to autofix
  return null;
};