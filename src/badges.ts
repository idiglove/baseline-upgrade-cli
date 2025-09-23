import { ScoreResult } from './scoring';
import { defaultScoringSystem } from './scoring';

export interface Badge {
  id: string;
  name: string;
  description: string;
  svgUrl: string;
  markdown: string;
  criteria: (score: ScoreResult) => boolean;
}

export class BadgeSystem {
  private badges: Badge[];

  constructor() {
    this.badges = this.initializeBadges();
  }

  private initializeBadges(): Badge[] {
    return [
      {
        id: 'baseline-approved',
        name: 'Baseline Approved',
        description: 'Codebase meets Baseline standards (score ≥ -5)',
        svgUrl: 'https://img.shields.io/badge/Baseline-Approved-brightgreen',
        markdown: '[![Baseline Approved](https://img.shields.io/badge/Baseline-Approved-brightgreen)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.baselineApproved
      },
      {
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Achieved a perfect score of 0 (no suggestions)',
        svgUrl: 'https://img.shields.io/badge/Score-0%20Perfect-blue',
        markdown: '[![Perfect Score](https://img.shields.io/badge/Score-0%20Perfect-blue)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.totalScore === 0
      },
      {
        id: 'javascript-modernizer',
        name: 'JavaScript Modernizer',
        description: 'Fixed 5+ JavaScript modernization opportunities',
        svgUrl: 'https://img.shields.io/badge/JavaScript-Modernizer-yellow',
        markdown: '[![JavaScript Modernizer](https://img.shields.io/badge/JavaScript-Modernizer-yellow)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByCategory.javascript >= 5
      },
      {
        id: 'css-champion',
        name: 'CSS Champion',
        description: 'Fixed 3+ CSS modernization opportunities',
        svgUrl: 'https://img.shields.io/badge/CSS-Champion-orange',
        markdown: '[![CSS Champion](https://img.shields.io/badge/CSS-Champion-orange)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByCategory.css >= 3
      },
      {
        id: 'performance-guru',
        name: 'Performance Guru',
        description: 'Fixed 2+ performance-related opportunities',
        svgUrl: 'https://img.shields.io/badge/Performance-Guru-green',
        markdown: '[![Performance Guru](https://img.shields.io/badge/Performance-Guru-green)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByCategory.performance >= 2
      },
      {
        id: 'error-free',
        name: 'Error Free',
        description: 'No high-severity errors found',
        svgUrl: 'https://img.shields.io/badge/Errors-0%20Found-success',
        markdown: '[![Error Free](https://img.shields.io/badge/Errors-0%20Found-success)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsBySeverity.error === 0
      },
      {
        id: 'html-modernizer',
        name: 'HTML Modernizer',
        description: 'Fixed HTML modernization opportunities',
        svgUrl: 'https://img.shields.io/badge/HTML-Modernizer-lightgrey',
        markdown: '[![HTML Modernizer](https://img.shields.io/badge/HTML-Modernizer-lightgrey)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByCategory.html > 0
      },
      {
        id: 'complete-overhaul',
        name: 'Complete Overhaul',
        description: 'Fixed 10+ total modernization opportunities',
        svgUrl: 'https://img.shields.io/badge/Overhaul-10%2B%20Fixes-purple',
        markdown: '[![Complete Overhaul](https://img.shields.io/badge/Overhaul-10%2B%20Fixes-purple)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsCount >= 10
      },
      {
        id: 'baseline-stable',
        name: 'Baseline Stable',
        description: 'Uses 5+ Baseline stable features',
        svgUrl: 'https://img.shields.io/badge/Baseline-5%2B%20Stable-00cc00',
        markdown: '[![Baseline Stable](https://img.shields.io/badge/Baseline-5%2B%20Stable-00cc00)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByBaselineStatus.high >= 5
      },
      {
        id: 'modern-web-explorer',
        name: 'Modern Web Explorer',
        description: 'Uses newly available web features',
        svgUrl: 'https://img.shields.io/badge/Modern%20Web-Explorer-ff69b4',
        markdown: '[![Modern Web Explorer](https://img.shields.io/badge/Modern%20Web-Explorer-ff69b4)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsByBaselineStatus.low > 0
      },
      {
        id: 'code-cleaner',
        name: 'Code Cleaner',
        description: 'Fixed 20+ suggestions with score better than -50',
        svgUrl: 'https://img.shields.io/badge/Code-Cleaner-9cf',
        markdown: '[![Code Cleaner](https://img.shields.io/badge/Code-Cleaner-9cf)](https://github.com/baseline-community/baseline-upgrade)',
        criteria: (score) => score.suggestionsCount >= 20 && score.totalScore > -50
      }
    ];
  }

  getEarnedBadges(scoreResult: ScoreResult): Badge[] {
    return this.badges.filter(badge => badge.criteria(scoreResult));
  }

  generateBadgesMarkdown(badges: Badge[]): string {
    return badges.map(badge => badge.markdown).join(' ');
  }

  generateBadgesSummary(badges: Badge[]): string {
    if (badges.length === 0) {
      return 'No badges earned yet. Keep modernizing!';
    }

    return `🏆 Earned ${badges.length} badge${badges.length !== 1 ? 's' : ''}:\n` +
      badges.map(badge => `  • ${badge.name}: ${badge.description}`).join('\n');
  }

  getAllBadges(): Badge[] {
    return this.badges;
  }
}

export const defaultBadgeSystem = new BadgeSystem();