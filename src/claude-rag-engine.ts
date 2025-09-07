import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

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
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
}

interface TrainingExample {
  instruction: string;
  input: string;
  output: string;
  feature: string;
  featureName: string;
  baselineStatus: string;
  baselineStatusDisplay?: string;
  category: string;
  confidence: number;
  modernMethod?: string;
  legacyPattern?: string;
  derivedFrom?: string;
}

export class ClaudeRAGEngine {
  private anthropic: Anthropic;
  private trainingData: TrainingExample[] = [];
  private trainingDataPath: string;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
    this.trainingDataPath = path.join(__dirname, '../data-preparation/output/data_driven_training.json');
    this.loadTrainingData();
  }

  private loadTrainingData(): void {
    try {
      const data = fs.readFileSync(this.trainingDataPath, 'utf8');
      this.trainingData = JSON.parse(data);
      console.log(`📚 Loaded ${this.trainingData.length} training examples`);
    } catch (error) {
      console.warn(`⚠️  Could not load training data from ${this.trainingDataPath}: ${error}`);
      this.trainingData = [];
    }
  }

  /**
   * Extract keywords from training data for dynamic pattern matching
   */
  private extractKeywordsFromTrainingData(): Set<string> {
    const keywords = new Set<string>();
    
    for (const example of this.trainingData) {
      // Extract from legacy patterns
      if (example.legacyPattern) {
        const pattern = example.legacyPattern.toLowerCase();
        keywords.add(pattern);
        
        // Add word fragments
        pattern.split(/\W+/).forEach(word => {
          if (word.length > 2) keywords.add(word);
        });
      }

      // Extract from input text (code examples) - extract any code-like patterns
      if (example.input) {
        // Extract JavaScript identifiers, method calls, and keywords
        const codePatterns = example.input.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*|\b(new|var|let|const|function|if|for|while)\b/gi);
        if (codePatterns) {
          codePatterns.forEach(pattern => {
            if (pattern.length > 2) keywords.add(pattern.toLowerCase());
          });
        }
      }

      // Extract from modern method names
      if (example.modernMethod) {
        const method = example.modernMethod.toLowerCase();
        keywords.add(method);
        method.split(/[.\(\)]+/).forEach(part => {
          if (part.length > 2) keywords.add(part);
        });
      }
    }

    return keywords;
  }

  /**
   * Find relevant training examples based on code patterns
   */
  private findRelevantExamples(code: string, maxExamples: number = 5): TrainingExample[] {
    const codeLines = code.toLowerCase();
    const relevantExamples: { example: TrainingExample; score: number }[] = [];
    const dynamicKeywords = this.extractKeywordsFromTrainingData();

    for (const example of this.trainingData) {
      let score = 0;

      // Check for direct pattern matches (highest priority)
      if (example.legacyPattern) {
        const pattern = example.legacyPattern.toLowerCase();
        if (codeLines.includes(pattern)) {
          score += 15; // Higher weight for exact pattern matches
        }
      }

      // Check for modern method matches
      if (example.modernMethod) {
        const modernPattern = example.modernMethod.toLowerCase();
        // If code already uses modern pattern, lower relevance
        if (codeLines.includes(modernPattern)) {
          score -= 5;
        }
      }

      // Dynamic keyword matching from training data
      const searchText = `${example.input} ${example.instruction} ${example.output}`.toLowerCase();
      for (const keyword of dynamicKeywords) {
        if (codeLines.includes(keyword) && searchText.includes(keyword)) {
          score += 3;
        }
      }

      // Feature-specific scoring
      if (example.feature && codeLines.includes(example.feature.replace(/-/g, ''))) {
        score += 4;
      }

      // Category relevance with better detection
      const categoryKeywords = {
        javascript: ['function', 'var', 'const', 'let', 'return', '=>'],
        arrays: ['array', '[', 'length', 'push', 'pop', 'map', 'filter'],
        api: ['fetch', 'xhr', 'request', 'response'],
        promises: ['promise', 'then', 'catch', 'async', 'await']
      };

      if (categoryKeywords[example.category as keyof typeof categoryKeywords]) {
        const catKeywords = categoryKeywords[example.category as keyof typeof categoryKeywords];
        const matches = catKeywords.filter(kw => codeLines.includes(kw)).length;
        score += matches * 2;
      }

      // Boost high confidence examples
      if (example.confidence > 0.8) {
        score += 1;
      }

      // Boost high baseline status (more stable features)
      if (example.baselineStatus === 'high') {
        score += 2;
      }

      if (score > 0) {
        relevantExamples.push({ example, score });
      }
    }

    // Sort by relevance and return top examples
    return relevantExamples
      .sort((a, b) => b.score - a.score)
      .slice(0, maxExamples)
      .map(item => item.example);
  }

  /**
   * Create context from relevant training examples
   */
  private createRAGContext(relevantExamples: TrainingExample[]): string {
    if (relevantExamples.length === 0) {
      return "No specific training examples found for this code pattern.";
    }

    let context = "## Relevant Modernization Examples:\n\n";
    
    for (let i = 0; i < relevantExamples.length; i++) {
      const example = relevantExamples[i];
      context += `### Example ${i + 1}: ${example.featureName}\n`;
      context += `**Feature:** ${example.feature}\n`;
      context += `**Baseline Status:** ${example.baselineStatus} (${example.baselineStatusDisplay || 'status available'})\n`;
      context += `**Category:** ${example.category}\n`;
      
      if (example.legacyPattern && example.modernMethod) {
        context += `**Legacy Pattern:** ${example.legacyPattern}\n`;
        context += `**Modern Alternative:** ${example.modernMethod}\n`;
      }
      
      context += `**Guidance:** ${example.output.replace(/```[^`]*```/g, '').trim()}\n\n`;
    }

    return context;
  }

  async analyzeFile(content: string, filePath: string): Promise<ModernizationSuggestion[]> {
    try {
      // Find relevant training examples
      const relevantExamples = this.findRelevantExamples(content);
      const ragContext = this.createRAGContext(relevantExamples);

      const prompt = `You are an expert JavaScript modernization assistant. Your job is to analyze code and suggest modern web features using Baseline data.

${ragContext}

## Code to Analyze:
File: ${filePath}
\`\`\`javascript
${content}
\`\`\`

## Instructions:
1. Identify patterns that can be modernized using the examples above as reference
2. Focus on web features that are Baseline "high" (widely available) or "low" (newly available)
3. Provide specific line-by-line suggestions with:
   - Exact old code pattern
   - Modern replacement
   - Feature name and Baseline status
   - Brief explanation of benefits

## Response Format:
Return a JSON array of suggestions:
\`\`\`json
[
  {
    "line": 5,
    "oldCode": "var userName = 'John';",
    "newCode": "const userName = 'John';",
    "feature": "let-const",
    "baselineStatus": "high",
    "description": "Use const for block-scoped constants",
    "confidence": 0.95
  }
]
\`\`\`

Analyze the code now:`;

      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse Claude's response
      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        console.warn('Could not extract JSON from Claude response');
        return [];
      }

      const suggestions = JSON.parse(jsonMatch[1]);
      
      // Convert to our format
      return suggestions.map((s: any) => ({
        file: filePath,
        line: s.line || 1,
        column: 1,
        oldCode: s.oldCode,
        newCode: s.newCode,
        feature: s.feature,
        featureName: s.feature.replace(/-/g, ' '),
        baselineStatus: s.baselineStatus,
        baselineStatusDisplay: s.baselineStatus === 'high' ? 'widely available' : 'newly available',
        description: s.description,
        confidence: s.confidence || 0.8,
        impact: this.calculateImpact(s.feature),
        category: 'javascript'
      }));

    } catch (error) {
      console.error('Error calling Claude API:', error);
      return [];
    }
  }

  private calculateImpact(feature: string): 'high' | 'medium' | 'low' {
    const highImpact = ['fetch', 'async-await', 'let-const'];
    const mediumImpact = ['array-includes', 'template-literals', 'arrow-functions'];
    
    if (highImpact.includes(feature)) {
      return 'high';
    } else if (mediumImpact.includes(feature)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get statistics about the training data
   */
  getTrainingStats(): {
    totalExamples: number;
    categoriesCount: Record<string, number>;
    highBaselineCount: number;
    featuresCount: number;
  } {
    const categories: Record<string, number> = {};
    const features = new Set<string>();
    let highBaselineCount = 0;

    for (const example of this.trainingData) {
      categories[example.category] = (categories[example.category] || 0) + 1;
      features.add(example.feature);
      
      if (example.baselineStatus === 'high') {
        highBaselineCount++;
      }
    }

    return {
      totalExamples: this.trainingData.length,
      categoriesCount: categories,
      highBaselineCount,
      featuresCount: features.size
    };
  }
}