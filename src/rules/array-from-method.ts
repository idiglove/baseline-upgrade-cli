import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const arrayFromMethodRule: RuleDefinition = {
  name: 'array-from-method',
  description: 'Replace new Array(n).fill().map() pattern with Array.from()',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: new Array(n).fill().map()
    if (t.isCallExpression(node) &&
        t.isMemberExpression(node.callee) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === 'map') {
      
      // Check if called on .fill()
      if (t.isCallExpression(node.callee.object) &&
          t.isMemberExpression(node.callee.object.callee) &&
          t.isIdentifier(node.callee.object.callee.property) &&
          node.callee.object.callee.property.name === 'fill') {
        
        // Check if called on new Array(n)
        if (t.isNewExpression(node.callee.object.callee.object) &&
            t.isIdentifier(node.callee.object.callee.object.callee) &&
            node.callee.object.callee.object.callee.name === 'Array' &&
            node.callee.object.callee.object.arguments.length === 1) {
          
          const loc = node.loc;
          if (!loc) return;

          const sizeArg = node.callee.object.callee.object.arguments[0];
          const mapCallback = node.arguments[0];
          
          let sizeCode = 'n';
          if (sizeArg.start !== undefined && sizeArg.start !== null && 
              sizeArg.end !== undefined && sizeArg.end !== null) {
            sizeCode = context.sourceCode.slice(sizeArg.start, sizeArg.end);
          }
          
          let callbackCode = 'callback';
          if (mapCallback && mapCallback.start !== undefined && mapCallback.start !== null &&
              mapCallback.end !== undefined && mapCallback.end !== null) {
            callbackCode = context.sourceCode.slice(mapCallback.start, mapCallback.end);
          }

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: `new Array(${sizeCode}).fill().map(${callbackCode})`,
            newCode: `Array.from({length: ${sizeCode}}, ${callbackCode})`,
            description: 'Array.from() is Baseline stable and more direct for array generation',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'array-from-method',
            severity: 'info'
          });
        }
      }
    }
    
    // Pattern: Array.from(arrayLike) instead of [...arrayLike] for non-iterables
    // This is informational to suggest Array.from for array-like objects
    if (t.isSpreadElement(node)) {
      const loc = node.loc;
      if (!loc) return;

      context.report({
        file: context.filename,
        line: loc.start.line,
        column: loc.start.column,
        oldCode: '[...arrayLike]',
        newCode: 'Array.from(arrayLike)',
        description: 'Consider Array.from() for converting array-like objects to arrays',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'array-from-method',
        severity: 'info'
      });
    }
  }
};