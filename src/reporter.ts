import { ModernizationSuggestion } from './rules/types';
import { ScoreResult, defaultScoringSystem } from './scoring';
import { Badge, defaultBadgeSystem } from './badges';

export interface ReportData {
  suggestions: ModernizationSuggestion[];
  totalFiles: number;
  scannedFiles: string[];
  totalContentSize: number;
  errors: string[];
  scoreResult?: ScoreResult;
  earnedBadges?: Badge[];
}

export class Reporter {
  formatText(data: ReportData): string {
    const output: string[] = [];

    // Calculate score and badges if not provided
    const scoreResult = data.scoreResult || defaultScoringSystem.calculateScore(data.suggestions);
    const earnedBadges = data.earnedBadges || defaultBadgeSystem.getEarnedBadges(scoreResult);

    if (data.suggestions.length === 0) {
      output.push('✅ Perfect! No modernization opportunities found. Your code is fully Baseline compliant!');
      output.push(`🎯 Score: ${scoreResult.totalScore} - ${defaultScoringSystem.getScoreInterpretation(scoreResult.totalScore)}`);
      output.push(defaultBadgeSystem.generateBadgesSummary(earnedBadges));
      return output.join('\n');
    }

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
        const severityIcon = this.getSeverityIcon(suggestion.severity);
        const lineInfo = suggestion.column
          ? `${suggestion.line}:${suggestion.column}`
          : suggestion.line.toString();

        output.push(`  ${severityIcon} Line ${lineInfo}: ${suggestion.oldCode} → ${suggestion.newCode}`);
        output.push(`  ${statusEmoji} ${suggestion.description}\n`);
      }
    }

    // Add score and statistics
    output.push('\n📊 SCORE & STATISTICS:');
    output.push(`🎯 Score: ${scoreResult.totalScore} - ${defaultScoringSystem.getScoreInterpretation(scoreResult.totalScore)}`);
    output.push(`🏆 Rank: ${defaultScoringSystem.getLeaderboardRank(scoreResult.totalScore)}`);
    output.push(`📈 Baseline Approved: ${scoreResult.baselineApproved ? '✅ Yes' : '❌ No'}`);

    output.push('\n📋 Suggestion Breakdown:');
    output.push(`  • JavaScript: ${scoreResult.suggestionsByCategory.javascript}`);
    output.push(`  • CSS: ${scoreResult.suggestionsByCategory.css}`);
    output.push(`  • HTML: ${scoreResult.suggestionsByCategory.html}`);
    output.push(`  • Performance: ${scoreResult.suggestionsByCategory.performance}`);

    output.push('\n⚡ Severity Levels:');
    output.push(`  • Errors: ${scoreResult.suggestionsBySeverity.error}`);
    output.push(`  • Warnings: ${scoreResult.suggestionsBySeverity.warn}`);
    output.push(`  • Info: ${scoreResult.suggestionsBySeverity.info}`);

    output.push('\n🌐 Baseline Suggestions:');
    output.push(`  • Stable: ${scoreResult.suggestionsByBaselineStatus.high}`);
    output.push(`  • Newly Available: ${scoreResult.suggestionsByBaselineStatus.low}`);
    output.push(`  • Limited: ${scoreResult.suggestionsByBaselineStatus.limited}`);
    output.push(`  • Not Supported: ${scoreResult.suggestionsByBaselineStatus['not supported']}`);

    // Add badges
    if (earnedBadges.length > 0) {
      output.push('\n🏆 EARNED BADGES:');
      output.push(defaultBadgeSystem.generateBadgesSummary(earnedBadges));
      output.push('\n📝 Add to your README:');
      output.push(defaultBadgeSystem.generateBadgesMarkdown(earnedBadges));
    }

    return output.join('\n');
  }

  formatJson(data: ReportData): string {
    const scoreResult = data.scoreResult || defaultScoringSystem.calculateScore(data.suggestions);
    const earnedBadges = data.earnedBadges || defaultBadgeSystem.getEarnedBadges(scoreResult);

    return JSON.stringify({
      ...data,
      scoreResult,
      earnedBadges: earnedBadges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        svgUrl: badge.svgUrl,
        markdown: badge.markdown,
      })),
    }, null, 2);
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

  private getSeverityIcon(severity: 'error' | 'warn' | 'info'): string {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return '💡';
      default:
        return '📝';
    }
  }
}