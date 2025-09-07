import { Node, isVariableDeclaration } from '@babel/types';
import { Rule, RuleContext, Match, Suggestion } from './types';

export const varToConstLetRule: Rule = {
  id: 'var-to-const-let',
  name: 'Convert var to const/let',
  description: 'Replace var declarations with const or let for better block scoping',
  category: 'javascript',
  baselineFeature: 'es6-block-scoping',

  detect(node: Node, context: RuleContext): Match[] {
    const matches: Match[] = [];

    if (isVariableDeclaration(node) && node.kind === 'var') {
      // Get the line and column information
      const loc = node.loc;
      if (!loc) return matches;

      // Extract the original code for this declaration
      const lines = context.sourceCode.split('\n');
      const startLine = loc.start.line - 1;
      const endLine = loc.end.line - 1;
      
      let oldCode = '';
      if (startLine === endLine) {
        oldCode = lines[startLine].slice(loc.start.column, loc.end.column);
      } else {
        // Handle multi-line declarations
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
    const node = match.node;
    
    if (!isVariableDeclaration(node)) {
      throw new Error('Invalid node type for var-to-const-let rule');
    }

    // Determine if this should be const or let based on reassignment analysis
    const shouldBeConst = !isReassigned(node);
    const newKeyword = shouldBeConst ? 'const' : 'let';
    const newCode = match.oldCode.replace(/^var\b/, newKeyword);

    return {
      file: match.filePath,
      line: match.line,
      column: match.column,
      oldCode: match.oldCode,
      newCode,
      message: `Use '${newKeyword}' instead of 'var' for ${shouldBeConst ? 'immutable' : 'block-scoped'} declarations`,
      category: 'javascript',
      baselineStatus: 'stable',
      confidence: 'high',
      ruleId: 'var-to-const-let',
    };
  },
};

// Helper function to determine if a variable is reassigned
function isReassigned(varDeclaration: any): boolean {
  // For now, we'll use a simple heuristic:
  // - If there's no initializer, it's likely reassigned later (use let)
  // - If there's an initializer, assume it's not reassigned (use const)
  // This is a simplified analysis - a full implementation would need scope analysis
  
  if (!varDeclaration.declarations || varDeclaration.declarations.length === 0) {
    return true; // No declarations, assume reassignment
  }

  // Check if any declaration lacks an initializer
  const hasUninitializedDeclaration = varDeclaration.declarations.some(
    (decl: any) => !decl.init
  );

  return hasUninitializedDeclaration;
}