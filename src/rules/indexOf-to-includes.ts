import { Node, isBinaryExpression, isCallExpression, isMemberExpression, isIdentifier, isUnaryExpression } from '@babel/types';
import { Rule, RuleContext, Match, Suggestion } from './types';

export const indexOfToIncludesRule: Rule = {
  id: 'indexof-to-includes',
  name: 'Convert indexOf() !== -1 to includes()',
  description: 'Replace Array.indexOf() !== -1 pattern with more readable Array.includes()',
  category: 'javascript',
  baselineFeature: 'array-includes',

  detect(node: Node, context: RuleContext): Match[] {
    const matches: Match[] = [];

    // Look for patterns like: arr.indexOf(item) !== -1 or arr.indexOf(item) != -1
    if (isBinaryExpression(node) && 
        (node.operator === '!==' || node.operator === '!=' || node.operator === '>')) {
      
      let indexOfCall = null;
      let comparisonValue = null;

      // Check if left side is indexOf call and right side is -1
      if (isCallExpression(node.left) && 
          isMemberExpression(node.left.callee) &&
          isIdentifier(node.left.callee.property) &&
          node.left.callee.property.name === 'indexOf') {
        
        // Check if comparing with -1
        if ((node.operator === '!==' || node.operator === '!=') && 
            isUnaryExpression(node.right) && 
            node.right.operator === '-' && 
            node.right.argument.type === 'NumericLiteral' && 
            (node.right.argument as any).value === 1) {
          indexOfCall = node.left;
          comparisonValue = -1;
        }
        // Check if comparing with >= 0 pattern
        else if (node.operator === '>' && 
                 isUnaryExpression(node.right) && 
                 node.right.operator === '-' && 
                 node.right.argument.type === 'NumericLiteral' && 
                 (node.right.argument as any).value === 1) {
          indexOfCall = node.left;
          comparisonValue = -1;
        }
      }
      
      // Check if right side is indexOf call and left side is -1 (reverse comparison)
      else if (isCallExpression(node.right) && 
               isMemberExpression(node.right.callee) &&
               isIdentifier(node.right.callee.property) &&
               node.right.callee.property.name === 'indexOf' &&
               (node.operator === '!==' || node.operator === '!=') &&
               isUnaryExpression(node.left) && 
               node.left.operator === '-' && 
               node.left.argument.type === 'NumericLiteral' && 
               (node.left.argument as any).value === 1) {
        indexOfCall = node.right;
        comparisonValue = -1;
      }

      if (indexOfCall) {
        const loc = node.loc;
        if (!loc) return matches;

        // Extract the original code
        const lines = context.sourceCode.split('\n');
        const startLine = loc.start.line - 1;
        const endLine = loc.end.line - 1;
        
        let oldCode = '';
        if (startLine === endLine) {
          oldCode = lines[startLine].slice(loc.start.column, loc.end.column);
        } else {
          oldCode = lines[startLine].slice(loc.start.column);
          for (let i = startLine + 1; i < endLine; i++) {
            oldCode += '\n' + lines[i];
          }
          oldCode += '\n' + lines[endLine].slice(0, loc.end.column);
        }

        matches.push({
          node,
          filePath: context.filePath,
          line: loc.start.line,
          column: loc.start.column,
          oldCode: oldCode.trim(),
        });
      }
    }

    return matches;
  },

  suggest(match: Match): Suggestion {
    const node = match.node;
    
    if (!isBinaryExpression(node)) {
      throw new Error('Invalid node type for indexOf-to-includes rule');
    }

    // Extract the array and search argument from the indexOf call
    let indexOfCall = null;
    if (isCallExpression(node.left) && 
        isMemberExpression(node.left.callee) &&
        isIdentifier(node.left.callee.property) &&
        node.left.callee.property.name === 'indexOf') {
      indexOfCall = node.left;
    } else if (isCallExpression(node.right) && 
               isMemberExpression(node.right.callee) &&
               isIdentifier(node.right.callee.property) &&
               node.right.callee.property.name === 'indexOf') {
      indexOfCall = node.right;
    }

    if (!indexOfCall || !isMemberExpression(indexOfCall.callee)) {
      throw new Error('Could not extract indexOf call');
    }

    // Generate the includes() replacement
    const arrayPart = match.oldCode.split('.indexOf(')[0];
    const argumentPart = match.oldCode.split('.indexOf(')[1]?.split(')')[0];
    
    const newCode = `${arrayPart}.includes(${argumentPart})`;

    return {
      file: match.filePath,
      line: match.line,
      column: match.column,
      oldCode: match.oldCode,
      newCode,
      message: 'Array.includes() is more readable than indexOf() !== -1 and is Baseline stable',
      category: 'javascript',
      baselineStatus: 'stable',
      confidence: 'high',
      ruleId: 'indexof-to-includes',
    };
  },
};