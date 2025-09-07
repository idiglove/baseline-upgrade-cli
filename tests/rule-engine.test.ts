import { RuleEngine, builtinRules, defaultConfig } from '../src/rules';

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine(defaultConfig.rules);
    // Register all built-in rules
    for (const [ruleId, rule] of Object.entries(builtinRules)) {
      engine.registerRule(ruleId, rule);
    }
  });

  describe('Core Functionality', () => {
    test('should initialize with built-in rules', () => {
      const rules = engine.getRules();
      expect(rules).toContain('var-to-const-let');
      expect(rules).toContain('xhr-to-fetch');
      expect(rules).toContain('array-at-method');
      expect(rules.length).toBeGreaterThan(10);
    });

    test('should analyze JavaScript files', () => {
      const code = 'var message = "hello";';
      const suggestions = engine.analyzeFile('test.js', code);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].ruleId).toBe('var-to-const-let');
    });

    test('should analyze CSS files', () => {
      const code = '.test { display: block; }';
      const suggestions = engine.analyzeFile('test.css', code);
      // CSS rules not implemented yet, should return empty array
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should handle unsupported file types', () => {
      const code = 'some text content';
      const suggestions = engine.analyzeFile('test.txt', code);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should handle syntax errors gracefully', () => {
      const code = 'var broken = {';
      const suggestions = engine.analyzeFile('test.js', code);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Rule Configuration', () => {
    test('should respect disabled rules', () => {
      const disabledEngine = new RuleEngine({ 'var-to-const-let': 'off' });
      disabledEngine.registerRule('var-to-const-let', builtinRules['var-to-const-let']);
      
      const code = 'var message = "hello";';
      const suggestions = disabledEngine.analyzeFile('test.js', code);
      
      // Should not contain suggestions from disabled rule
      const varSuggestions = suggestions.filter(s => s.ruleId === 'var-to-const-let');
      expect(varSuggestions.length).toBe(0);
    });

    test('should handle unknown file extensions', () => {
      const code = 'var test = 1;';
      const suggestions = engine.analyzeFile('test.xyz', code);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});