import { RuleEngine } from '../../src/rules/engine';
import { varToConstLetRule } from '../../src/rules/var-to-const-let';

describe('var-to-const-let rule', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({ 'var-to-const-let': 'warn' });
    engine.registerRule('var-to-const-let', varToConstLetRule);
  });

  test('should suggest const for var with initializer', () => {
    const code = 'var message = "hello";';
    const suggestions = engine.analyzeFile('test.js', code);
    
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].ruleId).toBe('var-to-const-let');
    expect(suggestions[0].oldCode).toBe('var message');
    expect(suggestions[0].newCode).toBe('const message');
    expect(suggestions[0].category).toBe('javascript');
    expect(suggestions[0].baselineStatus).toBe('high');
  });

  test('should suggest let for var without initializer', () => {
    const code = 'var count;';
    const suggestions = engine.analyzeFile('test.js', code);
    
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].ruleId).toBe('var-to-const-let');
    expect(suggestions[0].newCode).toBe('let count');
  });

  test('should suggest let for typical loop variables', () => {
    const code = 'var i = 0;';
    const suggestions = engine.analyzeFile('test.js', code);
    
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].newCode).toBe('let i');
  });

  test('should not trigger on const declarations', () => {
    const code = 'const message = "hello";';
    const suggestions = engine.analyzeFile('test.js', code);
    
    const varSuggestions = suggestions.filter(s => s.ruleId === 'var-to-const-let');
    expect(varSuggestions).toHaveLength(0);
  });

  test('should not trigger on let declarations', () => {
    const code = 'let message = "hello";';
    const suggestions = engine.analyzeFile('test.js', code);
    
    const varSuggestions = suggestions.filter(s => s.ruleId === 'var-to-const-let');
    expect(varSuggestions).toHaveLength(0);
  });

  test('should handle multiple var declarations', () => {
    const code = `
      var name = "John";
      var age = 30;
      var city = "NYC";
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const varSuggestions = suggestions.filter(s => s.ruleId === 'var-to-const-let');
    expect(varSuggestions).toHaveLength(3);
    varSuggestions.forEach(suggestion => {
      expect(suggestion.newCode).toMatch(/^const /);
    });
  });
});