import { RuleEngine } from '../../src/rules/engine';
import { xhrToFetchRule } from '../../src/rules/xhr-to-fetch';

describe('xhr-to-fetch rule', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    engine = new RuleEngine({ 'xhr-to-fetch': 'warn' });
    engine.registerRule('xhr-to-fetch', xhrToFetchRule);
  });

  test('should detect new XMLHttpRequest()', () => {
    const code = `
      function makeRequest() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/data');
        xhr.send();
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const xhrSuggestions = suggestions.filter(s => s.ruleId === 'xhr-to-fetch');
    expect(xhrSuggestions).toHaveLength(2); // One for constructor, one for identifier
    
    const constructorSuggestion = xhrSuggestions.find(s => s.oldCode === 'new XMLHttpRequest()');
    expect(constructorSuggestion).toBeDefined();
    expect(constructorSuggestion?.newCode).toBe('fetch(url)');
    expect(constructorSuggestion?.category).toBe('javascript');
    expect(constructorSuggestion?.baselineStatus).toBe('high');
  });

  test('should detect XMLHttpRequest identifier references', () => {
    const code = `
      if (window.XMLHttpRequest) {
        console.log('XMLHttpRequest supported');
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const xhrSuggestions = suggestions.filter(s => s.ruleId === 'xhr-to-fetch');
    expect(xhrSuggestions.length).toBeGreaterThan(0);
    
    const identifierSuggestion = xhrSuggestions.find(s => s.oldCode === 'XMLHttpRequest');
    expect(identifierSuggestion).toBeDefined();
    expect(identifierSuggestion?.newCode).toBe('fetch() API');
  });

  test('should not trigger on fetch calls', () => {
    const code = `
      function modernRequest() {
        return fetch('/api/data')
          .then(response => response.json());
      }
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const xhrSuggestions = suggestions.filter(s => s.ruleId === 'xhr-to-fetch');
    expect(xhrSuggestions).toHaveLength(0);
  });

  test('should handle multiple XMLHttpRequest instances', () => {
    const code = `
      var xhr1 = new XMLHttpRequest();
      var xhr2 = new XMLHttpRequest();
      var xhr3 = new XMLHttpRequest();
    `;
    const suggestions = engine.analyzeFile('test.js', code);
    
    const xhrSuggestions = suggestions.filter(s => s.ruleId === 'xhr-to-fetch');
    const constructorSuggestions = xhrSuggestions.filter(s => s.oldCode === 'new XMLHttpRequest()');
    expect(constructorSuggestions).toHaveLength(3);
  });
});