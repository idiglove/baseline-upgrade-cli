// tests/scoring.test.ts
import { ScoringSystem } from '../src/scoring';
import { ModernizationSuggestion } from '../src/rules/types';

describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;

  beforeEach(() => {
    scoringSystem = new ScoringSystem();
  });

  test('should calculate score for empty suggestions', () => {
    const suggestions: ModernizationSuggestion[] = [];
    const scoreResult = scoringSystem.calculateScore(suggestions);
    
    expect(scoreResult.totalScore).toBe(0);
    expect(scoreResult.baselineApproved).toBe(true);
  });

  test('should calculate score with suggestions', () => {
    const suggestions: ModernizationSuggestion[] = [
      {
        file: 'test.js',
        line: 1,
        column: 0,
        oldCode: 'var message',
        newCode: 'const message',
        description: 'const is Baseline stable',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      }
    ];
    
    const scoreResult = scoringSystem.calculateScore(suggestions);
    
    expect(scoreResult.totalScore).toBeDefined();
    expect(typeof scoreResult.totalScore).toBe('number');
    expect(scoreResult.suggestionsCount).toBe(1);
  });

  test('should handle different suggestion categories', () => {
    const suggestions: ModernizationSuggestion[] = [
      {
        file: 'test.js',
        line: 1,
        column: 0,
        oldCode: 'var message',
        newCode: 'const message',
        description: 'const is Baseline stable',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      },
      {
        file: 'styles.css',
        line: 5,
        column: 0,
        oldCode: 'float: left',
        newCode: 'display: flex',
        description: 'flex is modern',
        category: 'css',
        baselineStatus: 'high',
        ruleId: 'float-to-flex',
        severity: 'info'
      }
    ];
    
    const scoreResult = scoringSystem.calculateScore(suggestions);
    
    expect(scoreResult.suggestionsCount).toBe(2);
    expect(scoreResult.suggestionsByCategory.javascript).toBe(1);
    expect(scoreResult.suggestionsByCategory.css).toBe(1);
  });

  test('should handle different baseline statuses', () => {
    const suggestions: ModernizationSuggestion[] = [
      {
        file: 'test.js',
        line: 1,
        column: 0,
        oldCode: 'var message',
        newCode: 'const message',
        description: 'const is Baseline stable',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      },
      {
        file: 'test.js',
        line: 2,
        column: 0,
        oldCode: 'oldAPI()',
        newCode: 'newAPI()',
        description: 'new API available',
        category: 'javascript',
        baselineStatus: 'low',
        ruleId: 'new-api',
        severity: 'info'
      }
    ];
    
    const scoreResult = scoringSystem.calculateScore(suggestions);
    
    expect(scoreResult.suggestionsCount).toBe(2);
    expect(scoreResult.suggestionsByBaselineStatus.high).toBe(1);
    expect(scoreResult.suggestionsByBaselineStatus.low).toBe(1);
  });
});