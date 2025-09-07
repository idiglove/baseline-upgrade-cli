import * as t from '@babel/types';
import { RuleDefinition, RuleContext } from './types';

export const arrayAtMethodRule: RuleDefinition = {
  name: 'array-at-method',
  description: 'Replace arr[arr.length - N] with Array.at(-N) for negative indexing',
  category: 'javascript',
  severity: 'info',
  baselineStatus: 'high',
  
  visitNode: (node: any, context: RuleContext) => {
    // Pattern: arr[arr.length - N]
    if (t.isMemberExpression(node) && 
        node.computed &&
        t.isBinaryExpression(node.property) &&
        node.property.operator === '-') {
      
      // Check if left side is obj.length where obj matches the array being accessed
      const leftSide = node.property.left;
      if (t.isMemberExpression(leftSide) &&
          t.isIdentifier(leftSide.property) &&
          leftSide.property.name === 'length') {
        
        // Check if the object in arr.length matches the array being accessed
        const arrayObj = node.object;
        const lengthObj = leftSide.object;
        
        if (t.isIdentifier(arrayObj) && t.isIdentifier(lengthObj) &&
            arrayObj.name === lengthObj.name) {
          
          const loc = node.loc;
          if (!loc) return;

          const arrayName = arrayObj.name;
          const rightSide = node.property.right;
          
          let negativeIndex = '-1';
          if (t.isNumericLiteral(rightSide)) {
            negativeIndex = `-${rightSide.value}`;
          }

          context.report({
            file: context.filename,
            line: loc.start.line,
            column: loc.start.column,
            oldCode: `${arrayName}[${arrayName}.length - ${t.isNumericLiteral(rightSide) ? rightSide.value : 'N'}]`,
            newCode: `${arrayName}.at(${negativeIndex})`,
            description: 'Array.at() is Baseline stable and provides cleaner negative indexing',
            category: 'javascript',
            baselineStatus: 'high',
            ruleId: 'array-at-method',
            severity: 'info'
          });
        }
      }
    }
  }
};