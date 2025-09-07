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

### Step 3: AI-Powered Modernization Engine ✅ COMPLETE (Claude RAG-based)

**Goal**: Build scalable AI-powered code analysis using Claude AI with RAG

**Initial Implementation (Manual Rules - Prototype)**:
- ✅ Set up Babel parser for AST generation
- ✅ Create rule engine architecture with 3 manual rules
- ✅ Implement `var` → `const`/`let`, `XMLHttpRequest` → `fetch()`, `indexOf` → `includes`
- ✅ Prove concept with 12 suggestions on test code

**Current Implementation (Claude RAG Approach) - ✅ COMPLETE**:

**Architecture**:
```typescript
class ClaudeRAGEngine {
  private anthropic: Anthropic;              // Claude AI client
  private trainingData: TrainingExample[];   // Web features training data
  
  async analyzeFile(content: string, filePath: string): Promise<ModernizationSuggestion[]> {
    const relevantExamples = this.findRelevantExamples(content);
    const ragContext = this.createRAGContext(relevantExamples);
    return await this.callClaudeWithRAG(content, ragContext);
  }
}
```

**Completed Tasks**:
- ✅ Install `web-features` package for Baseline data
- ✅ Build comprehensive training dataset from web-features (1000+ examples)
- ✅ Implement intelligent pattern matching for RAG context selection
- ✅ Create Claude prompt engineering with contextual examples
- ✅ Add semantic scoring for relevance ranking
- ✅ Support multiple categories: JavaScript, arrays, promises, API patterns
- ✅ Include Baseline status mapping (high/low/limited support)

**Data Generation Pipeline**:
- ✅ `data-preparation/explore_web_features.js` - Baseline data exploration
- ✅ `data-preparation/data_driven_generator.js` - Training data generation
- ✅ Generated 1000+ training examples with code patterns and modernization advice
- ✅ Semantic keyword extraction from training data for dynamic matching

**Expected Output**: Claude-powered analysis with contextual training examples

### Step 4: Baseline Data Integration and Model Training ✅ COMPLETE

**Goal**: Create training data from Baseline web standards data

**Completed Tasks**:
- ✅ Research `web-features` npm package structure and data format
- ✅ Extract Baseline feature descriptions, compatibility data, and code examples
- ✅ Generate comprehensive training dataset (1000+ examples) from web-features
- ✅ Map code patterns to Baseline features via intelligent keyword matching
- ✅ Build pattern database with modernization suggestions and contextual examples
- ✅ Include Baseline stability status (high/low/limited/not supported) in suggestions
- ✅ Create RAG-based retrieval system for contextually relevant suggestions

**Data Structure**:
```typescript
interface TrainingExample {
  instruction: string;        // What to look for
  input: string;             // Code example
  output: string;            // Modernization advice
  feature: string;           // Baseline feature ID
  featureName: string;       // Human-readable feature name
  baselineStatus: string;    // Baseline support level
  category: string;          // javascript, arrays, promises, etc.
  confidence: number;        // Reliability score
  legacyPattern?: string;    // Pattern to detect
  modernMethod?: string;     // Modern replacement
}
```

**Expected Output**: ✅ Complete training dataset with 1000+ contextualized examples

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
- ✅ CLI accepts API key via environment variable or --api-key flag
- ✅ Proper error handling for missing files, API failures
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

# API key specification (or set ANTHROPIC_API_KEY env var)
baseline-upgrade file ./src/api.js --api-key your-key-here
```

### Future Options (Not Yet Implemented)

```bash
# Directory scanning (planned)
baseline-upgrade . 

# Ignore patterns (planned)
baseline-upgrade . --ignore "*.min.js,vendor/**"

# Auto-fix mode (planned)
baseline-upgrade . --fix
```

## Technical Decisions

### AI Engine: Claude AI with RAG

**Why Claude instead of embeddings**:
- Superior code understanding and context awareness
- No need to build/maintain embedding models
- Better natural language explanations
- Handles edge cases more gracefully

**RAG Implementation**:
- Training data from web-features package (1000+ examples)
- Semantic keyword matching for context retrieval
- Dynamic scoring system for relevance ranking
- Contextual prompts with relevant modernization examples

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
- 🚧 Full directory scanning (single files work, directory planned)

## Current Architecture Overview

```text
src/
├── cli.ts                 # Main CLI entry point with Commander.js
├── claude-rag-engine.ts   # Claude AI integration with RAG system  
├── reporter.ts            # Output formatting (text/JSON)
├── scanner.ts             # File scanning utilities
└── web-features-engine.ts # Legacy engine (replaced by Claude)

data-preparation/
├── explore_web_features.js      # Baseline data exploration
├── data_driven_generator.js     # Training data generation  
└── output/
    └── data_driven_training.json # Generated training examples (1000+)

bin/
└── baseline-upgrade       # Executable script

Built files in dist/ directory
```

## Next Steps After MVP

1. Add CSS parsing and rules
2. Implement auto-fix capability
3. Add interactive mode
4. Create HTML report generation
5. Add bundle size impact analysis
