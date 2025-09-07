import * as webFeaturesData from 'web-features/data.json';

export interface ModernizationSuggestion {
  file: string;
  line: number;
  column: number;
  oldCode: string;
  newCode: string;
  feature: string;
  featureName: string;
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  baselineStatusDisplay: string;
  description: string;
  confidence: number; // 0-1 score
  impact: 'high' | 'medium' | 'low';
  category: string;
}

export interface WebFeaturePattern {
  featureKey: string;
  featureName: string;
  pattern: RegExp;
  modernSyntax: string;
  description: string;
  baselineStatus: 'high' | 'low' | 'limited' | 'not supported';
  category: string;
  examples: {
    legacy: string;
    modern: string;
  }[];
}

/**
 * Web Features-based modernization engine that uses Baseline data
 * to suggest JavaScript modernization opportunities
 */
export class WebFeaturesEngine {
  private features: typeof webFeaturesData.features;
  private patterns: WebFeaturePattern[] = [];

  constructor() {
    this.features = webFeaturesData.features;
    this.initializePatternsFromWebFeatures();
  }

  /**
   * Initialize patterns from web-features data
   */
  private initializePatternsFromWebFeatures(): void {
    // Extract JavaScript modernization patterns from web-features
    this.extractFetchPatterns();
    this.extractArrayPatterns();
    this.extractVariableDeclarationPatterns();
    this.extractAsyncPatterns();
    this.extractObjectPatterns();
  }

  private extractFetchPatterns(): void {
    const fetchFeature = this.features.fetch;
    if (!fetchFeature) return;

    this.patterns.push({
      featureKey: 'fetch',
      featureName: fetchFeature.name,
      pattern: /new\s+XMLHttpRequest|XMLHttpRequest/g,
      modernSyntax: 'fetch() API',
      description: fetchFeature.description || 'Use fetch() for HTTP requests',
      baselineStatus: this.mapBaselineStatus(fetchFeature.status?.baseline),
      category: 'http_requests',
      examples: [
        {
          legacy: "var xhr = new XMLHttpRequest();\nxhr.open('GET', '/api/data');\nxhr.send();",
          modern: "fetch('/api/data')"
        },
        {
          legacy: "var request = new XMLHttpRequest();\nrequest.open('POST', '/api/users', true);\nrequest.setRequestHeader('Content-Type', 'application/json');\nrequest.send(JSON.stringify(data));",
          modern: "fetch('/api/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(data)\n})"
        }
      ]
    });
  }

  private extractArrayPatterns(): void {
    // Array.includes()
    const includesFeature = this.features['array-includes'];
    if (includesFeature) {
      this.patterns.push({
        featureKey: 'array-includes',
        featureName: includesFeature.name,
        pattern: /\.indexOf\s*\([^)]+\)\s*(!==?\s*-1|>=?\s*0)/g,
        modernSyntax: 'Array.includes()',
        description: includesFeature.description || 'Use Array.includes() for boolean checks',
        baselineStatus: this.mapBaselineStatus(includesFeature.status?.baseline),
        category: 'array_methods',
        examples: [
          {
            legacy: "if (arr.indexOf(item) !== -1) { /* found */ }",
            modern: "if (arr.includes(item)) { /* found */ }"
          },
          {
            legacy: "var hasItem = arr.indexOf('value') >= 0;",
            modern: "const hasItem = arr.includes('value');"
          }
        ]
      });
    }

    // Array.find()
    const findFeature = this.features['array-find'];
    if (findFeature) {
      this.patterns.push({
        featureKey: 'array-find',
        featureName: findFeature.name,
        pattern: /for\s*\([^)]*\)\s*{[^}]*break[^}]*}/g,
        modernSyntax: 'Array.find()',
        description: findFeature.description || 'Use Array.find() to search arrays',
        baselineStatus: this.mapBaselineStatus(findFeature.status?.baseline),
        category: 'array_methods',
        examples: [
          {
            legacy: "var found = null;\nfor (var i = 0; i < users.length; i++) {\n  if (users[i].active) {\n    found = users[i];\n    break;\n  }\n}",
            modern: "const found = users.find(user => user.active);"
          }
        ]
      });
    }

    // Array.from()
    const fromFeature = this.features['array-from'];
    if (fromFeature) {
      this.patterns.push({
        featureKey: 'array-from',
        featureName: fromFeature.name,
        pattern: /new\s+Array\([^)]*\)|Array\(\d+\)/g,
        modernSyntax: 'Array.from()',
        description: fromFeature.description || 'Use Array.from() for array creation',
        baselineStatus: this.mapBaselineStatus(fromFeature.status?.baseline),
        category: 'array_methods',
        examples: [
          {
            legacy: "var arr = new Array(10).fill(0);",
            modern: "const arr = Array.from({ length: 10 }, () => 0);"
          }
        ]
      });
    }
  }

  private extractVariableDeclarationPatterns(): void {
    const letConstFeature = this.features['let-const'];
    if (!letConstFeature) return;

    this.patterns.push({
      featureKey: 'let-const',
      featureName: letConstFeature.name,
      pattern: /\bvar\s+\w+/g,
      modernSyntax: 'const/let declarations',
      description: letConstFeature.description || 'Use const and let for block-scoped variables',
      baselineStatus: this.mapBaselineStatus(letConstFeature.status?.baseline),
      category: 'variable_declarations',
      examples: [
        {
          legacy: "var name = 'John';\nvar age = 25;",
          modern: "const name = 'John';\nconst age = 25;"
        },
        {
          legacy: "for (var i = 0; i < 10; i++) {\n  var item = items[i];\n}",
          modern: "for (let i = 0; i < 10; i++) {\n  const item = items[i];\n}"
        }
      ]
    });
  }

  private extractAsyncPatterns(): void {
    const asyncFeature = this.features['async-await'];
    if (!asyncFeature) return;

    this.patterns.push({
      featureKey: 'async-await',
      featureName: asyncFeature.name,
      pattern: /\.then\s*\(|\.catch\s*\(/g,
      modernSyntax: 'async/await',
      description: asyncFeature.description || 'Use async/await for cleaner asynchronous code',
      baselineStatus: this.mapBaselineStatus(asyncFeature.status?.baseline),
      category: 'asynchronous',
      examples: [
        {
          legacy: "fetchData().then(result => {\n  return processData(result);\n}).then(processed => {\n  console.log(processed);\n}).catch(error => {\n  console.error(error);\n});",
          modern: "try {\n  const result = await fetchData();\n  const processed = await processData(result);\n  console.log(processed);\n} catch (error) {\n  console.error(error);\n}"
        }
      ]
    });
  }

  private extractObjectPatterns(): void {
    // Object spread syntax (not directly in web-features but widely supported)
    this.patterns.push({
      featureKey: 'object-spread',
      featureName: 'Object spread syntax',
      pattern: /Object\.assign\s*\(\s*{}\s*,/g,
      modernSyntax: 'object spread syntax',
      description: 'Use object spread syntax for cleaner object merging',
      baselineStatus: 'high',
      category: 'object_operations',
      examples: [
        {
          legacy: "var updatedUser = Object.assign({}, user, { age: 30 });",
          modern: "const updatedUser = { ...user, age: 30 };"
        }
      ]
    });
  }

  /**
   * Map web-features baseline status to our format
   */
  private mapBaselineStatus(baseline: any): 'high' | 'low' | 'limited' | 'not supported' {
    if (baseline === 'high') return 'high';
    if (baseline === 'low') return 'low';
    if (baseline === false) return 'limited';
    return 'not supported';
  }

  /**
   * Get display text for Baseline status
   */
  private getBaselineStatusDisplay(baseline: 'high' | 'low' | 'limited' | 'not supported'): string {
    if (baseline === 'high') return 'widely available';
    if (baseline === 'low') return 'newly available';
    if (baseline === 'limited') return 'limited availability';
    return 'not supported';
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
        // Reset regex lastIndex to avoid issues with global patterns
        pattern.pattern.lastIndex = 0;
        let match;

        while ((match = pattern.pattern.exec(line)) !== null) {
          const suggestion: ModernizationSuggestion = {
            file: filePath,
            line: i + 1,
            column: match.index + 1,
            oldCode: match[0],
            newCode: pattern.modernSyntax,
            feature: pattern.featureKey,
            featureName: pattern.featureName,
            baselineStatus: pattern.baselineStatus,
            baselineStatusDisplay: this.getBaselineStatusDisplay(pattern.baselineStatus),
            description: pattern.description,
            confidence: this.calculateConfidence(pattern, match[0]),
            impact: this.calculateImpact(pattern.featureKey),
            category: pattern.category
          };

          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * Calculate confidence score based on pattern match quality
   */
  private calculateConfidence(pattern: WebFeaturePattern, matchedCode: string): number {
    // Base confidence for Baseline features
    let confidence = 0.8;

    // Boost confidence for high baseline features
    if (pattern.baselineStatus === 'high') {
      confidence = 0.95;
    } else if (pattern.baselineStatus === 'low') {
      confidence = 0.85;
    } else if (pattern.baselineStatus === 'limited') {
      confidence = 0.7;
    }

    // Pattern-specific adjustments
    if (pattern.featureKey === 'let-const' && matchedCode.includes('var ')) {
      confidence = 0.98;
    } else if (pattern.featureKey === 'fetch' && matchedCode.includes('XMLHttpRequest')) {
      confidence = 0.95;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate impact score based on modernization benefits
   */
  private calculateImpact(featureKey: string): 'high' | 'medium' | 'low' {
    const highImpact = ['fetch', 'async-await', 'let-const'];
    const mediumImpact = ['array-includes', 'array-find', 'array-from', 'object-spread'];
    
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
    return this.features[featureKey as keyof typeof this.features];
  }

  /**
   * Get all available patterns for debugging/inspection
   */
  getPatterns(): WebFeaturePattern[] {
    return this.patterns;
  }

  /**
   * Get feature statistics
   */
  getFeatureStats(): {
    totalFeatures: number;
    baselineHigh: number;
    baselineLow: number;
    baselineLimited: number;
    patternsGenerated: number;
  } {
    const totalFeatures = Object.keys(this.features).length;
    
    let baselineHigh = 0;
    let baselineLow = 0;
    let baselineLimited = 0;

    for (const feature of Object.values(this.features)) {
      if (feature.status?.baseline === 'high') {
        baselineHigh++;
      } else if (feature.status?.baseline === 'low') {
        baselineLow++;
      } else if (feature.status?.baseline === false) {
        baselineLimited++;
      }
    }

    return {
      totalFeatures,
      baselineHigh,
      baselineLow,
      baselineLimited,
      patternsGenerated: this.patterns.length
    };
  }
}