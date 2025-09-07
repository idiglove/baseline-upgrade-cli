export interface Suggestion {
  file: string;
  line: number;
  column?: number;
  oldCode: string;
  newCode: string;
  message: string;
  category: 'javascript' | 'css' | 'html' | 'performance';
  baselineStatus: 'stable' | 'newly-available' | 'limited';
  confidence: 'high' | 'medium' | 'low';
}

export interface ReportData {
  suggestions: Suggestion[];
  totalFiles: number;
  scannedFiles: string[];
  totalContentSize: number;
  errors: string[];
}

export class Reporter {
  formatText(data: ReportData): string {
    if (data.suggestions.length === 0) {
      return '✅ No modernization opportunities found. Your code is already modern!';
    }

    const output: string[] = [];
    output.push(
      `🚀 Found ${data.suggestions.length} modernization opportunities in your codebase:\n`
    );

    // Group suggestions by file
    const suggestionsByFile = new Map<string, Suggestion[]>();
    for (const suggestion of data.suggestions) {
      if (!suggestionsByFile.has(suggestion.file)) {
        suggestionsByFile.set(suggestion.file, []);
      }
      suggestionsByFile.get(suggestion.file)!.push(suggestion);
    }

    // Output each file with its suggestions
    for (const [file, suggestions] of suggestionsByFile) {
      output.push(`📁 ${file}`);

      for (const suggestion of suggestions) {
        const statusEmoji = this.getStatusEmoji(suggestion.baselineStatus);
        const lineInfo = suggestion.column
          ? `${suggestion.line}:${suggestion.column}`
          : suggestion.line;

        output.push(`  Line ${lineInfo}: ${suggestion.oldCode} → ${suggestion.newCode}`);
        output.push(`  ${statusEmoji} ${suggestion.message}\n`);
      }
    }

    // Add summary statistics
    const stableCount = data.suggestions.filter(s => s.baselineStatus === 'stable').length;
    if (stableCount > 0) {
      output.push(`💰 ${stableCount} suggestions use Baseline stable features`);
    }

    return output.join('\n');
  }

  formatJson(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'stable':
        return '✨';
      case 'newly-available':
        return '🎯';
      case 'limited':
        return '⚠️';
      default:
        return '💡';
    }
  }
}
