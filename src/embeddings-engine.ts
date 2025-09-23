import * as webFeatures from 'web-features';

export interface ModernizationSuggestion {
  file: string;
  line: number;
  column: number;
  oldCode: string;
  newCode: string;
  feature: string;
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  description: string;
  confidence: number; // 0-1 score
  impact: 'high' | 'medium' | 'low';
}

export interface PatternMapping {
  pattern: string;
  featureKey: string;
  modernSyntax: string;
  description: string;
  searchTerms: string[];
}

/**
 * Embeddings-based modernization engine that uses Baseline web features data
 * to suggest JavaScript modernization opportunities using semantic similarity
 */
export class EmbeddingsEngine {
  private patterns: PatternMapping[] = [];
  private features: typeof webFeatures.features;

  constructor() {
    this.features = webFeatures.features;
    this.initializePatterns();
  }

  /**
   * Initialize pattern mappings from Baseline features to modernization opportunities
   */
  private initializePatterns(): void {
    // JavaScript core language features
    this.addPattern({
      pattern: 'var\\s+\\w+',
      featureKey: 'let-const',
      modernSyntax: 'const/let declarations',
      description: 'Use const or let instead of var for block-scoped variables',
      searchTerms: ['var', 'variable declaration', 'block scope', 'hoisting']
    });

    // Fetch API
    this.addPattern({
      pattern: 'XMLHttpRequest|new\\s+XMLHttpRequest',
      featureKey: 'fetch',
      modernSyntax: 'fetch() API',
      description: 'Use fetch() for cleaner Promise-based HTTP requests',
      searchTerms: ['XMLHttpRequest', 'XHR', 'AJAX', 'HTTP request', 'asynchronous']
    });

    // Array methods
    this.addPattern({
      pattern: '\\.indexOf\\s*\\([^)]+\\)\\s*(!==?\\s*-1|>=?\\s*0)',
      featureKey: 'array-includes',
      modernSyntax: 'Array.includes()',
      description: 'Use Array.includes() for cleaner boolean checks',
      searchTerms: ['indexOf', 'array search', 'contains', 'includes']
    });

    // Promise constructor patterns -> async/await
    this.addPattern({
      pattern: 'new\\s+Promise\\s*\\(',
      featureKey: 'async-await',
      modernSyntax: 'async/await',
      description: 'Consider using async/await for cleaner asynchronous code',
      searchTerms: ['Promise', 'asynchronous', 'async', 'await', 'then', 'catch']
    });

    // Array methods for newer features
    this.addPattern({
      pattern: 'for\\s*\\([^)]*\\)\\s*{[^}]*\\.push\\(',
      featureKey: 'array-from',
      modernSyntax: 'Array.from() or spread syntax',
      description: 'Consider Array.from() or spread syntax for array creation',
      searchTerms: ['array creation', 'loop push', 'iteration', 'map']
    });

  }

  private addPattern(pattern: PatternMapping): void {
    this.patterns.push(pattern);
  }

  /**
   * Analyze code and return modernization suggestions
   */
  async analyzeCode(code: string, filePath: string): Promise<ModernizationSuggestion[]> {
    const suggestions: ModernizationSuggestion[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of this.patterns) {
        const regex = new RegExp(pattern.pattern, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          const feature = this.features[pattern.featureKey];
          
          if (feature) {
            const suggestion: ModernizationSuggestion = {
              file: filePath,
              line: i + 1,
              column: match.index + 1,
              oldCode: match[0],
              newCode: pattern.modernSyntax,
              feature: feature.name,
              baselineStatus: feature.status?.baseline as any || 'not supported',
              description: pattern.description,
              confidence: this.calculateConfidence(pattern, match[0]),
              impact: this.calculateImpact(pattern.featureKey)
            };

            suggestions.push(suggestion);
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Calculate confidence score based on pattern match quality
   */
  private calculateConfidence(pattern: PatternMapping, matchedCode: string): number {
    // Simple confidence scoring based on pattern specificity
    let confidence = 0.8; // Base confidence

    // Boost confidence for exact matches with known patterns
    if (pattern.featureKey === 'let-const' && matchedCode.startsWith('var ')) {
      confidence = 0.95;
    } else if (pattern.featureKey === 'fetch' && matchedCode.includes('XMLHttpRequest')) {
      confidence = 0.9;
    } else if (pattern.featureKey === 'array-includes' && matchedCode.includes('indexOf')) {
      confidence = 0.85;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate impact score based on modernization benefits
   */
  private calculateImpact(featureKey: string): 'high' | 'medium' | 'low' {
    const highImpact = ['fetch', 'async-await', 'let-const'];
    const mediumImpact = ['array-includes', 'array-from', 'object-spread'];
    
    if (highImpact.includes(featureKey)) {
      return 'high';
    } else if (mediumImpact.includes(featureKey)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get feature information for a given feature key
   */
  getFeatureInfo(featureKey: string): any {
    return this.features[featureKey];
  }

  /**
   * Get all available patterns for debugging/inspection
   */
  getPatterns(): PatternMapping[] {
    return this.patterns;
  }

  /**
   * Semantic similarity search (simplified implementation)
   * In a full implementation, this would use actual embeddings
   */
  private findSimilarFeatures(searchQuery: string): string[] {
    const results: string[] = [];
    
    // Simple keyword-based similarity for now
    // TODO: Replace with actual embedding similarity search
    for (const [key, feature] of Object.entries(this.features)) {
      const searchText = `${feature.name} ${feature.description || ''}`.toLowerCase();
      const queryLower = searchQuery.toLowerCase();
      
      if (searchText.includes(queryLower) || 
          queryLower.split(' ').some(term => searchText.includes(term))) {
        results.push(key);
      }
    }

    return results.slice(0, 10); // Limit results
  }
}