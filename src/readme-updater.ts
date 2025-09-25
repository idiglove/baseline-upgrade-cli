import * as fs from 'fs';
import * as path from 'path';
import { Badge } from './badges';
import { ScoreResult, defaultScoringSystem } from './scoring';

export interface ReadmeUpdateOptions {
  readmePath?: string;
  badges: Badge[];
  scoreResult?: ScoreResult;
  overwrite?: boolean;
  backup?: boolean;
}

export class ReadmeUpdater {
  private findReadmeFile(directory: string = '.'): string | null {
    const possibleNames = [
      'README.md',
      'Readme.md',
      'readme.md',
      'README.MD',
      'Readme.MD',
      'readme.MD'
    ];

    for (const name of possibleNames) {
      const filePath = path.join(directory, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  private extractExistingBadges(content: string): { badges: string[], contentWithoutBadges: string } {
    const badgeRegex = /\[!\[.*?\]\(https:\/\/img\.shields\.io\/badge\/.*?\)\]\(.*?\)/g;
    const badges: string[] = [];
    let contentWithoutBadges = content;

    const matches = content.match(badgeRegex);
    if (matches) {
      badges.push(...matches);
      matches.forEach(badge => {
        contentWithoutBadges = contentWithoutBadges.replace(badge, '').trim();
      });
    }

    contentWithoutBadges = contentWithoutBadges.replace(/^\s*\n/, '');

    return { badges, contentWithoutBadges };
  }

  private generateScoreBadge(scoreResult: ScoreResult): string {
    const scoreColor = defaultScoringSystem.getScoreColor(scoreResult.totalScore);
    const scoreText = `Score: ${scoreResult.totalScore}`;
    const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(scoreText)}-${scoreColor}`;
    return `[![${scoreText}](${badgeUrl})](https://github.com/baseline-community/baseline-upgrade)`;
  }

  private generateBadgesSection(badges: Badge[], scoreResult?: ScoreResult): string {
    if (badges.length === 0 && !scoreResult) {
      return '';
    }

    let badgeMarkdown = '';

    if (scoreResult) {
      badgeMarkdown += this.generateScoreBadge(scoreResult) + ' ';
    }
    
    badgeMarkdown += badges.map(badge => badge.markdown).join(' ');
    
    return `\n\n${badgeMarkdown}\n`;
  }

  private generateScoreSection(scoreResult: ScoreResult): string {
    return `\n\n## 📊 Baseline Score: ${scoreResult.totalScore}

${scoreResult.baselineApproved ? '✅ **Baseline Approved**' : '⚠️ **Not Baseline Approved**'}

### 🎯 Score Details:
- **Total Suggestions**: ${scoreResult.suggestionsCount}
- **JavaScript**: ${scoreResult.suggestionsByCategory.javascript}
- **CSS**: ${scoreResult.suggestionsByCategory.css}
- **HTML**: ${scoreResult.suggestionsByCategory.html}
- **Performance**: ${scoreResult.suggestionsByCategory.performance}

### 📈 Baseline Suggestions:
- **Stable Features**: ${scoreResult.suggestionsByBaselineStatus.high}
- **Newly Available**: ${scoreResult.suggestionsByBaselineStatus.low}
- **Limited Support**: ${scoreResult.suggestionsByBaselineStatus.limited}
- **Not Supported**: ${scoreResult.suggestionsByBaselineStatus['not supported']}

### 🏆 Rank: ${defaultScoringSystem.getLeaderboardRank(scoreResult.totalScore)}
${defaultScoringSystem.getScoreInterpretation(scoreResult.totalScore)}
`;
  }

  updateReadme(options: ReadmeUpdateOptions): { success: boolean; message: string; readmePath?: string } {
    try {
      const readmePath = options.readmePath || this.findReadmeFile();
      
      if (!readmePath) {
        return { 
          success: false, 
          message: 'No README file found in current directory. Use --create to create one.' 
        };
      }

      if (!fs.existsSync(readmePath)) {
        return { 
          success: false, 
          message: `README file not found: ${readmePath}` 
        };
      }

      if (options.backup) {
        const backupPath = `${readmePath}.backup`;
        fs.copyFileSync(readmePath, backupPath);
      }

      let content = fs.readFileSync(readmePath, 'utf8');
      const { badges: existingBadges, contentWithoutBadges } = this.extractExistingBadges(content);

      const newBadgesSection = this.generateBadgesSection(options.badges, options.scoreResult);
      
      let scoreSection = '';
      if (options.scoreResult) {
        scoreSection = this.generateScoreSection(options.scoreResult);
      }

      let updatedContent: string;

      if (options.overwrite) {
        const projectName = path.basename(process.cwd());
        updatedContent = `# ${projectName}${newBadgesSection}${scoreSection}\n\n${contentWithoutBadges}`;
      } else {
        const lines = contentWithoutBadges.split('\n');
        
        if (lines[0].startsWith('# ')) {
          lines.splice(1, 0, newBadgesSection);
          if (scoreSection) {
            lines.splice(2, 0, scoreSection);
          }
          updatedContent = lines.join('\n');
        } else {
          const projectName = path.basename(process.cwd());
          updatedContent = `# ${projectName}${newBadgesSection}${scoreSection}\n\n${contentWithoutBadges}`;
        }
      }

      updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(readmePath, updatedContent, 'utf8');

      return { 
        success: true, 
        message: `Successfully updated ${readmePath} with ${options.badges.length} badges`,
        readmePath 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to update README: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  createReadmeIfNotExists(badges: Badge[], scoreResult?: ScoreResult): { success: boolean; message: string; readmePath: string } {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      
      if (fs.existsSync(readmePath)) {
        return { 
          success: false, 
          message: 'README.md already exists. Use update instead.',
          readmePath 
        };
      }

      const badgesSection = this.generateBadgesSection(badges, scoreResult);
      const scoreSection = scoreResult ? this.generateScoreSection(scoreResult) : '';
      const projectName = path.basename(process.cwd());

      const content = `# ${projectName}
${badgesSection}
${scoreSection}
## Project Description

This project has been analyzed with Baseline Upgrade CLI and earned ${badges.length} badge${badges.length !== 1 ? 's' : ''}!

## 🚀 Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## 📊 Baseline Analysis

Run the analysis:
\`\`\`bash
npx baseline-upgrade scan .
\`\`\`

---
*Badges generated by [Baseline Upgrade CLI](https://github.com/baseline-community/baseline-upgrade)*
`;

      fs.writeFileSync(readmePath, content, 'utf8');

      return { 
        success: true, 
        message: `Created new README.md with ${badges.length} badges`,
        readmePath 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create README: ${error instanceof Error ? error.message : error}`,
        readmePath: path.join(process.cwd(), 'README.md')
      };
    }
  }
}

export const defaultReadmeUpdater = new ReadmeUpdater();