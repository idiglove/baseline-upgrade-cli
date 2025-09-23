#!/usr/bin/env node
/**
 * Data-driven training generator that automatically derives patterns 
 * from web-features compat_features instead of hardcoding them
 */

const data = require('web-features/data.json');
const fs = require('fs');
const path = require('path');

class DataDrivenPatternGenerator {
  constructor() {
    this.data = data;
    this.trainingExamples = [];
    this.patternDatabase = new Map(); // Cache for derived patterns
  }

  /**
   * Generate patterns by analyzing compat_features data
   */
  generatePatternsFromCompatFeatures() {
    console.log('=== DATA-DRIVEN PATTERN GENERATION ===\n');
    
    // Get all high-baseline JavaScript features
    const jsFeatures = this.getHighBaselineJSFeatures();
    console.log(`Processing ${Object.keys(jsFeatures).length} high-baseline JavaScript features...\n`);
    
    let totalExamples = 0;
    
    for (const [featureKey, feature] of Object.entries(jsFeatures)) {
      console.log(`Processing: ${featureKey} (${feature.name})`);
      
      // Analyze compat_features to derive patterns
      const patterns = this.derivePatterns(featureKey, feature);
      
      // Generate training examples from derived patterns
      const examples = this.generateExamplesFromPatterns(featureKey, feature, patterns);
      
      this.trainingExamples.push(...examples);
      totalExamples += examples.length;
      
      console.log(`  → Generated ${examples.length} examples`);
    }
    
    console.log(`\nTotal: ${totalExamples} training examples generated!\n`);
    return this.trainingExamples;
  }

  getHighBaselineJSFeatures() {
    const features = {};
    
    for (const [key, feature] of Object.entries(this.data.features)) {
      // Only high-baseline features for safe modernization
      if (feature.status?.baseline !== 'high') continue;
      
      // Must be JavaScript-related
      if (!this.isJavaScriptFeature(key, feature)) continue;
      
      features[key] = feature;
    }
    
    return features;
  }

  isJavaScriptFeature(key, feature) {
    return (
      // Direct JS groups
      feature.group === 'javascript' ||
      feature.group === 'promises' ||
      feature.group === 'arrays' ||
      feature.group === 'maps' ||
      feature.group === 'sets' ||
      feature.group === 'iterators' ||
      feature.group === 'collections' ||
      feature.group === 'typed-arrays' ||
      
      // Key patterns
      key.includes('array-') ||
      key.includes('object-') ||
      key.includes('string-') ||
      key.includes('promise') ||
      key.includes('async') ||
      key.includes('fetch') ||
      key.includes('let-const') ||
      
      // Compat features indicate JS APIs
      this.hasJavaScriptCompatFeatures(feature.compat_features)
    );
  }

  hasJavaScriptCompatFeatures(compatFeatures) {
    if (!compatFeatures) return false;
    
    return compatFeatures.some(cf => 
      cf.startsWith('javascript.') ||
      cf.startsWith('api.Array') ||
      cf.startsWith('api.Object') ||
      cf.startsWith('api.String') ||
      cf.startsWith('api.Promise') ||
      cf.startsWith('api.fetch') ||
      cf.startsWith('api.Map') ||
      cf.startsWith('api.Set')
    );
  }

  /**
   * Analyze compat_features to derive modernization patterns
   */
  derivePatterns(featureKey, feature) {
    const patterns = [];
    const compatFeatures = feature.compat_features || [];
    
    // Analyze each compat feature to understand what it provides
    for (const compatFeature of compatFeatures) {
      const pattern = this.parseCompatFeature(compatFeature, featureKey, feature);
      if (pattern) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  parseCompatFeature(compatFeature, featureKey, feature) {
    // Parse different types of compat_features to extract patterns
    
    // JavaScript built-in methods: javascript.builtins.Array.includes
    if (compatFeature.startsWith('javascript.builtins.')) {
      return this.parseJavaScriptBuiltin(compatFeature, featureKey, feature);
    }
    
    // API methods: api.Array.includes, api.fetch
    if (compatFeature.startsWith('api.')) {
      return this.parseAPIMethod(compatFeature, featureKey, feature);
    }
    
    // JavaScript statements/operators: javascript.statements.const
    if (compatFeature.startsWith('javascript.statements.') || 
        compatFeature.startsWith('javascript.operators.')) {
      return this.parseJavaScriptSyntax(compatFeature, featureKey, feature);
    }
    
    return null;
  }

  parseJavaScriptBuiltin(compatFeature, featureKey, feature) {
    // Extract: javascript.builtins.Array.includes → Array.includes()
    const parts = compatFeature.split('.');
    if (parts.length < 4) return null;
    
    const objectType = parts[2]; // Array, Object, String, etc.
    const methodName = parts[3]; // includes, find, assign, etc.
    
    return {
      type: 'method',
      object: objectType,
      method: methodName,
      modernSyntax: `${objectType}.${methodName}()`,
      compatFeature,
      legacyAlternatives: this.getLegacyAlternatives(objectType, methodName)
    };
  }

  parseAPIMethod(compatFeature, featureKey, feature) {
    // Extract: api.fetch → fetch(), api.Array.includes → Array.includes()
    const parts = compatFeature.split('.');
    if (parts.length < 2) return null;
    
    const apiName = parts[1]; // fetch, Array, Object, etc.
    const methodName = parts[2]; // includes, find, etc. (if exists)
    
    return {
      type: 'api',
      api: apiName,
      method: methodName,
      modernSyntax: methodName ? `${apiName}.${methodName}()` : `${apiName}()`,
      compatFeature,
      legacyAlternatives: this.getLegacyAlternatives(apiName, methodName)
    };
  }

  parseJavaScriptSyntax(compatFeature, featureKey, feature) {
    // Extract: javascript.statements.const → const declaration
    const parts = compatFeature.split('.');
    if (parts.length < 3) return null;
    
    const syntaxType = parts[2]; // const, let, async_function, etc.
    
    return {
      type: 'syntax',
      syntax: syntaxType,
      modernSyntax: this.getModernSyntaxExample(syntaxType),
      compatFeature,
      legacyAlternatives: this.getLegacySyntaxAlternatives(syntaxType)
    };
  }

  /**
   * Generate legacy alternatives based on the modern feature
   */
  getLegacyAlternatives(objectType, methodName) {
    const alternatives = [];
    
    // Array method alternatives
    if (objectType === 'Array') {
      switch (methodName) {
        case 'includes':
          alternatives.push({
            pattern: /\.indexOf\([^)]+\)\s*(!==?\s*-1|>=?\s*0)/g,
            legacy: 'arr.indexOf(item) !== -1',
            explanation: 'Replace indexOf() !== -1 with includes() for cleaner boolean checks'
          });
          break;
          
        case 'find':
          alternatives.push({
            pattern: /for\s*\([^)]*\)\s*{[^}]*if[^}]*break[^}]*}/g,
            legacy: 'for loop with break when item found',
            explanation: 'Replace for loops with Array.find() for cleaner searching'
          });
          break;
          
        case 'findIndex':
          alternatives.push({
            pattern: /for\s*\([^)]*\)\s*{[^}]*if[^}]*return\s+\w+[^}]*}/g,
            legacy: 'for loop returning index',
            explanation: 'Use Array.findIndex() instead of manual index tracking'
          });
          break;
          
        case 'at':
          alternatives.push({
            pattern: /\[\s*\w+\.length\s*-\s*\d+\s*\]/g,
            legacy: 'arr[arr.length - 1]',
            explanation: 'Use Array.at(-1) for negative indexing'
          });
          break;
          
        case 'flat':
          alternatives.push({
            pattern: /\.reduce\([^}]*concat[^}]*\[\]\)/g,
            legacy: 'reduce with concat for flattening',
            explanation: 'Use Array.flat() instead of reduce for flattening arrays'
          });
          break;
          
        case 'from':
          alternatives.push({
            pattern: /new\s+Array\(\d+\)\.fill\([^)]*\)\.map/g,
            legacy: 'new Array(n).fill().map()',
            explanation: 'Use Array.from() for array generation'
          });
          break;
      }
    }
    
    // String method alternatives
    else if (objectType === 'String') {
      switch (methodName) {
        case 'includes':
          alternatives.push({
            pattern: /\.indexOf\([^)]+\)\s*(!==?\s*-1|>=?\s*0)/g,
            legacy: 'str.indexOf(substring) !== -1',
            explanation: 'Replace indexOf() !== -1 with includes() for substring checks'
          });
          break;
          
        case 'startsWith':
          alternatives.push({
            pattern: /\.indexOf\([^)]+\)\s*===?\s*0/g,
            legacy: 'str.indexOf(prefix) === 0',
            explanation: 'Use String.startsWith() for prefix checking'
          });
          break;
          
        case 'endsWith':
          alternatives.push({
            pattern: /\.lastIndexOf\([^)]+\)\s*===?\s*\(.*\.length\s*-/g,
            legacy: 'str.lastIndexOf(suffix) === str.length - suffix.length',
            explanation: 'Use String.endsWith() for suffix checking'
          });
          break;
          
        case 'repeat':
          alternatives.push({
            pattern: /new\s+Array\(\d+\s*\+\s*1\)\.join\([^)]+\)/g,
            legacy: 'new Array(n + 1).join(str)',
            explanation: 'Use String.repeat() instead of Array join trick'
          });
          break;
      }
    }
    
    // Object method alternatives  
    else if (objectType === 'Object') {
      switch (methodName) {
        case 'assign':
          alternatives.push({
            pattern: /for\s*\([^)]*in\s+\w+\)[^}]*\[\w+\]\s*=/g,
            legacy: 'for-in loop copying properties',
            explanation: 'Use Object.assign() for object merging'
          });
          break;
          
        case 'keys':
          alternatives.push({
            pattern: /for\s*\([^)]*in\s+\w+\)[^}]*hasOwnProperty[^}]*push/g,
            legacy: 'for-in with hasOwnProperty to get keys',
            explanation: 'Use Object.keys() to get object keys'
          });
          break;
          
        case 'values':
          alternatives.push({
            pattern: /Object\.keys\([^)]+\)\.map\([^}]*\[\w+\]/g,
            legacy: 'Object.keys(obj).map(key => obj[key])',
            explanation: 'Use Object.values() to get object values'
          });
          break;
      }
    }
    
    // API alternatives
    else if (objectType === 'fetch') {
      alternatives.push({
        pattern: /new\s+XMLHttpRequest|XMLHttpRequest/g,
        legacy: 'XMLHttpRequest',
        explanation: 'Replace XMLHttpRequest with fetch() API'
      });
    }
    
    return alternatives;
  }

  getLegacySyntaxAlternatives(syntaxType) {
    const alternatives = [];
    
    switch (syntaxType) {
      case 'const':
      case 'let':
        alternatives.push({
          pattern: /\bvar\s+\w+/g,
          legacy: 'var declarations',
          explanation: 'Use const/let for block-scoped variables'
        });
        break;
        
      case 'async_function':
        alternatives.push({
          pattern: /\.then\s*\([^}]*\)\.catch\s*\(/g,
          legacy: 'Promise chains with .then().catch()',
          explanation: 'Use async/await for cleaner asynchronous code'
        });
        break;
    }
    
    return alternatives;
  }

  getModernSyntaxExample(syntaxType) {
    switch (syntaxType) {
      case 'const': return 'const variable';
      case 'let': return 'let variable';
      case 'async_function': return 'async function';
      default: return syntaxType;
    }
  }

  /**
   * Generate training examples from derived patterns
   */
  generateExamplesFromPatterns(featureKey, feature, patterns) {
    const examples = [];
    
    for (const pattern of patterns) {
      if (!pattern.legacyAlternatives || pattern.legacyAlternatives.length === 0) {
        // Generate educational example if no legacy patterns
        examples.push(this.generateEducationalExample(featureKey, feature, pattern));
        continue;
      }
      
      // Generate code transformation examples
      for (const alternative of pattern.legacyAlternatives) {
        const codeExamples = this.generateCodeExamples(featureKey, feature, pattern, alternative);
        examples.push(...codeExamples);
      }
    }
    
    return examples;
  }

  generateCodeExamples(featureKey, feature, pattern, alternative) {
    const examples = [];
    
    // Generate realistic before/after code examples
    const codeScenarios = this.createRealisticCodeScenarios(featureKey, pattern, alternative);
    
    for (const scenario of codeScenarios) {
      examples.push({
        instruction: "Modernize this JavaScript code using current web standards and Baseline features",
        input: scenario.legacy,
        output: `\`\`\`javascript\n${scenario.modern}\n\`\`\`\n\nExplanation: ${alternative.explanation}. This feature (${feature.name}) is widely available according to Baseline.`,
        feature: featureKey,
        featureName: feature.name,
        baselineStatus: 'high',
        baselineStatusDisplay: 'widely available',
        category: this.getFeatureCategory(featureKey, feature),
        modernMethod: pattern.modernSyntax,
        legacyPattern: alternative.legacy,
        confidence: 0.95,
        derivedFrom: pattern.compatFeature
      });
    }
    
    return examples;
  }

  createRealisticCodeScenarios(featureKey, pattern, alternative) {
    // Create realistic code examples based on the feature
    const scenarios = [];
    
    // Array method scenarios
    if (pattern.object === 'Array') {
      switch (pattern.method) {
        case 'includes':
          scenarios.push({
            legacy: "if (users.indexOf(currentUser) !== -1) {\n  console.log('User found');\n}",
            modern: "if (users.includes(currentUser)) {\n  console.log('User found');\n}"
          });
          scenarios.push({
            legacy: "const hasAdmin = permissions.indexOf('admin') >= 0;",
            modern: "const hasAdmin = permissions.includes('admin');"
          });
          break;
          
        case 'find':
          scenarios.push({
            legacy: "let activeUser = null;\nfor (let i = 0; i < users.length; i++) {\n  if (users[i].active) {\n    activeUser = users[i];\n    break;\n  }\n}",
            modern: "const activeUser = users.find(user => user.active);"
          });
          break;
          
        case 'at':
          scenarios.push({
            legacy: "const lastItem = items[items.length - 1];",
            modern: "const lastItem = items.at(-1);"
          });
          scenarios.push({
            legacy: "const secondLast = arr[arr.length - 2];",
            modern: "const secondLast = arr.at(-2);"
          });
          break;
      }
    }
    
    // String method scenarios
    else if (pattern.object === 'String') {
      switch (pattern.method) {
        case 'includes':
          scenarios.push({
            legacy: "if (message.indexOf('error') !== -1) {\n  handleError();\n}",
            modern: "if (message.includes('error')) {\n  handleError();\n}"
          });
          break;
          
        case 'startsWith':
          scenarios.push({
            legacy: "if (url.indexOf('https://') === 0) {\n  console.log('Secure URL');\n}",
            modern: "if (url.startsWith('https://')) {\n  console.log('Secure URL');\n}"
          });
          break;
      }
    }
    
    // Fetch scenarios
    else if (featureKey === 'fetch') {
      scenarios.push({
        legacy: "const xhr = new XMLHttpRequest();\nxhr.open('GET', '/api/users');\nxhr.onload = function() {\n  if (xhr.status === 200) {\n    console.log(JSON.parse(xhr.responseText));\n  }\n};\nxhr.send();",
        modern: "fetch('/api/users')\n  .then(response => response.json())\n  .then(users => console.log(users))\n  .catch(error => console.error('Error:', error));"
      });
    }
    
    // Const/let scenarios
    else if (featureKey === 'let-const') {
      scenarios.push({
        legacy: "var userName = 'John';\nvar isActive = true;\nvar count = 0;",
        modern: "const userName = 'John';\nlet isActive = true;\nlet count = 0;"
      });
    }
    
    // Default scenario if none match
    if (scenarios.length === 0) {
      scenarios.push({
        legacy: `// Legacy approach\n// Using older JavaScript patterns`,
        modern: `// Modern approach using ${pattern.modernSyntax}\n// Following current web standards`
      });
    }
    
    return scenarios;
  }

  generateEducationalExample(featureKey, feature, pattern) {
    return {
      instruction: "Explain this modern JavaScript feature and provide usage guidance",
      input: `What is ${feature.name} and how should I use it?`,
      output: `**${feature.name}**\n\n${feature.description || 'Modern JavaScript feature for improved development.'}\n\n**Modern syntax:** \`${pattern.modernSyntax}\`\n\nThis feature is widely available according to Baseline, making it safe for production use in modern applications.\n\n**Benefits:**\n- Improved readability and maintainability\n- Better performance in many cases\n- Follows current web standards\n- Excellent browser support\n\n**Compatibility:** ${pattern.compatFeature}`,
      feature: featureKey,
      featureName: feature.name,
      baselineStatus: 'high',
      baselineStatusDisplay: 'widely available',
      category: this.getFeatureCategory(featureKey, feature),
      confidence: 0.8,
      type: 'educational',
      derivedFrom: pattern.compatFeature
    };
  }

  getFeatureCategory(featureKey, feature) {
    if (feature.group) return feature.group;
    if (featureKey.startsWith('array-')) return 'arrays';
    if (featureKey.startsWith('string-')) return 'strings';
    if (featureKey.startsWith('object-')) return 'objects';
    if (featureKey.includes('async') || featureKey.includes('promise')) return 'asynchronous';
    return 'javascript';
  }

  saveResults() {
    const dir = path.join(__dirname, 'output');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save comprehensive training data
    const trainingFile = path.join(dir, 'data_driven_training.json');
    fs.writeFileSync(trainingFile, JSON.stringify(this.trainingExamples, null, 2));
    
    // Generate statistics
    const stats = this.generateStatistics();
    const statsFile = path.join(dir, 'training_statistics.json');
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    
    console.log(`\n=== RESULTS SAVED ===`);
    console.log(`Training data: ${trainingFile}`);
    console.log(`Statistics: ${statsFile}`);
    console.log(`Total examples: ${this.trainingExamples.length}`);
    
    return { trainingFile, statsFile };
  }

  generateStatistics() {
    const stats = {
      totalExamples: this.trainingExamples.length,
      byCategory: {},
      byFeature: {},
      byType: {},
      featuresCovered: new Set(),
      compatFeaturesCovered: new Set()
    };
    
    this.trainingExamples.forEach(example => {
      // By category
      const category = example.category || 'uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // By feature
      stats.byFeature[example.feature] = (stats.byFeature[example.feature] || 0) + 1;
      
      // By type
      const type = example.type || 'modernization';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Coverage tracking
      stats.featuresCovered.add(example.feature);
      if (example.derivedFrom) {
        stats.compatFeaturesCovered.add(example.derivedFrom);
      }
    });
    
    // Convert Sets to arrays for JSON serialization
    stats.featuresCovered = Array.from(stats.featuresCovered);
    stats.compatFeaturesCovered = Array.from(stats.compatFeaturesCovered);
    
    return stats;
  }

  run() {
    console.log('🚀 Data-Driven Pattern Generator');
    console.log('Automatically deriving patterns from web-features data...\n');
    
    // Generate patterns from compat_features
    this.generatePatternsFromCompatFeatures();
    
    // Show statistics
    console.log('=== GENERATION COMPLETE ===');
    const stats = this.generateStatistics();
    
    console.log(`\nStatistics:`);
    console.log(`- Total training examples: ${stats.totalExamples}`);
    console.log(`- Features covered: ${stats.featuresCovered.length}`);
    console.log(`- Compat features analyzed: ${stats.compatFeaturesCovered.length}`);
    
    console.log(`\nBy category:`);
    Object.entries(stats.byCategory)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} examples`);
      });
    
    // Save results
    this.saveResults();
    
    console.log('\n✅ Data-driven pattern generation complete!');
  }
}

if (require.main === module) {
  const generator = new DataDrivenPatternGenerator();
  generator.run();
}