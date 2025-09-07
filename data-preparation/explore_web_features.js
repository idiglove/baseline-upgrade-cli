#!/usr/bin/env node
/**
 * Explore web-features data structure and extract JavaScript modernization opportunities
 */

const data = require('web-features/data.json');
const fs = require('fs');
const path = require('path');

class WebFeaturesExplorer {
  constructor() {
    this.data = data;
    this.jsFeatures = this.extractJavaScriptFeatures();
  }

  extractJavaScriptFeatures() {
    const jsFeatures = {};
    
    for (const [key, feature] of Object.entries(this.data.features)) {
      // Include features that are JavaScript-related
      if (this.isJavaScriptFeature(key, feature)) {
        jsFeatures[key] = feature;
      }
    }
    
    return jsFeatures;
  }

  isJavaScriptFeature(key, feature) {
    // Check if feature is JavaScript-related
    return (
      feature.group === 'javascript' ||
      feature.group === 'promises' ||
      feature.group === 'arrays' ||
      feature.group === 'maps' ||
      feature.group === 'sets' ||
      feature.group === 'iterators' ||
      feature.group === 'js-modules' ||
      key.includes('fetch') ||
      key.includes('xhr') ||
      key.includes('promise') ||
      key.includes('async') ||
      key.includes('await') ||
      key.includes('const') ||
      key.includes('let') ||
      key.includes('arrow') ||
      key.includes('class') ||
      key.includes('template') ||
      key.includes('destructuring') ||
      key.includes('spread') ||
      key.includes('rest') ||
      feature.compat_features?.some(cf => cf.startsWith('javascript.')) ||
      this.hasJavaScriptCompatFeatures(feature.compat_features)
    );
  }

  hasJavaScriptCompatFeatures(compatFeatures) {
    if (!compatFeatures) return false;
    
    return compatFeatures.some(cf => 
      cf.includes('javascript.') ||
      cf.includes('api.fetch') ||
      cf.includes('api.Promise') ||
      cf.includes('api.Array.') ||
      cf.includes('api.Object.') ||
      cf.includes('api.Map') ||
      cf.includes('api.Set')
    );
  }

  getBaselineStatusDisplay(baseline) {
    if (baseline === 'high') return 'widely available';
    if (baseline === 'low') return 'newly available';
    if (baseline === false) return 'limited availability';
    return 'unknown status';
  }

  analyzeJavaScriptFeatures() {
    console.log('=== JAVASCRIPT FEATURES ANALYSIS ===\n');
    
    const features = Object.entries(this.jsFeatures);
    console.log(`Total JavaScript features: ${features.length}\n`);

    // Baseline status distribution
    const baselineStats = {};
    features.forEach(([key, feature]) => {
      const status = feature.status?.baseline || 'none';
      baselineStats[status] = (baselineStats[status] || 0) + 1;
    });

    console.log('=== BASELINE STATUS DISTRIBUTION ===');
    Object.entries(baselineStats).forEach(([status, count]) => {
      const display = this.getBaselineStatusDisplay(status);
      console.log(`${display}: ${count} features`);
    });
    console.log();

    // Group by category
    const groupStats = {};
    features.forEach(([key, feature]) => {
      const group = feature.group || 'ungrouped';
      groupStats[group] = (groupStats[group] || 0) + 1;
    });

    console.log('=== GROUP DISTRIBUTION ===');
    Object.entries(groupStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([group, count]) => {
        console.log(`${group}: ${count} features`);
      });
    console.log();

    return features;
  }

  extractModernizationOpportunities() {
    console.log('=== MODERNIZATION OPPORTUNITIES ===\n');
    
    const opportunities = [];
    
    for (const [key, feature] of Object.entries(this.jsFeatures)) {
      if (feature.status?.baseline === 'high') {
        const opportunity = this.createModernizationOpportunity(key, feature);
        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    }
    
    return opportunities;
  }

  createModernizationOpportunity(key, feature) {
    // Create modernization opportunities based on feature type
    const opportunity = {
      featureKey: key,
      name: feature.name,
      description: feature.description,
      baselineStatus: feature.status?.baseline,
      group: feature.group,
      compatFeatures: feature.compat_features,
      modernizationPatterns: []
    };

    // Generate patterns based on feature key and compat features
    opportunity.modernizationPatterns = this.generateModernizationPatterns(key, feature);
    
    if (opportunity.modernizationPatterns.length > 0) {
      return opportunity;
    }
    
    return null;
  }

  generateModernizationPatterns(key, feature) {
    const patterns = [];
    
    // Fetch API patterns
    if (key === 'fetch') {
      patterns.push({
        legacy: 'XMLHttpRequest',
        modern: 'fetch()',
        pattern: 'new\\s+XMLHttpRequest|XMLHttpRequest',
        explanation: 'Use fetch() API for cleaner Promise-based HTTP requests'
      });
    }
    
    // Let/const patterns
    if (key === 'let-const') {
      patterns.push({
        legacy: 'var declarations',
        modern: 'const/let',
        pattern: 'var\\s+\\w+',
        explanation: 'Use const or let for block-scoped variables'
      });
    }
    
    // Async/await patterns
    if (key === 'async-await') {
      patterns.push({
        legacy: 'Promise chains',
        modern: 'async/await',
        pattern: '\\.then\\s*\\(|\\.catch\\s*\\(',
        explanation: 'Use async/await for cleaner asynchronous code'
      });
    }
    
    // Array methods
    if (key === 'array-includes') {
      patterns.push({
        legacy: 'indexOf !== -1',
        modern: 'includes()',
        pattern: '\\.indexOf\\s*\\([^)]+\\)\\s*(!==?\\s*-1|>=?\\s*0)',
        explanation: 'Use Array.includes() for cleaner boolean checks'
      });
    }
    
    if (key === 'array-find') {
      patterns.push({
        legacy: 'for loop with break',
        modern: 'find()',
        pattern: 'for\\s*\\([^)]*\\)\\s*{[^}]*break[^}]*}',
        explanation: 'Use Array.find() to search arrays'
      });
    }
    
    if (key === 'array-from') {
      patterns.push({
        legacy: 'Array constructor with loop',
        modern: 'Array.from()',
        pattern: 'new\\s+Array\\([^)]*\\)',
        explanation: 'Use Array.from() for array creation'
      });
    }
    
    // Template literals (if available)
    if (key.includes('template') || feature.compat_features?.some(cf => cf.includes('template'))) {
      patterns.push({
        legacy: 'string concatenation',
        modern: 'template literals',
        pattern: '\\+\\s*[\'"`]|[\'"`]\\s*\\+',
        explanation: 'Use template literals for cleaner string interpolation'
      });
    }
    
    // Arrow functions (if available)
    if (key.includes('arrow') || feature.compat_features?.some(cf => cf.includes('arrow'))) {
      patterns.push({
        legacy: 'function expressions',
        modern: 'arrow functions',
        pattern: 'function\\s*\\([^)]*\\)\\s*{[^}]*}',
        explanation: 'Use arrow functions for concise syntax'
      });
    }
    
    return patterns;
  }

  generateTrainingData() {
    console.log('=== GENERATING TRAINING DATA ===\n');
    
    const opportunities = this.extractModernizationOpportunities();
    const trainingExamples = [];
    
    for (const opportunity of opportunities) {
      for (const pattern of opportunity.modernizationPatterns) {
        // Create realistic code examples
        const examples = this.createCodeExamples(opportunity, pattern);
        trainingExamples.push(...examples);
      }
    }
    
    console.log(`Generated ${trainingExamples.length} training examples`);
    return trainingExamples;
  }

  createCodeExamples(opportunity, pattern) {
    const examples = [];
    
    // Generate multiple realistic examples for each pattern
    const codeExamples = this.generateRealisticCodeExamples(opportunity.featureKey, pattern);
    
    for (const example of codeExamples) {
      examples.push({
        instruction: "Modernize this JavaScript code using current web standards and Baseline features",
        input: example.legacy,
        output: `\`\`\`javascript\n${example.modern}\n\`\`\`\n\nExplanation: ${pattern.explanation}. This feature is ${this.getBaselineStatusDisplay(opportunity.baselineStatus)} according to Baseline.`,
        feature: opportunity.featureKey,
        featureName: opportunity.name,
        baselineStatus: opportunity.baselineStatus,
        category: opportunity.group || 'javascript',
        pattern: pattern.pattern,
        confidence: 0.9 // High confidence for Baseline high features
      });
    }
    
    return examples;
  }

  generateRealisticCodeExamples(featureKey, pattern) {
    const examples = [];
    
    switch (featureKey) {
      case 'fetch':
        examples.push(
          {
            legacy: "var xhr = new XMLHttpRequest();\nxhr.open('GET', '/api/users');\nxhr.onreadystatechange = function() {\n  if (xhr.readyState === 4 && xhr.status === 200) {\n    console.log(xhr.responseText);\n  }\n};\nxhr.send();",
            modern: "fetch('/api/users')\n  .then(response => response.text())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));"
          },
          {
            legacy: "var request = new XMLHttpRequest();\nrequest.open('POST', '/api/data', true);\nrequest.setRequestHeader('Content-Type', 'application/json');\nrequest.send(JSON.stringify({name: 'John'}));",
            modern: "fetch('/api/data', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({name: 'John'})\n});"
          }
        );
        break;
        
      case 'let-const':
        examples.push(
          {
            legacy: "var userName = 'John';\nvar userAge = 30;\nvar isActive = true;",
            modern: "const userName = 'John';\nconst userAge = 30;\nlet isActive = true;"
          },
          {
            legacy: "for (var i = 0; i < items.length; i++) {\n  var item = items[i];\n  console.log(item);\n}",
            modern: "for (let i = 0; i < items.length; i++) {\n  const item = items[i];\n  console.log(item);\n}"
          }
        );
        break;
        
      case 'array-includes':
        examples.push(
          {
            legacy: "if (fruits.indexOf('apple') !== -1) {\n  console.log('Found apple');\n}",
            modern: "if (fruits.includes('apple')) {\n  console.log('Found apple');\n}"
          },
          {
            legacy: "var hasUser = users.indexOf(currentUser) >= 0;",
            modern: "const hasUser = users.includes(currentUser);"
          }
        );
        break;
        
      case 'async-await':
        examples.push(
          {
            legacy: "getUserData()\n  .then(user => {\n    return getOrders(user.id);\n  })\n  .then(orders => {\n    console.log(orders);\n  })\n  .catch(error => {\n    console.error(error);\n  });",
            modern: "try {\n  const user = await getUserData();\n  const orders = await getOrders(user.id);\n  console.log(orders);\n} catch (error) {\n  console.error(error);\n}"
          }
        );
        break;
    }
    
    return examples;
  }

  saveData(filename, data) {
    const dir = path.join(__dirname, 'output');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Saved data to: ${filepath}`);
    return filepath;
  }

  run() {
    console.log('Web Features Data Explorer\n');
    console.log(`Total features in database: ${Object.keys(this.data.features).length}`);
    console.log(`JavaScript-related features: ${Object.keys(this.jsFeatures).length}\n`);

    // Analyze features
    this.analyzeJavaScriptFeatures();

    // Extract modernization opportunities
    const opportunities = this.extractModernizationOpportunities();
    console.log(`\nFound ${opportunities.length} modernization opportunities\n`);

    // Show sample opportunities
    console.log('=== SAMPLE OPPORTUNITIES ===');
    opportunities.slice(0, 5).forEach((opp, i) => {
      console.log(`${i + 1}. ${opp.name} (${opp.featureKey})`);
      console.log(`   Status: ${this.getBaselineStatusDisplay(opp.baselineStatus)}`);
      console.log(`   Patterns: ${opp.modernizationPatterns.length}`);
      if (opp.modernizationPatterns.length > 0) {
        console.log(`   Example: ${opp.modernizationPatterns[0].legacy} → ${opp.modernizationPatterns[0].modern}`);
      }
      console.log();
    });

    // Generate training data
    const trainingData = this.generateTrainingData();
    
    // Save results
    this.saveData('javascript_features.json', this.jsFeatures);
    this.saveData('modernization_opportunities.json', opportunities);
    this.saveData('training_data.json', trainingData);

    console.log('\n=== SUMMARY ===');
    console.log(`JavaScript features extracted: ${Object.keys(this.jsFeatures).length}`);
    console.log(`Modernization opportunities: ${opportunities.length}`);
    console.log(`Training examples generated: ${trainingData.length}`);
  }
}

if (require.main === module) {
  const explorer = new WebFeaturesExplorer();
  explorer.run();
}