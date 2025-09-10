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

-----------------------------------------

## ✅ PROGRESS: Working Prototype Completed

**Current Status**: We have a fully functional CLI tool that analyzes JavaScript/TypeScript code using a deterministic rule-based engine with Baseline data integration to provide reliable modernization suggestions.

## Completed Development Steps

### ✅ Step 1: Project Structure and CLI Framework (COMPLETE)

**Goals Achieved:**
- ✅ Initialize Node.js/TypeScript project with npm init
- ✅ Install CLI framework (Commander.js) and development dependencies
- ✅ Set up TypeScript configuration with ESLint and Prettier
- ✅ Create comprehensive project structure
- ✅ Create CLI command structure with Commander.js subcommands
- ✅ Set up build pipeline (TypeScript + esbuild)

**Key Files Created:**
- `package.json` - Full dependency setup including Claude AI SDK
- `tsconfig.json` - TypeScript compiler configuration
- `src/cli.ts` - Main CLI with `file`, `commit`, and `scan` subcommands
- `src/scanner.ts` - File scanning and content reading logic
- `src/reporter.ts` - Formatted report generation
- `bin/baseline-upgrade` - Executable script

### ✅ Step 2: File Scanner (COMPLETE)

**Goals Achieved:**
- ✅ Recursive directory traversal
- ✅ File filtering for .js, .ts, .jsx, .tsx extensions  
- ✅ Ignore patterns (node_modules, .min.js, dist/, build/, etc.)
- ✅ File content reading with size limits
- ✅ Git integration for commit-based analysis
- ✅ Full directory scanning with configurable options
- ✅ Comprehensive error handling

### ✅ Step 3: Deterministic Rule-Based Modernization Engine (COMPLETE)

**Architecture Decision**: Implemented a deterministic rule-based system that provides consistent, reproducible results without external API dependencies.

**Major Achievement**: Built `DeterministicEngine` with:
- ✅ **Pattern-Based Rules**: AST-based pattern matching for code analysis
- ✅ **Baseline Integration**: Direct integration with web-features data for feature validation
- ✅ **Configurable Rules**: Extensible rule system for different modernization patterns
- ✅ **Fast Execution**: No API calls, immediate analysis results
- ✅ **Consistent Results**: Deterministic output for reliable CI/CD integration

### ✅ Step 4: Baseline Data Integration (COMPLETE)

**Rule Configuration Pipeline**: 
- ✅ `data-preparation/explore_web_features.js` - Analyzed 700+ web features
- ✅ `data-preparation/rule_generator.js` - Generated rule configurations
- ✅ **Pattern-Based Rules** with categories: javascript, arrays, promises, API patterns
- ✅ Each rule includes legacy patterns, modern transformations, and Baseline status

### ✅ Step 5: Advanced CLI Implementation (COMPLETE)

**Working Commands:**
```bash
# Analyze single file
baseline-upgrade file ./src/api.js
baseline-upgrade file ./src/component.tsx --verbose --format json

# Analyze git commit changes  
baseline-upgrade commit HEAD
baseline-upgrade commit abc123 --verbose

# Full directory scanning (NEW)
baseline-upgrade scan ./src
baseline-upgrade scan . --verbose --ignore "node_modules/**,dist/**"
baseline-upgrade scan ./src --extensions ".js,.ts" --format json

# Standard CLI utilities
baseline-upgrade --help
baseline-upgrade --version
```

**Features Implemented:**
- ✅ **Offline Operation**: No external API dependencies
- ✅ **Multiple Output Formats**: Human-readable text and JSON
- ✅ **Verbose Mode**: Shows analysis progress
- ✅ **Git Integration**: Analyzes changed files in commits
- ✅ **Full Directory Scanning**: Recursive analysis with configurable filters
- ✅ **Flexible Configuration**: Custom ignore patterns, file extensions, size limits
- ✅ **Error Handling**: Missing files, parsing failures, invalid commits

### ✅ Step 6: Full Directory Scanning (COMPLETE)

**Goal**: Extend from single-file analysis to comprehensive project scanning

**Major Achievement**: Added `scan` command with full directory traversal capabilities:

**Key Features:**
- ✅ **Recursive Directory Scanning**: Traverses entire project trees
- ✅ **Smart File Filtering**: Configurable extensions (.js, .ts, .jsx, .tsx by default)
- ✅ **Ignore Patterns**: Excludes node_modules, build dirs, minified files automatically
- ✅ **Custom Configuration**: Command-line options for ignore patterns, extensions, file size limits
- ✅ **Batch Processing**: Efficiently analyzes multiple files with progress reporting
- ✅ **Error Resilience**: Continues processing even when individual files fail
- ✅ **Flexible Output**: Same text/JSON formats as other commands

**Command Usage:**
```bash
# Scan current directory
baseline-upgrade scan

# Scan specific directory with options
baseline-upgrade scan ./src --verbose
baseline-upgrade scan . --ignore "node_modules/**,dist/**" --extensions ".js,.ts"
baseline-upgrade scan ./src --max-size 2048 --format json
```

**Example Output:**
```text
🚀 Scanning src for modernization opportunities...
📂 Found 21 files to analyze
✓ Analyzed /path/to/file1.js (3 suggestions)
✓ Analyzed /path/to/file2.ts (0 suggestions)
...
🚀 Found 7 modernization opportunities in your codebase:
...
💰 7 suggestions use Baseline stable features
```

**Impact**: This completes the core CLI functionality, making the tool practical for real-world codebases by supporting full project analysis rather than just single files.

### ✅ Step 7: Text-Based Reporting (COMPLETE)

**Report Features:**
- ✅ **Emoji Status Indicators**:
  - ✨ High support (widely available)
  - 🎯 Low support (newly available)
  - ⚠️ Limited support  
  - 💡 Not supported yet
- ✅ **Grouped by File**: Organized suggestions per source file
- ✅ **Line-by-Line**: Exact code locations with old → new transformations
- ✅ **Summary Statistics**: Total suggestions and Baseline status counts
- ✅ **JSON Export**: Machine-readable format for CI/CD integration

## Current Architecture

```text
src/
├── cli.ts                    # CLI entry point with Commander.js subcommands
├── deterministic-engine.ts  # Rule-based pattern matching engine  
├── reporter.ts              # Output formatting (text/JSON)
├── scanner.ts               # File scanning utilities
└── rules/                   # Modernization rule definitions

data-preparation/
├── explore_web_features.js  # Baseline data exploration  
├── rule_generator.js        # Rule configuration generation
└── output/
    └── modernization_rules.json # Generated rule configurations

bin/
└── baseline-upgrade         # Executable CLI script
```