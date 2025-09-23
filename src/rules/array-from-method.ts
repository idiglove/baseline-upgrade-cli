import * as t from '@babel/types';
import { RuleDefinition, RuleContext, AutofixCapable } from './types';

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

          const suggestion = {
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: `new Array(${sizeCode}).fill().map(${callbackCode})`,
            newCode: `Array.from({length: ${sizeCode}}, ${callbackCode})`,
            description: 'Array.from() is Baseline stable and more direct for array generation',
            category: 'javascript' as const,
            baselineStatus: 'high' as const,
            ruleId: 'array-from-method',
            severity: 'info' as const,
            // Autofix capability - provide exact position information
            startLine: loc.start.line,
            startColumn: loc.start.column,
            endLine: loc.end.line,
            endColumn: loc.end.column
          };

          context.report(suggestion);
          
          // Report autofix if supported
          if (context.reportAutofix) {
            context.reportAutofix(suggestion);
          }
        }
      }
    }
    
    // Note: Removed overly broad spread element detection
    // Object spread (...obj) is already modern and should not be flagged
    // Array.from() should only be suggested for specific cases like:
    // [...document.querySelectorAll()] -> Array.from(document.querySelectorAll())
  }
};