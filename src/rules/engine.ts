import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import postcss from 'postcss';
import { RuleDefinition, RuleContext, ModernizationSuggestion, RuleConfig } from './types';

export class RuleEngine {
  private rules: Map<string, RuleDefinition> = new Map();
  private config: RuleConfig = {};

  constructor(config: RuleConfig = {}) {
    this.config = config;
  }

  registerRule(ruleId: string, rule: RuleDefinition): void {
    this.rules.set(ruleId, rule);
  }

  analyzeFile(filename: string, content: string): ModernizationSuggestion[] {
    const suggestions: ModernizationSuggestion[] = [];
    
    const context: RuleContext = {
      filename,
      sourceCode: content,
      report: (suggestion) => suggestions.push(suggestion)
    };

    const ext = this.getFileExtension(filename);
    
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      this.analyzeJavaScript(content, context);
    } else if (ext === '.css') {
      this.analyzeCSS(content, context);
    }
    
    // Run pattern-based rules for all files
    this.analyzePatterns(context);
    
    return suggestions.filter(suggestion => this.isRuleEnabled(suggestion.ruleId));
  }

  private analyzeJavaScript(content: string, context: RuleContext): void {
    try {
      const ast = parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'objectRestSpread',
          'functionBind',
          'asyncGenerators',
          'functionSent',
          'dynamicImport'
        ]
      });

      // Collect active JavaScript rules
      const activeRules: Array<[string, RuleDefinition]> = [];
      for (const [ruleId, rule] of this.rules) {
        if (this.isRuleEnabled(ruleId) && rule.visitNode) {
          activeRules.push([ruleId, rule]);
        }
      }

      // Single AST traversal for all rules
      traverse(ast, {
        enter: (path) => {
          for (const [ruleId, rule] of activeRules) {
            try {
              rule.visitNode!(path.node, context);
            } catch (error) {
              console.warn(`Rule ${ruleId} failed:`, error);
            }
          }
        }
      });
    } catch (error) {
      console.warn(`Failed to parse JavaScript file ${context.filename}:`, error);
    }
  }

  private analyzeCSS(content: string, context: RuleContext): void {
    try {
      const root = postcss.parse(content);
      
      for (const [ruleId, rule] of this.rules) {
        if (this.isRuleEnabled(ruleId) && rule.visitCSSRule) {
          root.walkRules((cssRule: any) => {
            try {
              rule.visitCSSRule!(cssRule, context);
            } catch (error) {
              console.warn(`Rule ${ruleId} failed:`, error);
            }
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to parse CSS file ${context.filename}:`, error);
    }
  }

  private analyzePatterns(context: RuleContext): void {
    for (const [ruleId, rule] of this.rules) {
      if (this.isRuleEnabled(ruleId) && rule.visitPattern) {
        try {
          rule.visitPattern(context);
        } catch (error) {
          console.warn(`Rule ${ruleId} failed:`, error);
        }
      }
    }
  }

  private isRuleEnabled(ruleId: string): boolean {
    const config = this.config[ruleId];
    if (!config) return true; // Default enabled
    if (config === 'off') return false;
    return true;
  }

  private getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
  }

  getRules(): string[] {
    return Array.from(this.rules.keys());
  }
}