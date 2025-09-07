import { Node, isNewExpression, isIdentifier } from '@babel/types';
import { Rule, RuleContext, Match, Suggestion } from './types';

export const xhrToFetchRule: Rule = {
  id: 'xhr-to-fetch',
  name: 'Convert XMLHttpRequest to fetch()',
  description: 'Replace XMLHttpRequest with modern fetch() API for cleaner Promise-based syntax',
  category: 'javascript',
  baselineFeature: 'fetch',

  detect(node: Node, context: RuleContext): Match[] {
    const matches: Match[] = [];

    // Look for new XMLHttpRequest() expressions
    if (isNewExpression(node) && 
        isIdentifier(node.callee) && 
        node.callee.name === 'XMLHttpRequest') {
      
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
        // Handle multi-line (though XMLHttpRequest constructor is usually single line)
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

    return matches;
  },

  suggest(match: Match): Suggestion {
    // For XMLHttpRequest, we suggest using fetch() instead
    // This is a high-level suggestion - the actual conversion would be complex
    const newCode = 'fetch(url)';
    
    return {
      file: match.filePath,
      line: match.line,
      column: match.column,
      oldCode: match.oldCode,
      newCode,
      message: 'fetch() is Baseline stable and provides cleaner Promise-based syntax',
      category: 'javascript',
      baselineStatus: 'stable',
      confidence: 'medium', // Medium because conversion requires more context
      ruleId: 'xhr-to-fetch',
    };
  },
};