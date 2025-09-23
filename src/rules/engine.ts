import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { RuleDefinition, RuleContext, ModernizationSuggestion, RuleConfig, AutofixCapable } from './types';
import { AutofixEngine } from '../autofix/engine';
import { AutofixSuggestion, AutofixOptions, AutofixResult } from '../autofix/types';

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
    }
    
    // Run pattern-based rules for all files
    this.analyzePatterns(context);
    
    return suggestions.filter(suggestion => this.isRuleEnabled(suggestion.ruleId));
  }

  analyzeFileWithAutofix(filename: string, content: string): { 
    suggestions: ModernizationSuggestion[], 
    autofixSuggestions: AutofixSuggestion[] 
  } {
    const suggestions: ModernizationSuggestion[] = [];
    const autofixSuggestions: AutofixSuggestion[] = [];
    
    const context: RuleContext = {
      filename,
      sourceCode: content,
      report: (suggestion) => suggestions.push(suggestion),
      reportAutofix: (autofixableSuggestion) => {
        suggestions.push(autofixableSuggestion);
        autofixSuggestions.push(this.convertToAutofixSuggestion(autofixableSuggestion));
      }
    };

    const ext = this.getFileExtension(filename);
    
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
      this.analyzeJavaScript(content, context);
    }
    
    // Run pattern-based rules for all files
    this.analyzePatterns(context);
    
    const filteredSuggestions = suggestions.filter(suggestion => this.isRuleEnabled(suggestion.ruleId));
    const filteredAutofixSuggestions = autofixSuggestions.filter(suggestion => this.isRuleEnabled(suggestion.ruleId));
    
    return { 
      suggestions: filteredSuggestions, 
      autofixSuggestions: filteredAutofixSuggestions 
    };
  }

  applyAutofix(filename: string, content: string, options: AutofixOptions = {}): AutofixResult {
    const { autofixSuggestions } = this.analyzeFileWithAutofix(filename, content);
    const autofixEngine = new AutofixEngine(content, autofixSuggestions);
    return autofixEngine.applyFixes(options);
  }

  private convertToAutofixSuggestion(suggestion: ModernizationSuggestion & AutofixCapable): AutofixSuggestion {
    return {
      file: suggestion.file,
      ruleId: suggestion.ruleId,
      edit: {
        range: {
          start: { line: suggestion.startLine, column: suggestion.startColumn },
          end: { line: suggestion.endLine, column: suggestion.endColumn }
        },
        newText: suggestion.newCode
      },
      description: suggestion.description,
      category: suggestion.category,
      baselineStatus: suggestion.baselineStatus,
      severity: suggestion.severity
    };
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