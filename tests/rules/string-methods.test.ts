import { RuleEngine } from '../../src/rules/engine';
import { stringMethodsRule } from '../../src/rules/string-methods';
import { stringRepeatMethodRule } from '../../src/rules/string-repeat-method';

describe('String method rules', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({
      'string-methods': 'info',
      'string-repeat-method': 'info'
    });
    
    engine.registerRule('string-methods', stringMethodsRule);
    engine.registerRule('string-repeat-method', stringRepeatMethodRule);
  });

  describe('string-methods', () => {
    test('should detect str.indexOf(substr) !== -1', () => {
      const code = `
        function hasSubstring(text, search) {
          return text.indexOf(search) !== -1;
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const stringMethodSuggestions = suggestions.filter(s => s.ruleId === 'string-methods');
      expect(stringMethodSuggestions).toHaveLength(1);
      expect(stringMethodSuggestions[0].oldCode).toBe('text.indexOf(search) !== -1');
      expect(stringMethodSuggestions[0].newCode).toBe('text.includes(search)');
      expect(stringMethodSuggestions[0].category).toBe('javascript');
    });

    test('should detect str.indexOf(prefix) === 0', () => {
      const code = `
        function startsWithPrefix(text, prefix) {
          return text.indexOf(prefix) === 0;
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const stringMethodSuggestions = suggestions.filter(s => s.ruleId === 'string-methods');
      expect(stringMethodSuggestions).toHaveLength(1);
      expect(stringMethodSuggestions[0].oldCode).toBe('text.indexOf(prefix) === 0');
      expect(stringMethodSuggestions[0].newCode).toBe('text.startsWith(prefix)');
    });

    test('should detect lastIndexOf suffix pattern', () => {
      const code = `
        function endsWithSuffix(text, suffix) {
          return text.lastIndexOf(suffix) === text.length - suffix.length;
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const stringMethodSuggestions = suggestions.filter(s => s.ruleId === 'string-methods');
      expect(stringMethodSuggestions).toHaveLength(1);
      expect(stringMethodSuggestions[0].oldCode).toBe('lastIndexOf suffix length comparison');
      expect(stringMethodSuggestions[0].newCode).toBe('text.endsWith(suffix)');
    });

    test('should not trigger on modern string methods', () => {
      const code = `
        const hasPrefix = text.startsWith('http');
        const hasSuffix = text.endsWith('.js');
        const contains = text.includes('pattern');
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const stringMethodSuggestions = suggestions.filter(s => s.ruleId === 'string-methods');
      expect(stringMethodSuggestions).toHaveLength(0);
    });
  });

  describe('string-repeat-method', () => {
    test('should detect new Array(n + 1).join(str) pattern', () => {
      const code = `
        function createDashes(count) {
          return new Array(count + 1).join('-');
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const repeatSuggestions = suggestions.filter(s => s.ruleId === 'string-repeat-method');
      expect(repeatSuggestions).toHaveLength(1);
      expect(repeatSuggestions[0].oldCode).toBe("new Array(count + 1).join('-')");
      expect(repeatSuggestions[0].newCode).toBe("'-'.repeat(count)");
      expect(repeatSuggestions[0].category).toBe('javascript');
    });

    test('should detect new Array(n).join(str) pattern', () => {
      const code = `
        function repeatChar(char, times) {
          return new Array(times).join(char);
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const repeatSuggestions = suggestions.filter(s => s.ruleId === 'string-repeat-method');
      expect(repeatSuggestions).toHaveLength(1);
      expect(repeatSuggestions[0].oldCode).toBe('new Array(times).join(char)');
      expect(repeatSuggestions[0].newCode).toBe('char.repeat(times - 1)');
    });

    test('should detect Array.from string repetition pattern', () => {
      const code = `
        function createIndentation(level) {
          return Array.from({length: level}, () => '  ').join('');
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const repeatSuggestions = suggestions.filter(s => s.ruleId === 'string-repeat-method');
      expect(repeatSuggestions).toHaveLength(1);
      expect(repeatSuggestions[0].oldCode).toBe('Array.from pattern for string repetition');
      expect(repeatSuggestions[0].newCode).toBe('str.repeat(n)');
    });

    test('should not trigger on modern String.repeat calls', () => {
      const code = 'const repeated = "-".repeat(10);';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const repeatSuggestions = suggestions.filter(s => s.ruleId === 'string-repeat-method');
      expect(repeatSuggestions).toHaveLength(0);
    });

    test('should not trigger on regular join calls', () => {
      const code = 'const csv = values.join(",");';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const repeatSuggestions = suggestions.filter(s => s.ruleId === 'string-repeat-method');
      expect(repeatSuggestions).toHaveLength(0);
    });
  });
});