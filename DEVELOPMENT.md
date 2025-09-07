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

### Step 3: AI-Powered Modernization Engine ✅ COMPLETE (Prototype)

**Goal**: Build scalable AI-powered code analysis using embeddings

**Initial Implementation (Manual Rules - Prototype)**:
- ✅ Set up Babel parser for AST generation
- ✅ Create rule engine architecture with 3 manual rules
- ✅ Implement `var` → `const`/`let`, `XMLHttpRequest` → `fetch()`, `indexOf` → `includes`
- ✅ Prove concept with 12 suggestions on test code

**Next Phase (AI/Embeddings Approach)**:

**Tasks**:

- Research and implement embeddings-based modernization engine:

  ```typescript
  class EmbeddingBasedEngine {
    private embeddings: Float32Array[];     // Pre-computed Baseline features (~5MB)  
    private patterns: PatternDatabase;      // Known modernization patterns
    
    async analyzeCode(code: string): Promise<Suggestion[]> {
      const codeEmbedding = this.extractEmbedding(code);
      const similarFeatures = this.findSimilar(codeEmbedding);
      return this.mapToSuggestions(similarFeatures, code);
    }
  }
  ```

- Install `web-features` package for Baseline data
- Build embedding model from Baseline features + code patterns
- Create pattern database with pre-computed embeddings
- Implement cosine similarity search for pattern matching
- Add LLM API fallback for low-confidence cases

**Expected Output**: 5-10MB embeddings model with <100ms inference time

### Step 4: Baseline Data Integration and Model Training

**Goal**: Create embeddings from Baseline web standards data

**Tasks**:

- Research `web-features` npm package structure and data format
- Extract Baseline feature descriptions, compatibility data, and code examples
- Generate embeddings for each Baseline feature using sentence transformers
- Map code patterns to Baseline features via semantic similarity
- Build pattern database with modernization suggestions
- Include Baseline stability status (stable/newly-available/limited) in suggestions
- Package embeddings model for distribution (~5-10MB)

**Expected Output**: Production-ready embeddings model with Baseline feature mappings

### Step 5: Text-Based Reporting

**Goal**: Format and display suggestions to users

**Tasks**:

- Create reporter that matches the example format:

  ```text
  🚀 Found 12 modernization opportunities in your codebase:
  
  📁 src/api/client.js
    Line 15: XMLHttpRequest → fetch() API
    ✨ fetch() is Baseline stable and provides cleaner Promise-based syntax
  ```

- Add emoji and color support for terminal output
- Group suggestions by file
- Add summary statistics
- Implement different verbosity levels

**Expected Output**: Pretty console output matching design specs

### Step 6: MVP Testing and Validation

**Goal**: Test the complete pipeline with real codebases

**Tasks**:

- Create sample test projects with legacy code patterns
- Run tool against sample codebases
- Verify accuracy of suggestions
- Test edge cases and error handling
- Collect performance metrics
- Document any issues or improvements needed

**Expected Output**: Validated MVP ready for demo

## CLI Interface Design

### Basic Commands

```bash
# Scan current directory
baseline-upgrade .

# Scan specific path
baseline-upgrade ./src

# Help and version
baseline-upgrade --help
baseline-upgrade --version
```

### Initial Options

```bash
# Verbose output
baseline-upgrade . --verbose

# JSON output for CI/CD
baseline-upgrade . --format json

# Ignore patterns
baseline-upgrade . --ignore "*.min.js,vendor/**"
```

## Technical Decisions

### Parser Choice: Babel

- Handles modern JS/TS syntax
- Robust AST traversal
- Large ecosystem of plugins

### CLI Framework: Commander.js

- Industry standard for Node.js CLIs
- Good documentation and examples
- Handles argument parsing and help generation

### Build Tool: TypeScript + esbuild

- Fast compilation
- Single executable output
- Good developer experience

## Success Criteria for MVP

- [ ] Can scan JavaScript files in any directory
- [ ] Detects at least 3 modernization patterns
- [ ] Integrates Baseline data for feature support
- [ ] Outputs formatted suggestions with file:line references
- [ ] Handles common edge cases gracefully
- [ ] Executable as `npx baseline-upgrade`

## Next Steps After MVP

1. Add CSS parsing and rules
2. Implement auto-fix capability
3. Add interactive mode
4. Create HTML report generation
5. Add bundle size impact analysis
