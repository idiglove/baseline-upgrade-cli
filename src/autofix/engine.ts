import { TextEdit, AutofixSuggestion, AutofixResult, AutofixOptions, Position, Range, AutofixError } from './types';

export class AutofixEngine {
  private sourceLines: string[];
  private suggestions: AutofixSuggestion[];

  constructor(sourceCode: string, suggestions: AutofixSuggestion[]) {
    this.sourceLines = sourceCode.split('\n');
    this.suggestions = suggestions;
  }

  /**
   * Apply autofix suggestions to source code using LSP-style TextEdits
   * Implements industry best practices:
   * 1. Apply edits bottom-to-top to avoid position shifts
   * 2. Apply same-line edits right-to-left 
   * 3. Filter overlapping edits
   * 4. Validate edits before applying
   */
  applyFixes(options: AutofixOptions = {}): AutofixResult {
    const { dryRun = false, safeOnly = true, maxEdits = 100 } = options;
    const errors: AutofixError[] = [];
    let appliedEdits = 0;

    try {
      // Filter and validate suggestions
      const validSuggestions = this.validateAndFilterSuggestions(safeOnly);
      if (validSuggestions.length === 0) {
        return { success: true, appliedEdits: 0, errors: [] };
      }

      // Sort suggestions for safe application: bottom-to-top, then right-to-left
      const sortedSuggestions = this.sortSuggestionsForApplication(validSuggestions);
      
      // Filter overlapping edits
      const nonOverlappingSuggestions = this.filterOverlappingEdits(sortedSuggestions);
      
      // Limit number of edits if specified
      const finalSuggestions = maxEdits > 0 ? 
        nonOverlappingSuggestions.slice(0, maxEdits) : 
        nonOverlappingSuggestions;

      if (dryRun) {
        return {
          success: true,
          appliedEdits: finalSuggestions.length,
          errors,
          modifiedContent: this.previewEdits(finalSuggestions)
        };
      }

      // Apply edits in reverse order (bottom-to-top)
      for (const suggestion of finalSuggestions) {
        try {
          this.applyTextEdit(suggestion.edit);
          appliedEdits++;
        } catch (error) {
          errors.push({
            ruleId: suggestion.ruleId,
            message: error instanceof Error ? error.message : 'Unknown error applying edit',
            position: suggestion.edit.range.start
          });
        }
      }

      return {
        success: errors.length === 0,
        appliedEdits,
        errors,
        modifiedContent: this.sourceLines.join('\n')
      };

    } catch (error) {
      return {
        success: false,
        appliedEdits,
        errors: [{
          ruleId: 'autofix-engine',
          message: error instanceof Error ? error.message : 'Unknown autofix error'
        }]
      };
    }
  }

  private validateAndFilterSuggestions(safeOnly: boolean): AutofixSuggestion[] {
    return this.suggestions.filter(suggestion => {
      // Only apply safe transformations by default
      if (safeOnly && suggestion.severity !== 'info') {
        return false;
      }

      // Validate edit has valid position information
      if (!this.isValidRange(suggestion.edit.range)) {
        return false;
      }

      // Validate that the range is within the source bounds
      if (!this.isRangeInBounds(suggestion.edit.range)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort suggestions using LSP TextEdit principles:
   * 1. Bottom-to-top by end position
   * 2. Right-to-left for same-line edits
   */
  private sortSuggestionsForApplication(suggestions: AutofixSuggestion[]): AutofixSuggestion[] {
    return [...suggestions].sort((a, b) => {
      const aEnd = a.edit.range.end;
      const bEnd = b.edit.range.end;
      
      // Sort by line number (bottom-to-top)
      if (aEnd.line !== bEnd.line) {
        return bEnd.line - aEnd.line;
      }
      
      // Same line: sort by column (right-to-left)
      return bEnd.column - aEnd.column;
    });
  }

  /**
   * Filter out overlapping edits to prevent conflicts
   * Uses range overlap detection similar to ESLint
   */
  private filterOverlappingEdits(suggestions: AutofixSuggestion[]): AutofixSuggestion[] {
    const nonOverlapping: AutofixSuggestion[] = [];
    
    for (let i = 0; i < suggestions.length; i++) {
      const current = suggestions[i];
      let hasOverlap = false;
      
      // Check against already accepted edits
      for (const accepted of nonOverlapping) {
        if (this.rangesOverlap(current.edit.range, accepted.edit.range)) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        nonOverlapping.push(current);
      }
    }
    
    return nonOverlapping;
  }

  /**
   * Apply a single TextEdit to the source lines
   * Following LSP TextEdit semantics
   */
  private applyTextEdit(edit: TextEdit): void {
    const { range, newText } = edit;
    const { start, end } = range;
    
    // Convert to 0-based indexing (LSP uses 0-based)
    const startLine = start.line - 1;
    const endLine = end.line - 1;
    const startCol = start.column;
    const endCol = end.column;
    
    if (startLine === endLine) {
      // Single line edit
      const line = this.sourceLines[startLine];
      const before = line.slice(0, startCol);
      const after = line.slice(endCol);
      this.sourceLines[startLine] = before + newText + after;
    } else {
      // Multi-line edit
      const firstLine = this.sourceLines[startLine];
      const lastLine = this.sourceLines[endLine];
      
      const before = firstLine.slice(0, startCol);
      const after = lastLine.slice(endCol);
      
      const replacement = [before + newText + after];
      
      // Replace the range of lines
      this.sourceLines.splice(startLine, endLine - startLine + 1, ...replacement);
    }
  }

  private previewEdits(suggestions: AutofixSuggestion[]): string {
    // Create a copy of source lines for preview
    const previewLines = [...this.sourceLines];
    const engine = new AutofixEngine(previewLines.join('\n'), suggestions);
    const result = engine.applyFixes({ dryRun: false });
    return result.modifiedContent || previewLines.join('\n');
  }

  private isValidRange(range: Range): boolean {
    return range.start.line >= 1 && 
           range.end.line >= 1 && 
           range.start.column >= 0 && 
           range.end.column >= 0 &&
           (range.end.line > range.start.line || 
            (range.end.line === range.start.line && range.end.column >= range.start.column));
  }

  private isRangeInBounds(range: Range): boolean {
    const maxLine = this.sourceLines.length;
    return range.start.line <= maxLine && range.end.line <= maxLine;
  }

  private rangesOverlap(a: Range, b: Range): boolean {
    // Convert to positions for easier comparison
    const aStart = this.positionToOffset(a.start);
    const aEnd = this.positionToOffset(a.end);
    const bStart = this.positionToOffset(b.start);
    const bEnd = this.positionToOffset(b.end);
    
    return aStart < bEnd && bStart < aEnd;
  }

  private positionToOffset(pos: Position): number {
    let offset = 0;
    for (let i = 0; i < pos.line - 1; i++) {
      offset += this.sourceLines[i].length + 1; // +1 for newline
    }
    return offset + pos.column;
  }

  /**
   * Convert a Babel AST node location to TextEdit range
   */
  static createTextEditFromNode(node: any, newText: string): TextEdit {
    if (!node.loc) {
      throw new Error('Node missing location information');
    }

    return {
      range: {
        start: { line: node.loc.start.line, column: node.loc.start.column },
        end: { line: node.loc.end.line, column: node.loc.end.column }
      },
      newText
    };
  }

  /**
   * Create TextEdit from source positions
   */
  static createTextEdit(startLine: number, startCol: number, endLine: number, endCol: number, newText: string): TextEdit {
    return {
      range: {
        start: { line: startLine, column: startCol },
        end: { line: endLine, column: endCol }
      },
      newText
    };
  }
}