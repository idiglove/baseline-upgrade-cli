import { ModernizationSuggestion } from './rules/types';

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
  suggestions: ModernizationSuggestion[];
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
    const suggestionsByFile = new Map<string, ModernizationSuggestion[]>();
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
          : suggestion.line.toString();

        output.push(`  Line ${lineInfo}: ${suggestion.oldCode} → ${suggestion.newCode}`);
        output.push(`  ${statusEmoji} ${suggestion.description}\n`);
      }
    }

    // Add summary statistics
    const highBaselineCount = data.suggestions.filter(s => s.baselineStatus === 'high').length;
    if (highBaselineCount > 0) {
      output.push(`💰 ${highBaselineCount} suggestions use Baseline stable features`);
    }

    return output.join('\n');
  }

  formatJson(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  private getStatusEmoji(status: 'high' | 'low' | 'limited' | 'not supported'): string {
    switch (status) {
      case 'high':
        return '✨';
      case 'low':
        return '🎯';
      case 'limited':
        return '⚠️';
      default:
        return '💡';
    }
  }
}
