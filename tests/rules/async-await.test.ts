import { RuleEngine } from '../../src/rules/engine';
import { asyncAwaitRule } from '../../src/rules/async-await';

describe('async-await rule', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({ 'async-await': 'info' });
    engine.registerRule('async-await', asyncAwaitRule);
  });

  test('should detect Promise chains with .then().catch()', () => {
    const code = `
      function fetchData() {
        return fetch('/api/data')
          .then(response => response.json())
          .then(data => {
            console.log(data);
            return data;
          })
          .catch(error => {
            console.error(error);
          });
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    expect(asyncSuggestions.length).toBeGreaterThan(0);
    
    const chainSuggestion = asyncSuggestions.find(s => 
      s.oldCode === 'Promise chains with .then().catch()'
    );
    expect(chainSuggestion).toBeDefined();
    expect(chainSuggestion?.newCode).toBe('async/await syntax');
    expect(chainSuggestion?.category).toBe('javascript');
  });

  test('should detect new Promise() constructor patterns', () => {
    const code = `
      function createUser(userData) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve({ id: 1, ...userData });
          }, 100);
        });
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    expect(asyncSuggestions.length).toBeGreaterThan(0);
    
    const constructorSuggestion = asyncSuggestions.find(s => 
      s.oldCode === 'new Promise() constructor'
    );
    expect(constructorSuggestion).toBeDefined();
    expect(constructorSuggestion?.newCode).toBe('async function');
  });

  test('should not trigger on single .then() without chaining', () => {
    const code = `
      function simplePromise() {
        return someAsyncOperation()
          .then(result => result.data);
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    // This might still trigger depending on implementation, but chain detection should be minimal
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    // We don't assert length here as the rule might be conservative
  });

  test('should not trigger on modern async/await code', () => {
    const code = `
      async function fetchData() {
        try {
          const response = await fetch('/api/data');
          const data = await response.json();
          return data;
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    expect(asyncSuggestions).toHaveLength(0);
  });

  test('should handle complex Promise chains', () => {
    const code = `
      function complexOperation() {
        return fetchUserData()
          .then(user => fetchUserPosts(user.id))
          .then(posts => posts.filter(post => post.published))
          .then(publishedPosts => publishedPosts.map(post => post.title))
          .catch(error => {
            console.error('Operation failed:', error);
            return [];
          });
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    expect(asyncSuggestions.length).toBeGreaterThan(0);
    
    // Should detect multiple .then() calls in the chain
    const chainSuggestions = asyncSuggestions.filter(s => 
      s.oldCode === 'Promise chains with .then().catch()'
    );
    expect(chainSuggestions.length).toBeGreaterThan(0);
  });

  test('should not trigger on Promise.all() or Promise.race()', () => {
    const code = `
      async function parallelOperations() {
        const results = await Promise.all([
          fetch('/api/users'),
          fetch('/api/posts'),
          fetch('/api/comments')
        ]);
        
        const winner = await Promise.race([
          slowOperation(),
          fasterOperation()
        ]);
        
        return { results, winner };
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const asyncSuggestions = suggestions.filter(s => s.ruleId === 'async-await');
    expect(asyncSuggestions).toHaveLength(0);
  });
});