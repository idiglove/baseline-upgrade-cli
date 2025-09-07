import { Rule } from './types';
import { varToConstLetRule } from './var-to-const-let';
import { xhrToFetchRule } from './xhr-to-fetch';
import { indexOfToIncludesRule } from './indexOf-to-includes';

// Export all rule types
export * from './types';
export * from './engine';

// Export individual rules
export { varToConstLetRule } from './var-to-const-let';
export { xhrToFetchRule } from './xhr-to-fetch';
export { indexOfToIncludesRule } from './indexOf-to-includes';

// Default rule set
export const defaultRules: Rule[] = [
  varToConstLetRule,
  xhrToFetchRule,
  indexOfToIncludesRule,
];

// Rule registry for easy lookup
export const ruleRegistry = {
  'var-to-const-let': varToConstLetRule,
  'xhr-to-fetch': xhrToFetchRule,
  'indexof-to-includes': indexOfToIncludesRule,
};