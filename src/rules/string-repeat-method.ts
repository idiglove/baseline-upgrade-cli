import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const stringRepeatMethodRule: RuleDefinition = {
  name: 'string-repeat-method',
  description: 'Replace new Array(n + 1).join(str) pattern with String.repeat()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: new Array(n + 1).join(str)
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'join' &&
        node.arguments.length === 1) {
      
      // Check if called on new Array(n + 1) or new Array(n).fill(str)
      if (t.isNewExpression(node.callee.object) &&
          t.isIdentifier(node.callee.object.callee) &&
          node.callee.object.callee.name === 'Array' &&
          node.callee.object.arguments.length === 1) {
        
        const arrayArg = node.callee.object.arguments[0];
        const joinArg = node.arguments[0];
        
        // Check for n + 1 pattern
        if (t.isBinaryExpression(arrayArg) && arrayArg.operator === '+' &&
            t.isNumericLiteral(arrayArg.right) && arrayArg.right.value === 1) {
          
          const loc = node.loc;
          if (!loc) return;

          const countCode = context.sourceCode.slice(arrayArg.left.start!, arrayArg.left.end!);
          const strCode = context.sourceCode.slice(joinArg.start!, joinArg.end!);

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: `new Array(${countCode} + 1).join(${strCode})`,
            newCode: `${strCode}.repeat(${countCode})`,
            description: 'String.repeat() is Baseline stable and clearer than Array join trick',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'string-repeat-method',
            severity: 'info'
          });
        }
        
        // Also check for simple new Array(n).join(str) pattern
        else {
          const loc = node.loc;
          if (!loc) return;

          const countCode = context.sourceCode.slice(arrayArg.start!, arrayArg.end!);
          const strCode = context.sourceCode.slice(joinArg.start!, joinArg.end!);

          // Only suggest if count > 1 (since repeat(0) creates empty string)
          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: `new Array(${countCode}).join(${strCode})`,
            newCode: `${strCode}.repeat(${countCode} - 1)`,
            description: 'Consider String.repeat() instead of Array join for string repetition',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'string-repeat-method',
            severity: 'info'
          });
        }
      }
      
      // Pattern: Array.from({length: n}, () => str).join('')
      if (t.isCallExpression(node.callee.object) &&
          t.isMemberExpression(node.callee.object.callee) &&
          t.isIdentifier(node.callee.object.callee.object) &&
          node.callee.object.callee.object.name === 'Array' &&
          t.isIdentifier(node.callee.object.callee.property) &&
          node.callee.object.callee.property.name === 'from') {
        
        // Check if join argument is empty string
        if (t.isStringLiteral(node.arguments[0]) && node.arguments[0].value === '') {
          const loc = node.loc;
          if (!loc) return;

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: 'Array.from pattern for string repetition',
            newCode: 'str.repeat(n)',
            description: 'String.repeat() is more direct for string repetition than Array.from',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'string-repeat-method',
            severity: 'info'
          });
        }
      }
    }
  }
};