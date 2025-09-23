import { ModernizationSuggestion } from './rules/types';

export interface ScoreResult {
  totalScore: number; 
  baselineApproved: boolean;
  suggestionsCount: number;
  suggestionsByCategory: {
    javascript: number;
    css: number;
    html: number;
    performance: number;
  };
  suggestionsBySeverity: {
    error: number;
    warn: number;
    info: number;
  };
  suggestionsByBaselineStatus: {
    high: number;
    low: number;
    limited: number;
    'not supported': number;
  };
}

export interface ScoringConfig {
  baselineApprovalThreshold: number;
  pointsPerSuggestion: {
    error: number;
    warn: number;
    info: number;
  };
  baselineStatusMultipliers: {
    high: number;
    low: number; 
    limited: number;
    'not supported': number;
  };
  categoryMultipliers: {
    javascript: number;
    css: number;
    html: number;
    performance: number;
  };
}

export class ScoringSystem {
  private config: ScoringConfig;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      baselineApprovalThreshold: -5,
      pointsPerSuggestion: {
        error: -3,
        warn: -2,
        info: -1,
      },
      baselineStatusMultipliers: {
        high: 1.0,
        low: 0.7,
        limited: 0.4,
        'not supported': 0.1,
      },
      categoryMultipliers: {
        javascript: 1.0,
        css: 0.9,
        html: 0.8,
        performance: 1.2,
      },
      ...config,
    };
  }

  calculateScore(suggestions: ModernizationSuggestion[]): ScoreResult {
    let totalScore = 0;

    const suggestionsByCategory = {
      javascript: 0,
      css: 0,
      html: 0,
      performance: 0,
    };

    const suggestionsBySeverity = {
      error: 0,
      warn: 0,
      info: 0,
    };

    const suggestionsByBaselineStatus = {
      high: 0,
      low: 0,
      limited: 0,
      'not supported': 0,
    };

    // Calculate negative points for each suggestion
    for (const suggestion of suggestions) {
      const basePoints = this.config.pointsPerSuggestion[suggestion.severity];
      const baselineMultiplier = this.config.baselineStatusMultipliers[suggestion.baselineStatus];
      const categoryMultiplier = this.config.categoryMultipliers[suggestion.category];

      // Calculate penalty: base points adjusted by multipliers
      const penalty = basePoints * baselineMultiplier * categoryMultiplier;
      totalScore += penalty; // This will make score negative

      // Count statistics
      suggestionsByCategory[suggestion.category]++;
      suggestionsBySeverity[suggestion.severity]++;
      suggestionsByBaselineStatus[suggestion.baselineStatus]++;
    }

    // Round to 2 decimal places for readability
    totalScore = Math.round(totalScore * 100) / 100;

    return {
      totalScore,
      baselineApproved: totalScore >= this.config.baselineApprovalThreshold,
      suggestionsCount: suggestions.length,
      suggestionsByCategory,
      suggestionsBySeverity,
      suggestionsByBaselineStatus,
    };
  }

  getScoreInterpretation(score: number): string {
    if (score >= 0) return 'Perfect - Baseline Approved! 🎉';
    if (score >= -5) return 'Excellent - Baseline Approved! ✨';
    if (score >= -15) return 'Good - Minor improvements needed 👍';
    if (score >= -30) return 'Fair - Moderate modernization required ⚠️';
    if (score >= -50) return 'Needs Work - Significant modernization required 🚧';
    return 'Critical - Major modernization required 🔴';
  }

  getLeaderboardRank(score: number): string {
    if (score >= 0) return 'Baseline Champion 🏆';
    if (score >= -5) return 'Modernization Master 🥇';
    if (score >= -15) return 'Web Standards Expert 🥈';
    if (score >= -30) return 'Progressive Developer 🥉';
    if (score >= -50) return 'Modern Web Explorer 🔍';
    return 'Legacy Code Adventurer ⚔️';
  }

  getScoreColor(score: number): string {
    if (score >= 0) return 'brightgreen';
    if (score >= -5) return 'green';
    if (score >= -15) return 'yellowgreen';
    if (score >= -30) return 'yellow';
    if (score >= -50) return 'orange';
    return 'red';
  }
}

export const defaultScoringSystem = new ScoringSystem();