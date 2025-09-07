"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reporter = void 0;
class Reporter {
    formatText(data) {
        if (data.suggestions.length === 0) {
            return '✅ No modernization opportunities found. Your code is already modern!';
        }
        const output = [];
        output.push(`🚀 Found ${data.suggestions.length} modernization opportunities in your codebase:\n`);
        // Group suggestions by file
        const suggestionsByFile = new Map();
        for (const suggestion of data.suggestions) {
            if (!suggestionsByFile.has(suggestion.file)) {
                suggestionsByFile.set(suggestion.file, []);
            }
            suggestionsByFile.get(suggestion.file).push(suggestion);
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
    formatJson(data) {
        return JSON.stringify(data, null, 2);
    }
    getStatusEmoji(status) {
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
exports.Reporter = Reporter;
//# sourceMappingURL=reporter.js.map