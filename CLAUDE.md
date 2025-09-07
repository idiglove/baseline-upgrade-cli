# Baseline Upgrade CLI Tool

## Project Overview

A CLI tool that scans codebases and suggests modern web feature upgrades using Baseline data, transforming from "you can't use this" to "here's something better you can use."

## Core Concept

```bash
npx baseline-upgrade ./src
```

## Sample Output

```text
🚀 Found 12 modernization opportunities in your codebase:

📁 src/api/client.js
  Line 15: XMLHttpRequest → fetch() API
  ✨ fetch() is Baseline stable and provides cleaner Promise-based syntax

📁 src/styles/layout.css
  Line 23: float-based layout → CSS Grid
  💡 CSS Grid is Baseline stable and eliminates clearfix hacks

📁 src/utils/helpers.js
  Line 8: var declarations → const/let
  🎯 Block-scoped declarations are Baseline stable and prevent hoisting issues

💰 Impact: Removing 3 polyfills could reduce bundle size by ~15KB
```

## Key Features

### Smart Suggestions

- **Context-aware recommendations** - Different suggestions for React vs vanilla JS vs Vue
- **Bundle impact analysis** - "Upgrading this could remove X polyfills, saving Y KB"
- **Baseline confidence levels** - Stable vs newly available features based on web-features data
- **Priority scoring** - Focus on highest-impact modernizations first

### Developer Experience

- **Auto-fix option** - `--fix` flag for safe automated updates
- **Interactive mode** - Choose which suggestions to apply
- **Custom rules** - Team-specific modernization priorities
- **CI/CD integration** - Generate upgrade reports in pipelines
- **Export formats** - JSON, HTML, or markdown reports

### Advanced Capabilities

- **Dependency analysis** - Detect when polyfills can be removed
- **Browser target awareness** - Adjust suggestions based on target browsers
- **Framework integration** - Special rules for React, Vue, Angular patterns
- **Performance metrics** - Estimate performance improvements

## Technical Architecture

### Core Components

1. **File Scanner** - Recursively process project files
2. **Parser Engine** - AST parsing for JS/TS, CSS parsing for stylesheets
3. **Deterministic Rule Engine** - Pattern-based modernization rules with Baseline data integration
4. **Baseline Integration** - Web features data for feature support validation
5. **Report Generator** - Multiple output formats
6. **Auto-fix Engine** - Safe automated code transformations

### Technology Stack

- **Language**: Node.js/TypeScript
- **JS Parsing**: Babel parser, TypeScript compiler API
- **CSS Parsing**: PostCSS, CSS Tree
- **Baseline Data**: web-features npm package
- **Rule Engine**: Pattern matching with AST traversal
- **CLI Framework**: Commander.js
- **Testing**: Jest
- **Build**: esbuild

## Command Line Interface

### Basic Usage

```bash
# Scan current directory
baseline-upgrade .

# Scan specific path
baseline-upgrade ./src

# Auto-fix safe changes
baseline-upgrade . --fix

# Interactive mode
baseline-upgrade . --interactive

# Generate report
baseline-upgrade . --output report.html
```

### Configuration Options

```bash
# Target specific browsers
baseline-upgrade . --target "defaults, not IE 11"

# Focus on specific categories
baseline-upgrade . --categories css,js,performance

# Exclude certain files
baseline-upgrade . --ignore "node_modules/**,*.min.js"

# Custom config file
baseline-upgrade . --config .baseline.json
```

## Configuration File (.baseline.json)

```json
{
  "targets": ["defaults", "not IE 11"],
  "categories": ["javascript", "css", "html", "performance"],
  "ignore": ["node_modules/**", "*.min.js", "vendor/**"],
  "rules": {
    "prefer-const": "error",
    "suggest-fetch": "warn",
    "suggest-grid": "info"
  },
  "autofix": {
    "safe": true,
    "experimental": false
  }
}
```

## Example Modernization Rules

### JavaScript Suggestions

- `var` → `const`/`let`
- `XMLHttpRequest` → `fetch()`
- `Promise` constructor → `async/await`
- `Array.indexOf()` → `Array.includes()`
- `Object.assign()` → object spread
- jQuery DOM methods → native DOM APIs

### CSS Suggestions

- Float layouts → CSS Grid/Flexbox
- Browser prefixes → standard properties
- `@supports` for graceful degradation
- Custom properties (CSS variables)
- Modern selectors (`:is()`, `:where()`)

### HTML Suggestions

- Semantic HTML5 elements
- Modern input types
- Native form validation
- Web components

## Hackathon Submission Plan

### MVP Features (Week 1)

1. Basic file scanning
2. JavaScript rule engine
3. Simple CLI interface
4. Baseline data integration
5. Text-based reporting

### Advanced Features (Week 2)

1. CSS parsing and rules
2. Auto-fix capability
3. HTML report generation
4. CI/CD integration
5. Performance impact analysis

### Polish & Demo (Final Days)

1. Documentation website
2. Demo video creation
3. Test coverage
4. Package for npm publication
5. GitHub Actions workflow

## Value Proposition

### For Individual Developers

- **Learn modern practices** through suggestions
- **Reduce technical debt** incrementally
- **Improve performance** by removing polyfills
- **Stay current** with web standards

### For Teams

- **Standardize modernization** across projects
- **Onboard junior developers** with best practices
- **Quantify technical debt** with metrics
- **Automate code reviews** for modern patterns

## Success Metrics

- **Adoption**: npm downloads, GitHub stars
- **Impact**: Bundle size reductions, performance improvements
- **Community**: Issues, PRs, feature requests
- **Integration**: Usage in CI/CD pipelines

This positions the tool as a positive, educational experience that helps developers grow while modernizing their codebases!
