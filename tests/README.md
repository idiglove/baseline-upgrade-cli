# Test Files

This directory contains test files designed to validate the baseline-upgrade CLI tool's ability to identify modernization opportunities.

## Test Files

### `mixed-baseline-features.js`
A comprehensive JavaScript test file that combines:

#### ❌ **Legacy Patterns (Should be flagged)**:
- `var` declarations → suggest `const`/`let`
- `XMLHttpRequest` → suggest `fetch()` API
- `Array.indexOf()` for existence → suggest `Array.includes()`
- `Object.assign()` → suggest spread syntax `{...}`
- Manual loops → suggest `Array.map()`
- Promise constructors → suggest `async`/`await`
- String concatenation → suggest template literals
- Function expressions → suggest arrow functions
- Manual destructuring → suggest destructuring assignment
- `arguments` object → suggest rest parameters
- `Array.prototype.push.apply` → suggest spread syntax
- Legacy DOM methods → suggest `querySelector`
- Legacy string methods → suggest modern alternatives

#### ✅ **Modern Patterns (Should NOT be flagged)**:
- Already uses `const`/`let`
- Already uses `fetch()` API
- Already uses `Array.includes()`
- Already uses spread syntax
- Already uses `Array.map()`
- Already uses `async`/`await`
- Already uses template literals
- Already uses arrow functions
- Already uses destructuring
- Already uses rest parameters
- Already uses modern DOM methods
- Already uses modern string methods

### `css-mixed-features.css`
A CSS test file that combines:

#### ❌ **Legacy CSS (Should be flagged)**:
- Float-based layouts → suggest CSS Grid/Flexbox
- Unnecessary vendor prefixes → suggest standard properties
- Legacy flexbox syntax → suggest modern flexbox
- Hardcoded colors → suggest CSS custom properties
- Legacy positioning tricks → suggest modern transforms
- Vendor-prefixed animations → suggest standard animations

#### ✅ **Modern CSS (Should NOT be flagged)**:
- CSS Grid layouts
- Modern flexbox without prefixes
- CSS custom properties (variables)
- Modern positioning with transforms
- Container queries
- Modern color formats (hsl, oklch, color-mix)
- Modern pseudo-selectors
- Logical properties

## Usage

Test these files with the CLI:

```bash
# Test JavaScript modernization
npm run analyze:file tests/mixed-baseline-features.js

# Test with verbose output
npm run analyze:file tests/mixed-baseline-features.js -- --verbose

# Test CSS modernization (if CSS support is added)
npm run analyze:file tests/css-mixed-features.css

# Get JSON output for automated testing
npm run analyze:file tests/mixed-baseline-features.js -- --format json
```

## Expected Behavior

The RAG engine should:

1. **Identify legacy patterns** from the training data
2. **Suggest modern alternatives** with Baseline status
3. **Ignore already modern code** to avoid redundant suggestions
4. **Provide line numbers** for each suggestion
5. **Score suggestions** based on confidence and impact

## Validation

A good test run should:
- Find ~10-15 modernization opportunities in the JavaScript file
- NOT suggest changes for already modern patterns
- Provide accurate line numbers and descriptions
- Show high confidence scores for clear patterns
- Reference appropriate Baseline features