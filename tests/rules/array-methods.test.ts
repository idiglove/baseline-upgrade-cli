import { RuleEngine } from '../../src/rules/engine';
import { arrayAtMethodRule } from '../../src/rules/array-at-method';
import { arrayFindMethodRule } from '../../src/rules/array-find-method';
import { arrayFromMethodRule } from '../../src/rules/array-from-method';
import { arrayFlatMethodRule } from '../../src/rules/array-flat-method';
import { indexOfToIncludesRule } from '../../src/rules/indexOf-to-includes';

describe('Array method rules', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({
      'array-at-method': 'info',
      'array-find-method': 'info',
      'array-from-method': 'info',
      'array-flat-method': 'info',
      'indexOf-to-includes': 'warn'
    });
    
    engine.registerRule('array-at-method', arrayAtMethodRule);
    engine.registerRule('array-find-method', arrayFindMethodRule);
    engine.registerRule('array-from-method', arrayFromMethodRule);
    engine.registerRule('array-flat-method', arrayFlatMethodRule);
    engine.registerRule('indexOf-to-includes', indexOfToIncludesRule);
  });

  describe('array-at-method', () => {
    test('should detect arr[arr.length - 1] pattern', () => {
      const code = `
        function getLastItem(arr) {
          return arr[arr.length - 1];
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const atSuggestions = suggestions.filter(s => s.ruleId === 'array-at-method');
      expect(atSuggestions).toHaveLength(1);
      expect(atSuggestions[0].oldCode).toBe('arr[arr.length - 1]');
      expect(atSuggestions[0].newCode).toBe('arr.at(-1)');
    });

    test('should detect arr[arr.length - N] pattern', () => {
      const code = `
        const secondLast = items[items.length - 2];
        const thirdLast = items[items.length - 3];
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const atSuggestions = suggestions.filter(s => s.ruleId === 'array-at-method');
      expect(atSuggestions).toHaveLength(2);
      expect(atSuggestions[0].newCode).toBe('items.at(-2)');
      expect(atSuggestions[1].newCode).toBe('items.at(-3)');
    });

    test('should not trigger on regular array access', () => {
      const code = 'const first = arr[0]; const second = arr[1];';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const atSuggestions = suggestions.filter(s => s.ruleId === 'array-at-method');
      expect(atSuggestions).toHaveLength(0);
    });
  });

  describe('indexOf-to-includes', () => {
    test('should detect arr.indexOf(item) !== -1', () => {
      const code = `
        if (users.indexOf(currentUser) !== -1) {
          console.log('User found');
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const includesSuggestions = suggestions.filter(s => s.ruleId === 'indexOf-to-includes');
      expect(includesSuggestions).toHaveLength(1);
      expect(includesSuggestions[0].oldCode).toBe('users.indexOf(currentUser) !== -1');
      expect(includesSuggestions[0].newCode).toBe('users.includes(currentUser)');
    });

    test('should detect arr.indexOf(item) >= 0', () => {
      const code = 'function hasItem(items, target) { return items.indexOf(target) >= 0; }';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const includesSuggestions = suggestions.filter(s => s.ruleId === 'indexOf-to-includes');
      expect(includesSuggestions).toHaveLength(1);
      expect(includesSuggestions[0].newCode).toBe('items.includes(target)');
    });
  });

  describe('array-find-method', () => {
    test('should detect arr.filter(condition)[0] pattern', () => {
      const code = `
        function findUser(users, id) {
          return users.filter(user => user.id === id)[0];
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const findSuggestions = suggestions.filter(s => s.ruleId === 'array-find-method');
      expect(findSuggestions).toHaveLength(1);
      expect(findSuggestions[0].newCode).toBe('users.find(user => user.id === id)');
    });

    test('should not trigger on filter without [0]', () => {
      const code = 'const activeUsers = users.filter(user => user.active);';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const findSuggestions = suggestions.filter(s => s.ruleId === 'array-find-method');
      expect(findSuggestions).toHaveLength(0);
    });
  });

  describe('array-from-method', () => {
    test('should detect new Array(n).fill().map() pattern', () => {
      const code = `
        function createRange(n) {
          return new Array(n).fill().map((_, i) => i);
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const fromSuggestions = suggestions.filter(s => s.ruleId === 'array-from-method');
      expect(fromSuggestions).toHaveLength(1);
      expect(fromSuggestions[0].newCode).toBe('Array.from({length: n}, (_, i) => i)');
    });

    test('should not trigger on regular Array.from calls', () => {
      const code = 'const arr = Array.from({length: 5}, (_, i) => i);';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const fromSuggestions = suggestions.filter(s => s.ruleId === 'array-from-method');
      expect(fromSuggestions).toHaveLength(0);
    });
  });

  describe('array-flat-method', () => {
    test('should detect reduce with concat pattern', () => {
      const code = `
        function flattenArray(arrays) {
          return arrays.reduce((acc, val) => acc.concat(val), []);
        }
      `;
      const suggestions = engine.analyzeFile('test.js', code);
      
      const flatSuggestions = suggestions.filter(s => s.ruleId === 'array-flat-method');
      expect(flatSuggestions).toHaveLength(1);
      expect(flatSuggestions[0].newCode).toBe('arrays.flat()');
    });

    test('should detect [].concat(...arr) pattern', () => {
      const code = 'function flatten(nested) { return [].concat(...nested); }';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const flatSuggestions = suggestions.filter(s => s.ruleId === 'array-flat-method');
      expect(flatSuggestions).toHaveLength(1);
      expect(flatSuggestions[0].newCode).toBe('nested.flat()');
    });

    test('should not trigger on regular concat calls', () => {
      const code = 'const combined = arr1.concat(arr2);';
      const suggestions = engine.analyzeFile('test.js', code);
      
      const flatSuggestions = suggestions.filter(s => s.ruleId === 'array-flat-method');
      expect(flatSuggestions).toHaveLength(0);
    });
  });
});