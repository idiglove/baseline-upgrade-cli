import { RuleDefinition } from './types';
import { varToConstLetRule } from './var-to-const-let';
import { xhrToFetchRule } from './xhr-to-fetch';
import { indexOfToIncludesRule } from './indexOf-to-includes';
import { arrayAtMethodRule } from './array-at-method';
import { arrayFindMethodRule } from './array-find-method';
import { arrayFromMethodRule } from './array-from-method';
import { arrayFlatMethodRule } from './array-flat-method';
import { stringMethodsRule } from './string-methods';
import { stringRepeatMethodRule } from './string-repeat-method';
import { objectMethodsRule } from './object-methods';
import { asyncAwaitRule } from './async-await';

// Built-in rules registry
export const builtinRules: Record<string, RuleDefinition> = {
  'var-to-const-let': varToConstLetRule,
  'xhr-to-fetch': xhrToFetchRule,
  'indexOf-to-includes': indexOfToIncludesRule,
  'array-at-method': arrayAtMethodRule,
  'array-find-method': arrayFindMethodRule,
  'array-from-method': arrayFromMethodRule,
  'array-flat-method': arrayFlatMethodRule,
  'string-methods': stringMethodsRule,
  'string-repeat-method': stringRepeatMethodRule,
  'object-methods': objectMethodsRule,
  'async-await': asyncAwaitRule,
};

import { RuleConfig } from './types';

// Default rule configuration
export const defaultConfig: { rules: RuleConfig } = {
  rules: {
    'var-to-const-let': 'warn' as const,
    'xhr-to-fetch': 'warn' as const, 
    'indexOf-to-includes': 'warn' as const,
    'array-at-method': 'info' as const,
    'array-find-method': 'info' as const,
    'array-from-method': 'info' as const,
    'array-flat-method': 'info' as const,
    'string-methods': 'info' as const,
    'string-repeat-method': 'info' as const,
    'object-methods': 'info' as const,
    'async-await': 'info' as const,
  }
};

export * from './types';
export * from './engine';