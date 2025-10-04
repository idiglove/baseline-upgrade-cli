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

export interface ReadmeUpdateResult {
  success: boolean;
  message: string;
  readmePath?: string;
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
    // Match both badge patterns: the score badge and regular badges
    const badgeRegex = /\[!\[.*?\]\(.*?\)\]\(.*?\)/g;
    const badges: string[] = [];
    let contentWithoutBadges = content;

    const matches = content.match(badgeRegex);
    if (matches) {
      badges.push(...matches);
      matches.forEach(badge => {
        contentWithoutBadges = contentWithoutBadges.replace(badge, '').trim();
      });
    }

    // Remove any empty lines left after badge removal
    contentWithoutBadges = contentWithoutBadges.replace(/^\s*\n/gm, '\n').trim();

    return { badges, contentWithoutBadges };
  }

  private generateScoreBadge(scoreResult: ScoreResult): string {
    const score = scoreResult.totalScore;
    let color = 'red';
    
    if (score >= 0) color = 'brightgreen';
    else if (score >= -10) color = 'green';
    else if (score >= -20) color = 'yellowgreen';
    else if (score >= -30) color = 'yellow';
    else if (score >= -50) color = 'orange';
    
    const scoreText = `Score: ${score}`;
    const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(scoreText)}-${color}`;
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
    
    return badgeMarkdown + '\n';
  }

  private generateScoreSection(scoreResult: ScoreResult): string {
    const rank = defaultScoringSystem.getLeaderboardRank(scoreResult.totalScore);
    const interpretation = defaultScoringSystem.getScoreInterpretation(scoreResult.totalScore);
    
    return `\n## 📊 Baseline Score: ${scoreResult.totalScore}\n\n${scoreResult.baselineApproved ? '✅ **Baseline Approved**' : '⚠️ **Not Baseline Approved**'}\n\n### 🎯 Score Details:\n- **Total Suggestions**: ${scoreResult.suggestionsCount}\n- **JavaScript**: ${scoreResult.suggestionsByCategory.javascript}\n- **CSS**: ${scoreResult.suggestionsByCategory.css}\n- **HTML**: ${scoreResult.suggestionsByCategory.html}\n- **Performance**: ${scoreResult.suggestionsByCategory.performance}\n\n### 📈 Baseline Status:\n- **Stable Features**: ${scoreResult.suggestionsByBaselineStatus.high}\n- **Newly Available**: ${scoreResult.suggestionsByBaselineStatus.low}\n- **Limited Support**: ${scoreResult.suggestionsByBaselineStatus.limited}\n- **Not Supported**: ${scoreResult.suggestionsByBaselineStatus['not supported']}\n\n### 🏆 Rank: ${rank}\n${interpretation}\n`;
  }

  updateReadme(options: ReadmeUpdateOptions): ReadmeUpdateResult {
    try {
      const readmePath = options.readmePath || this.findReadmeFile();
      
      if (!readmePath) {
        // If no README exists and we have content to add, create one
        if (options.badges.length > 0 || options.scoreResult) {
          return this.createReadmeIfNotExists(options.badges, options.scoreResult);
        }
        return { 
          success: false, 
          message: 'No README file found in current directory.' 
        };
      }

      if (!fs.existsSync(readmePath)) {
        return { 
          success: false, 
          message: `README file not found: ${readmePath}` 
        };
      }

      // Create backup if requested
      if (options.backup) {
        const backupPath = `${readmePath}.backup`;
        fs.copyFileSync(readmePath, backupPath);
      }

      let content = fs.readFileSync(readmePath, 'utf8');
      const { badges: existingBadges, contentWithoutBadges } = this.extractExistingBadges(content);

      const newBadgesSection = this.generateBadgesSection(options.badges, options.scoreResult);
      const scoreSection = options.scoreResult ? this.generateScoreSection(options.scoreResult) : '';

      let updatedContent: string;

      if (options.overwrite || content.trim() === '') {
        // Complete overwrite or empty file
        const projectName = path.basename(process.cwd());
        updatedContent = `# ${projectName}\n\n${newBadgesSection}${scoreSection}\n\n${contentWithoutBadges}`;
      } else {
        // Insert badges after the first header
        const lines = contentWithoutBadges.split('\n');
        let headerIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('# ')) {
            headerIndex = i;
            break;
          }
        }

        if (headerIndex !== -1) {
          // Insert after the header
          lines.splice(headerIndex + 1, 0, '', newBadgesSection, scoreSection);
          updatedContent = lines.join('\n');
        } else {
          // No header found, add one
          const projectName = path.basename(process.cwd());
          updatedContent = `# ${projectName}\n\n${newBadgesSection}${scoreSection}\n\n${contentWithoutBadges}`;
        }
      }

      // Clean up multiple newlines
      updatedContent = updatedContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

      fs.writeFileSync(readmePath, updatedContent, 'utf8');

      return { 
        success: true, 
        message: `Successfully updated README with ${options.badges.length} badges`,
        readmePath 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to update README: ${error instanceof Error ? error.message : error}`
      };
    }
  }

  createReadmeIfNotExists(badges: Badge[], scoreResult?: ScoreResult): ReadmeUpdateResult {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      
      if (fs.existsSync(readmePath)) {
        // If README exists, update it instead
        return this.updateReadme({ badges, scoreResult, readmePath });
      }

      const badgesSection = this.generateBadgesSection(badges, scoreResult);
      const scoreSection = scoreResult ? this.generateScoreSection(scoreResult) : '';
      const projectName = path.basename(process.cwd());

      const content = `# ${projectName}\n\n${badgesSection}${scoreSection}
## Project Description

This project has been analyzed with [Baseline Upgrade CLI](https://github.com/baseline-community/baseline-upgrade) and earned ${badges.length} badge${badges.length !== 1 ? 's' : ''}!

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