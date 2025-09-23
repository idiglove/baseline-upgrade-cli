import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const arrayFlatMethodRule: RuleDefinition = {
  name: 'array-flat-method',
  description: 'Replace reduce with concat patterns with Array.flat()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: arr.reduce((acc, val) => acc.concat(val), [])
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'reduce' &&
        node.arguments.length >= 2) {
      
      const reduceCallback = node.arguments[0];
      const initialValue = node.arguments[1];
      
      // Check if initial value is empty array
      if (t.isArrayExpression(initialValue) && initialValue.elements.length === 0) {
        // Check if callback uses concat
        if ((t.isArrowFunctionExpression(reduceCallback) || t.isFunctionExpression(reduceCallback)) &&
            reduceCallback.params.length === 2) {
          
          const body = reduceCallback.body;
          let usesConcat = false;
          
          // Check if body is acc.concat(val) pattern
          if (t.isCallExpression(body) &&
              t.isMemberExpression(body.callee) &&
              t.isIdentifier(body.callee.property) &&
              body.callee.property.name === 'concat') {
            usesConcat = true;
          }
          
          // Or check if body is { return acc.concat(val) }
          if (t.isBlockStatement(body) && body.body.length === 1) {
            const returnStmt = body.body[0];
            if (t.isReturnStatement(returnStmt) && returnStmt.argument &&
                t.isCallExpression(returnStmt.argument) &&
                t.isMemberExpression(returnStmt.argument.callee) &&
                t.isIdentifier(returnStmt.argument.callee.property) &&
                returnStmt.argument.callee.property.name === 'concat') {
              usesConcat = true;
            }
          }
          
          if (usesConcat) {
            const loc = node.loc;
            if (!loc) return;

            const arrayCode = context.sourceCode.slice(node.callee.object.start!, node.callee.object.end!);

            context.report({
              file: context.filename,
              line: loc.start.line,
              column: loc.start.column,
              oldCode: 'reduce with concat for flattening',
              newCode: `${arrayCode}.flat()`,
              description: 'Array.flat() is Baseline stable and more readable than reduce with concat',
              category: 'javascript',
              baselineStatus: 'high',
              ruleId: 'array-flat-method',
              severity: 'info'
            });
          }
        }
      }
    }
    
    // Pattern: [].concat(...arrays) -> arrays.flat()
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'concat' &&
        t.isArrayExpression(node.callee.object) &&
        node.callee.object.elements.length === 0) {
      
      // Check if arguments use spread operator
      const hasSpreadArgs = node.arguments.some((arg: any) => t.isSpreadElement(arg));
      
      if (hasSpreadArgs && node.arguments.length === 1 && t.isSpreadElement(node.arguments[0])) {
        const loc = node.loc;
        if (!loc) return;

        const arrayCode = context.sourceCode.slice(node.arguments[0].argument.start!, node.arguments[0].argument.end!);

        context.report({
          file: context.filename,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: `[].concat(...${arrayCode})`,
          newCode: `${arrayCode}.flat()`,
          description: 'Array.flat() is more direct than empty array concat with spread',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'array-flat-method',
          severity: 'info'
        });
      }
    }
  }
};