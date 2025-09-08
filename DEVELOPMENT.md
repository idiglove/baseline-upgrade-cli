# Development Roadmap

## MVP Development Steps

### Step 1: Project Structure and CLI Framework

**Goal**: Set up the foundation for a Node.js CLI tool

**Tasks**:

- Initialize Node.js/TypeScript project with `npm init`
- Install CLI framework (Commander.js) and development dependencies
- Set up TypeScript configuration
- Create basic project structure:

  ```text
  src/
    cli.ts          # Main CLI entry point
    scanner.ts      # File scanning logic
    rules/          # Modernization rules
    reporter.ts     # Output formatting
  tests/            # Test files
  bin/              # Executable scripts
  ```

- Create basic CLI command structure with Commander.js
- Set up build pipeline (esbuild/tsc)

**Expected Output**: Working CLI that accepts file paths and basic options

### Step 2: File Scanner

**Goal**: Recursively scan directories for JavaScript/TypeScript files

**Tasks**:

- Implement recursive directory traversal
- File filtering for .js, .ts, .jsx, .tsx extensions
- Implement ignore patterns (node_modules, .min.js, etc.)
- Read file contents and prepare for parsing
- Handle error cases (permissions, large files, etc.)

**Expected Output**: Scanner that can find and read all JS/TS files in a project

### Step 3: Deterministic Rule-Based Modernization Engine ✅ COMPLETE

**Goal**: Build scalable pattern-based code analysis using AST traversal and deterministic rules

**Initial Implementation (Manual Rules - Prototype)**:
- ✅ Set up Babel parser for AST generation
- ✅ Create rule engine architecture with 3 manual rules
- ✅ Implement `var` → `const`/`let`, `XMLHttpRequest` → `fetch()`, `indexOf` → `includes`
- ✅ Prove concept with 12 suggestions on test code

**Current Implementation (Deterministic Rule Engine) - ✅ COMPLETE**:

**Architecture**:
```typescript
class DeterministicEngine {
  private rules: ModernizationRule[];        // Pattern-based rules
  private baselineData: BaselineFeatures;    // Web features data
  
  analyzeFile(content: string, filePath: string): ModernizationSuggestion[] {
    const ast = this.parseCode(content);
    const suggestions = this.applyRules(ast, filePath);
    return this.enrichWithBaseline(suggestions);
  }
}
```

**Completed Tasks**:
- ✅ Install `web-features` package for Baseline data
- ✅ Implement AST-based pattern matching rules
- ✅ Create deterministic rule engine with configurable rules
- ✅ Add Baseline data integration for feature support validation
- ✅ Implement rules for JavaScript, arrays, promises, API patterns
- ✅ Include Baseline status mapping (high/low/limited support)

**Rule Development Pipeline**:
- ✅ `data-preparation/explore_web_features.js` - Baseline data exploration
- ✅ Pattern-based rule definitions with AST node matching
- ✅ Generated rule configurations with code patterns and transformations
- ✅ Rule validation and testing framework

**Expected Output**: Deterministic pattern-based analysis with Baseline feature validation

### Step 4: Baseline Data Integration and Rule Configuration ✅ COMPLETE

**Goal**: Integrate Baseline web standards data with deterministic rules

**Completed Tasks**:
- ✅ Research `web-features` npm package structure and data format
- ✅ Extract Baseline feature descriptions, compatibility data, and specifications
- ✅ Create rule configuration system mapping patterns to Baseline features
- ✅ Map code patterns to Baseline features via deterministic matching
- ✅ Build rule database with modernization transformations and explanations
- ✅ Include Baseline stability status (high/low/limited/not supported) in rules
- ✅ Create feature lookup system for rule validation

**Data Structure**:
```typescript
interface ModernizationRule {
  id: string;                // Rule identifier
  pattern: ASTPattern;       // AST pattern to match
  replacement: string;       // Modern replacement pattern
  feature: string;           // Baseline feature ID
  featureName: string;       // Human-readable feature name
  baselineStatus: string;    // Baseline support level
  category: string;          // javascript, arrays, promises, etc.
  confidence: number;        // Rule reliability score
  description: string;       // Explanation of improvement
  impact: 'high' | 'medium' | 'low';
}
```

**Expected Output**: ✅ Complete rule configuration with pattern-based transformations

### Step 5: Text-Based Reporting ✅ COMPLETE

**Goal**: Format and display suggestions to users

**Completed Tasks**:
- ✅ Create reporter that matches the example format with emojis and structure
- ✅ Add emoji support for different Baseline statuses:
  - ✨ High support (widely available)
  - 🎯 Low support (newly available)  
  - ⚠️ Limited support
  - 💡 Not supported yet
- ✅ Group suggestions by file for organized output
- ✅ Add summary statistics (total suggestions, high-baseline count)
- ✅ Support both text and JSON output formats
- ✅ Include line numbers and old→new code transformations

**Output Format Example**:
```text
🚀 Found 3 modernization opportunities in your codebase:

📁 src/api/client.js
  Line 15: XMLHttpRequest → fetch() API
  ✨ fetch() is Baseline stable and provides cleaner Promise-based syntax

💰 2 suggestions use Baseline stable features
```

**Expected Output**: ✅ Pretty console output with structured formatting

### Step 6: MVP Testing and Validation ✅ IN PROGRESS

**Goal**: Test the complete pipeline with real codebases

**Completed Tasks**:
- ✅ Built working CLI with two operational commands:
  - `baseline-upgrade file <filepath>` - Analyze single file
  - `baseline-upgrade commit [hash]` - Analyze git commit changes
- ✅ Integrated Claude AI API with proper error handling
- ✅ Added verbose and JSON output options
- ✅ Tested with TypeScript and JavaScript files
- ✅ Validated Claude RAG system with contextual suggestions

**Current Implementation**:
- ✅ CLI with deterministic analysis (no API keys required)
- ✅ Proper error handling for missing files and parsing failures
- ✅ Git integration for commit-based analysis
- ✅ File filtering for JS/TS/JSX/TSX extensions

**Remaining Tasks**:
- [ ] Create comprehensive test suite
- [ ] Test against larger codebases
- [ ] Performance optimization and benchmarking
- [ ] Edge case handling improvements

**Expected Output**: ✅ Working prototype ready for testing and demo

## CLI Interface Design

### Basic Commands ✅ IMPLEMENTED

```bash
# Analyze single file
baseline-upgrade file ./src/api.js
baseline-upgrade file ./src/api.js --verbose --format json

# Analyze git commit changes
baseline-upgrade commit HEAD
baseline-upgrade commit abc123 --verbose

# Help and version
baseline-upgrade --help
baseline-upgrade --version
```

### Available Options ✅ IMPLEMENTED

```bash
# Verbose output (shows analysis progress)
baseline-upgrade file ./src/api.js --verbose

# JSON output for CI/CD integration
baseline-upgrade file ./src/api.js --format json

# Custom rule configuration (optional)
baseline-upgrade file ./src/api.js --config ./custom-rules.json
```

### Directory Scanning Options ✅ IMPLEMENTED

```bash
# Directory scanning
baseline-upgrade scan .
baseline-upgrade scan ./src --verbose

# Ignore patterns and extensions
baseline-upgrade scan . --ignore "*.min.js,vendor/**" --extensions ".js,.ts"

# File size limits and output formats
baseline-upgrade scan ./src --max-size 2048 --format json
```

### Future Options (Not Yet Implemented)

```bash
# Auto-fix mode (planned)
baseline-upgrade scan . --fix

# Configuration file support (planned)
baseline-upgrade scan . --config .baseline.json
```

## Technical Decisions

### Deterministic Rule Engine

**Why deterministic over AI-based**:
- Consistent, reproducible results
- No API dependencies or rate limits
- Faster execution and offline capability
- Transparent rule logic for debugging

**Rule Implementation**:
- Pattern-based AST matching from web-features package
- Direct code transformation rules
- Baseline feature validation system
- Configurable rule sets for different project needs

### CLI Framework: Commander.js ✅

- Industry standard for Node.js CLIs
- Good documentation and examples  
- Handles argument parsing and help generation
- Successfully implemented with subcommands

### Build Tool: TypeScript + esbuild ✅

- Fast compilation with `npm run build`
- Single executable output via `bin/baseline-upgrade`
- Good developer experience with `ts-node` for development
- ESLint + Prettier integration for code quality

### Data Pipeline: Node.js Scripts ✅

- `data-preparation/explore_web_features.js` - Baseline data exploration
- `data-preparation/data_driven_generator.js` - Training data generation
- Direct integration with `web-features` npm package

## Success Criteria for MVP

- ✅ Can analyze JavaScript/TypeScript files individually
- ✅ Detects modernization patterns using Claude AI + RAG
- ✅ Integrates Baseline data for feature support levels
- ✅ Outputs formatted suggestions with file:line references  
- ✅ Handles common edge cases (missing files, API errors)
- ✅ Executable as `baseline-upgrade` CLI tool
- ✅ Git integration for commit-based analysis
- ✅ Full directory scanning with configurable options

## Current Architecture Overview

```text
src/
├── cli.ts                    # Main CLI entry point with Commander.js
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
└── baseline-upgrade         # Executable script

Built files in dist/ directory
```

## ✅ MAJOR UPDATE: Full Directory Scanning Complete

**Achievement**: Successfully implemented comprehensive directory scanning functionality, completing a key missing piece of the CLI tool.

**New `scan` Command Features:**
- **Recursive Directory Traversal**: Scans entire project trees
- **Configurable File Filtering**: `--extensions` option for custom file types  
- **Smart Ignore Patterns**: `--ignore` option with sensible defaults
- **File Size Control**: `--max-size` option to handle large files
- **Batch Processing**: Efficient analysis of multiple files
- **Progress Reporting**: Verbose mode shows real-time analysis progress
- **Consistent Output**: Same text/JSON formats as other commands

**Usage Examples:**
```bash
# Scan current directory
baseline-upgrade scan

# Scan with custom options
baseline-upgrade scan ./src --verbose --ignore "node_modules/**,dist/**"
baseline-upgrade scan . --extensions ".js,.ts,.jsx,.tsx" --format json
```

**Impact**: This completes the core functionality roadmap, making the tool practical for real-world codebase modernization at scale.

## Key Learnings from Industry Tools

### 1. LSP TextEdit Principles
- Apply edits **bottom-to-top** to avoid position shifts
- Apply same-line edits **right-to-left** to prevent interference  
- All TextEdits reference the **original document state**
- **No overlapping edits** are supported

### 2. ESLint's Approach
- When multiple fixes target the same position, **only one is applied**
- Fixes are sorted by position and applied in reverse order
- Conflicting fixes are automatically filtered out

### 3. Prettier's Strategy
- Uses **single AST pass** with comprehensive transformations
- Avoids position conflicts by working on the AST level
- Rebuilds the entire code from AST rather than applying patches

### 4. Auto-Fix Implementation Challenges
- **Position calculation errors** cause broken syntax when applying fixes
- **Duplicate suggestions** from multiple rules need deduplication
- **Parse errors** block entire files from being processed
- **Rule precision** is more valuable than rule quantity

### 5. Conflict Resolution Best Practices
- Sort suggestions by position (end position descending)
- Apply deduplication using range overlap detection
- Handle null/undefined positions gracefully
- Use try-catch blocks around individual rule applications
- Validate that old code matches expected content before applying fixes

## Next Steps After MVP

1. ~~Add full directory scanning~~ ✅ **COMPLETED**
2. Implement auto-fix capability
3. Add CSS parsing and rules
4. Add interactive mode
5. Create HTML report generation
6. Add bundle size impact analysis
