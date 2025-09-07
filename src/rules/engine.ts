import { parse, ParserOptions } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { Node } from '@babel/types';
import { Rule, RuleContext, Match, Suggestion } from './types';

export class RuleEngine {
  private rules: Rule[] = [];

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  addRules(rules: Rule[]): void {
    this.rules.push(...rules);
  }

  async analyzeFile(filePath: string, content: string): Promise<Suggestion[]> {
    try {
      // Parse the file content to AST
      const ast = this.parseCode(content, filePath);
      
      // Create rule context
      const context: RuleContext = {
        filePath,
        fileContent: content,
        sourceCode: content,
      };

      const suggestions: Suggestion[] = [];

      // Apply each rule to the AST
      for (const rule of this.rules) {
        const matches = this.applyRule(rule, ast, context);
        
        // Convert matches to suggestions
        for (const match of matches) {
          const suggestion = rule.suggest(match);
          suggestions.push(suggestion);
        }
      }

      return suggestions;
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}: ${error}`);
      return [];
    }
  }

  private parseCode(content: string, filePath: string): Node {
    // Determine parser options based on file extension
    const isTypeScript = /\.(ts|tsx)$/.test(filePath);
    const isJSX = /\.(jsx|tsx)$/.test(filePath);

    const parserOptions: ParserOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'asyncGenerators',
        'bigInt',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy',
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'functionBind',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        'throwExpressions',
        'topLevelAwait',
        'importMeta',
      ],
    };

    if (isTypeScript) {
      parserOptions.plugins!.push('typescript');
    }

    if (isJSX) {
      parserOptions.plugins!.push('jsx');
    }

    return parse(content, parserOptions);
  }

  private applyRule(rule: Rule, ast: Node, context: RuleContext): Match[] {
    const matches: Match[] = [];

    traverse(ast, {
      enter(path: NodePath) {
        try {
          const ruleMatches = rule.detect(path.node, context);
          matches.push(...ruleMatches);
        } catch (error) {
          // Silently ignore rule application errors to continue processing
        }
      },
    });

    return matches;
  }

  getRules(): Rule[] {
    return [...this.rules];
  }

  getRuleById(id: string): Rule | undefined {
    return this.rules.find(rule => rule.id === id);
  }
}