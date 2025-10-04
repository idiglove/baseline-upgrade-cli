#!/usr/bin/env node

import { Command } from 'commander';
import { Reporter, ReportData } from './reporter';
import { RuleEngine, builtinRules, defaultConfig } from './rules/index';
import { FileScanner } from './scanner';
import { version } from '../package.json';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { defaultScoringSystem, ScoreResult } from './scoring';
import { defaultBadgeSystem, Badge } from './badges';
import { defaultReadmeUpdater, ReadmeUpdateOptions } from './readme-updater';
import { handleLeaderboardSubmission } from './leaderboard';
import * as path from 'path';

const program = new Command();

program
  .name('baseline-upgrade')
  .description(
    'CLI tool that suggests modern web feature upgrades using deterministic rule-based analysis'
  )
  .version(version);

async function updateReadmeWithBadges(suggestions: any[], scoreResult?: ScoreResult, options: any = {}) {
  try {
    const finalScoreResult = scoreResult || defaultScoringSystem.calculateScore(suggestions);
    const earnedBadges = defaultBadgeSystem.getEarnedBadges(finalScoreResult);

    // Always update README if we have badges or a score result
    if (earnedBadges.length === 0 && finalScoreResult.totalScore === 0) {
      const updateOptions: ReadmeUpdateOptions = {
        badges: [],
        scoreResult: finalScoreResult,
        overwrite: options.overwrite,
        backup: options.backup,
      };

      const result = defaultReadmeUpdater.updateReadme(updateOptions);
      if (result.success) {
        console.log('\n📝 Perfect score! Updated README with score badge.');
      } else if (options.verbose) {
        console.log('ℹ️  ' + result.message);
      }
      return;
    }

    const updateOptions: ReadmeUpdateOptions = {
      badges: earnedBadges,
      scoreResult: finalScoreResult,
      overwrite: options.overwrite,
      backup: options.backup,
    };

    const result = defaultReadmeUpdater.updateReadme(updateOptions);
    
    if (result.success) {
      console.log('\n📝 ' + result.message);
      if (earnedBadges.length > 0) {
        console.log('🏆 Earned Badges:');
        earnedBadges.forEach(badge => {
          console.log(`  • ${badge.name}`);
        });
      }
      console.log(`🎯 Score: ${finalScoreResult.totalScore}`);
    } else if (options.verbose) {
      console.log('ℹ️  ' + result.message);
    }
  } catch (error) {
    if (options.verbose) {
      console.log('⚠️  Failed to update README:', error instanceof Error ? error.message : error);
    }
  }
}

// Per-file analysis command
program
  .command('file')
  .description('Analyze a single file for modernization opportunities')
  .argument('<filepath>', 'path to the file to analyze')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
  .option('--fix', 'automatically apply safe fixes')
  .option('--dry-run', 'preview fixes without applying them')
  .option('--no-score', 'disable scoring system')
  .option('--no-badges', 'disable badge system')
  .option('--update-readme', 'automatically update README with earned badges')
  .option('--readme-overwrite', 'overwrite existing README content when updating')
  .option('--readme-backup', 'create backup of original README when updating')
  .option('--no-leaderboard-prompt', 'skip the leaderboard submission prompt')
  .action(async (filepath: string, options) => {
    try {
      if (!fs.existsSync(filepath)) {
        console.error(`❌ File not found: ${filepath}`);
        process.exit(1);
      }

      if (options.verbose) {
        console.log(`🚀 Analyzing ${filepath} for modernization opportunities...`);
      }

      const content = await fs.promises.readFile(filepath, 'utf8');
      
      // Initialize rule engine with built-in rules
      const engine = new RuleEngine(defaultConfig.rules);
      for (const [ruleId, rule] of Object.entries(builtinRules)) {
        engine.registerRule(ruleId, rule);
      }

      if (options.fix || options.dryRun) {
        const autofixResult = engine.applyAutofix(filepath, content, {
          dryRun: options.dryRun,
          safeOnly: true,
          maxEdits: 50
        });

        if (options.verbose) {
          console.log(`🔧 Autofix result: ${autofixResult.appliedEdits} edits applied, ${autofixResult.errors.length} errors`);
        }

        if (!autofixResult.success) {
          console.error(`❌ Autofix failed:`);
          autofixResult.errors.forEach(error => {
            console.error(`  - ${error.ruleId}: ${error.message}`);
          });
          process.exit(1);
        }

        if (options.dryRun) {
          console.log(`🔍 Preview of ${autofixResult.appliedEdits} fixes that would be applied:\n`);
          console.log(autofixResult.modifiedContent);
        } else {
          await fs.promises.writeFile(filepath, autofixResult.modifiedContent!);
          console.log(`✅ Applied ${autofixResult.appliedEdits} autofix suggestions to ${filepath}`);
        }

        const { suggestions } = engine.analyzeFileWithAutofix(filepath, content);
        
        const scoreResult = options.score !== false ? defaultScoringSystem.calculateScore(suggestions) : undefined;
        const earnedBadges = options.badges !== false && scoreResult ? defaultBadgeSystem.getEarnedBadges(scoreResult) : undefined;

        const reportData: ReportData = {
          suggestions,
          totalFiles: 1,
          scannedFiles: [filepath],
          totalContentSize: content.length,
          errors: [],
          scoreResult,
          earnedBadges,
        };

        if (!options.dryRun && suggestions.length > 0) {
          const reporter = new Reporter();
          const output = options.format === 'json'
            ? reporter.formatJson(reportData)
            : reporter.formatText(reportData);
          console.log(`\n📋 Remaining suggestions:\n${output}`);
        }

        if (options.updateReadme) {
          await updateReadmeWithBadges(suggestions, scoreResult, {
            verbose: options.verbose,
            overwrite: options.readmeOverwrite,
            backup: options.readmeBackup
          });
        }

        // Handle leaderboard submission for file command
        if (options.leaderboardPrompt !== false) {
          await handleLeaderboardSubmission(reportData, path.dirname(filepath), earnedBadges || []);
        }
      } else {
        const suggestions = engine.analyzeFile(filepath, content);

        const scoreResult = options.score !== false ? defaultScoringSystem.calculateScore(suggestions) : undefined;
        const earnedBadges = options.badges !== false && scoreResult ? defaultBadgeSystem.getEarnedBadges(scoreResult) : undefined;

        const reportData: ReportData = {
          suggestions,
          totalFiles: 1,
          scannedFiles: [filepath],
          totalContentSize: content.length,
          errors: [],
          scoreResult,
          earnedBadges,
        };

        const reporter = new Reporter();
        const output = options.format === 'json'
          ? reporter.formatJson(reportData)
          : reporter.formatText(reportData);

        console.log(output);

        // Update README if requested
        if (options.updateReadme) {
          await updateReadmeWithBadges(suggestions, scoreResult, {
            verbose: options.verbose,
            overwrite: options.readmeOverwrite,
            backup: options.readmeBackup
          });
        }

        // Handle leaderboard submission for file command
        if (options.leaderboardPrompt !== false) {
          await handleLeaderboardSubmission(reportData, path.dirname(filepath), earnedBadges || []);
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Per-commit analysis command
program
  .command('commit')
  .description('Analyze changes in a git commit for modernization opportunities')
  .argument('[commit]', 'git commit hash (defaults to latest commit)', 'HEAD')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
  .option('--no-score', 'disable scoring system')
  .option('--no-badges', 'disable badge system')
  .option('--update-readme', 'automatically update README with earned badges')
  .option('--readme-overwrite', 'overwrite existing README content when updating')
  .option('--readme-backup', 'create backup of original README when updating')
  .option('--no-leaderboard-prompt', 'skip the leaderboard submission prompt')
  .action(async (commit: string, options) => {
    try {
      if (options.verbose) {
        console.log(`🚀 Analyzing git commit ${commit} for modernization opportunities...`);
      }

      let diffOutput: string;
      try {
        diffOutput = execSync(`git show ${commit} --pretty=format: --name-only`, { encoding: 'utf8' });
      } catch (error) {
        console.error(`❌ Failed to get git diff for commit ${commit}`);
        process.exit(1);
      }

      const changedFiles = diffOutput.trim().split('\n').filter(f => 
        f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.css')
      );
      
      if (changedFiles.length === 0) {
        console.log('No supported files changed in this commit.');
        return;
      }

      if (options.verbose) {
        console.log(`Found ${changedFiles.length} changed files`);
      }

      const engine = new RuleEngine(defaultConfig.rules);
      for (const [ruleId, rule] of Object.entries(builtinRules)) {
        engine.registerRule(ruleId, rule);
      }

      const allSuggestions = [];
      const errors = [];

      for (const file of changedFiles) {
        if (!fs.existsSync(file)) continue;
        
        try {
          const content = await fs.promises.readFile(file, 'utf8');
          const suggestions = engine.analyzeFile(file, content);
          allSuggestions.push(...suggestions);
          
          if (options.verbose) {
            console.log(`✓ Analyzed ${file}`);
          }
        } catch (error) {
          errors.push(`Failed to analyze ${file}: ${error}`);
        }
      }

      const scoreResult = options.score !== false ? defaultScoringSystem.calculateScore(allSuggestions) : undefined;
      const earnedBadges = options.badges !== false && scoreResult ? defaultBadgeSystem.getEarnedBadges(scoreResult) : undefined;

      const reportData: ReportData = {
        suggestions: allSuggestions,
        totalFiles: changedFiles.length,
        scannedFiles: changedFiles,
        totalContentSize: 0,
        errors,
        scoreResult,
        earnedBadges,
      };

      const reporter = new Reporter();
      const output = options.format === 'json'
        ? reporter.formatJson(reportData)
        : reporter.formatText(reportData);

      console.log(output);

      // Update README if requested
      if (options.updateReadme) {
        await updateReadmeWithBadges(allSuggestions, scoreResult, {
          verbose: options.verbose,
          overwrite: options.readmeOverwrite,
          backup: options.readmeBackup
        });
      }

      // Handle leaderboard submission for commit command
      if (options.leaderboardPrompt !== false) {
        await handleLeaderboardSubmission(reportData, '.', earnedBadges || []);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Directory scanning command
program
  .command('scan')
  .description('Analyze all files in a directory for modernization opportunities')
  .argument('[path]', 'path to the directory to analyze', '.')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
  .option('--fix', 'automatically apply safe fixes')
  .option('--dry-run', 'preview fixes without applying them')
  .option('--ignore <patterns>', 'comma-separated ignore patterns', 
    'node_modules,dist,build,.git,coverage,.next,out,*.min.js,*.min.css,package-lock.json,yarn.lock')
  .option('--extensions <exts>', 'comma-separated file extensions', '.js,.ts,.jsx,.tsx,.css')
  .option('--max-size <size>', 'maximum file size in KB', '1024')
  .option('--no-score', 'disable scoring system')
  .option('--no-badges', 'disable badge system')
  .option('--leaderboard', 'output leaderboard-ready format')
  .option('--update-readme', 'automatically update README with earned badges')
  .option('--readme-overwrite', 'overwrite existing README content when updating')
  .option('--readme-backup', 'create backup of original README when updating')
  .option('--no-leaderboard-prompt', 'skip the leaderboard submission prompt')
  .action(async (scanPath: string, options) => {
    try {
      if (options.verbose) {
        console.log(`🚀 Scanning ${scanPath} for modernization opportunities...`);
      }

      const ignorePatterns = options.ignore.split(',').map((p: string) => p.trim());
      const extensions = options.extensions.split(',').map((e: string) => e.trim().startsWith('.') ? e.trim() : `.${e.trim()}`);
      const maxFileSize = parseInt(options.maxSize) * 1024; // Convert KB to bytes

      const scanner = new FileScanner({
        ignorePatterns,
        extensions,
        readContents: true,
        maxFileSize,
      });

      const scanResult = await scanner.scan(scanPath);

      // Only show ignore warnings in verbose mode
      if (options.verbose && scanResult.errors.length > 0) {
        const ignoreErrors = scanResult.errors.filter(error => error.includes('Ignored'));
        if (ignoreErrors.length > 0) {
          console.log('🚫 Ignored paths:');
          ignoreErrors.slice(0, 10).forEach(error => console.log(`   ${error}`));
          if (ignoreErrors.length > 10) {
            console.log(`   ... and ${ignoreErrors.length - 10} more`);
          }
        }
      }

      if (scanResult.fileContents.length === 0) {
        console.log('No supported files found in the specified directory.');
        return;
      }

      if (options.verbose) {
        console.log(`📂 Found ${scanResult.fileContents.length} files to analyze`);
      }


      // Initialize rule engine
      const engine = new RuleEngine(defaultConfig.rules);
      for (const [ruleId, rule] of Object.entries(builtinRules)) {
        engine.registerRule(ruleId, rule);
      }

      const allSuggestions = [];
      const processErrors = [];
      let totalContentSize = 0;
      let totalFixesApplied = 0;

      if (options.fix || options.dryRun) {
        if (options.verbose) {
          console.log(`🔧 ${options.dryRun ? 'Previewing' : 'Applying'} autofix to ${scanResult.fileContents.length} files...`);
        }

        for (const fileInfo of scanResult.fileContents) {
          try {
            const autofixResult = engine.applyAutofix(fileInfo.path, fileInfo.content, {
              dryRun: options.dryRun,
              safeOnly: true,
              maxEdits: 50
            });

            if (!autofixResult.success) {
              processErrors.push(`Autofix failed for ${fileInfo.path}: ${autofixResult.errors.map(e => e.message).join(', ')}`);
              continue;
            }

            totalFixesApplied += autofixResult.appliedEdits;

            if (options.verbose) {
              console.log(`✓ ${fileInfo.path}: ${autofixResult.appliedEdits} fixes ${options.dryRun ? 'would be applied' : 'applied'}`);
            }

            if (!options.dryRun && autofixResult.appliedEdits > 0) {
              await fs.promises.writeFile(fileInfo.path, autofixResult.modifiedContent!);
            }

            const { suggestions } = engine.analyzeFileWithAutofix(fileInfo.path, fileInfo.content);
            allSuggestions.push(...suggestions);
            totalContentSize += fileInfo.size;

          } catch (error) {
            processErrors.push(`Failed to process ${fileInfo.path}: ${error}`);
            if (options.verbose) {
              console.log(`❌ Failed to process ${fileInfo.path}`);
            }
          }
        }

        console.log(`\n${options.dryRun ? '🔍 Preview complete' : '✅ Autofix complete'}: ${totalFixesApplied} fixes ${options.dryRun ? 'would be applied' : 'applied'} across ${scanResult.fileContents.length} files`);
      } else {
        for (const fileInfo of scanResult.fileContents) {
          try {
            const suggestions = engine.analyzeFile(fileInfo.path, fileInfo.content);
            allSuggestions.push(...suggestions);
            totalContentSize += fileInfo.size;
            
            if (options.verbose) {
              console.log(`✓ Analyzed ${fileInfo.path} (${suggestions.length} suggestions)`);
            }
          } catch (error) {
            processErrors.push(`Failed to analyze ${fileInfo.path}: ${error}`);
            if (options.verbose) {
              console.log(`❌ Failed to analyze ${fileInfo.path}`);
            }
          }
        }
      }

      const scoreResult = options.score !== false ? defaultScoringSystem.calculateScore(allSuggestions) : undefined;
      const earnedBadges = options.badges !== false && scoreResult ? defaultBadgeSystem.getEarnedBadges(scoreResult) : undefined;

      const reportData: ReportData = {
        suggestions: allSuggestions,
        totalFiles: scanResult.fileContents.length,
        scannedFiles: scanResult.fileContents.map(f => f.path),
        totalContentSize,
        errors: [...scanResult.errors, ...processErrors],
        scoreResult,
        earnedBadges,
      };

      const reporter = new Reporter();
      
      if (options.leaderboard) {
        if (scoreResult) {
          console.log(`SCORE:${scoreResult.totalScore}`);
          console.log(`BASELINE_APPROVED:${scoreResult.baselineApproved}`);
          console.log(`TOTAL_SUGGESTIONS:${allSuggestions.length}`);
          console.log(`FILES_SCANNED:${scanResult.fileContents.length}`);
        }
      } else {
        const output = options.format === 'json'
          ? reporter.formatJson(reportData)
          : reporter.formatText(reportData);

        console.log(output);
      }

// In the scan command action, after analysis is complete:
if (options.updateReadme) {
  await updateReadmeWithBadges(allSuggestions, scoreResult, {
    verbose: options.verbose,
    overwrite: options.readmeOverwrite,
    backup: options.readmeBackup
  });
}

      // Handle leaderboard submission (unless explicitly disabled)
      if (options.leaderboardPrompt !== false && !options.leaderboard) {
        await handleLeaderboardSubmission(reportData, scanPath, earnedBadges || []);
      }

      if (allSuggestions.length > 0 || scoreResult?.totalScore === 0) {
  try {
    await updateReadmeWithBadges(allSuggestions, scoreResult, {
      verbose: options.verbose,
      overwrite: options.readmeOverwrite,
      backup: options.readmeBackup
    });
  } catch (error) {
    if (options.verbose) {
      console.log('⚠️  Could not update README:', error instanceof Error ? error.message : error);
    }
  }
}

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Score command - just calculate score without full analysis
program
  .command('score')
  .description('Calculate score from existing analysis results')
  .argument('[file]', 'JSON file with analysis results')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
  .option('--update-readme', 'automatically update README with earned badges')
  .option('--readme-overwrite', 'overwrite existing README content when updating')
  .option('--readme-backup', 'create backup of original README when updating')
  .action(async (file: string, options) => {
    try {
      let suggestions: any[] = [];
      
      if (file) {
        if (!fs.existsSync(file)) {
          console.error(`❌ File not found: ${file}`);
          process.exit(1);
        }
        
        const data = JSON.parse(await fs.promises.readFile(file, 'utf8'));
        suggestions = data.suggestions || [];
      } else {
        // If no file provided and no stdin, show help
        if (process.stdin.isTTY) {
          console.log('❌ Please provide a JSON file with analysis results or pipe JSON data to stdin');
          console.log('Usage examples:');
          console.log('  baseline-upgrade score analysis.json');
          console.log('  cat analysis.json | baseline-upgrade score');
          process.exit(1);
        }
        
        let input = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => {
          input += chunk;
        });
        
        await new Promise((resolve) => {
          process.stdin.on('end', resolve);
        });
        
        if (input) {
          const data = JSON.parse(input);
          suggestions = data.suggestions || [];
        } else {
          console.error('❌ No input data received from stdin');
          process.exit(1);
        }
      }

      const scoreResult = defaultScoringSystem.calculateScore(suggestions);
      const earnedBadges = defaultBadgeSystem.getEarnedBadges(scoreResult);

      const reportData: ReportData = {
        suggestions,
        totalFiles: 0,
        scannedFiles: [],
        totalContentSize: 0,
        errors: [],
        scoreResult,
        earnedBadges,
      };

      const reporter = new Reporter();
      const output = options.format === 'json'
        ? reporter.formatJson(reportData)
        : reporter.formatText(reportData);

      console.log(output);

      // Update README if requested
      if (options.updateReadme) {
        await updateReadmeWithBadges(suggestions, scoreResult, {
          verbose: false,
          overwrite: options.readmeOverwrite,
          backup: options.readmeBackup
        });
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Badges command - show available badges
program
  .command('badges')
  .description('Show available badges and their criteria')
  .option('-f, --format <type>', 'output format (text, json, markdown)', 'text')
  .action((options) => {
    const badges = defaultBadgeSystem.getAllBadges();
    
    if (options.format === 'json') {
      console.log(JSON.stringify(badges, null, 2));
    } else if (options.format === 'markdown') {
      console.log('# Available Badges\n');
      badges.forEach(badge => {
        console.log(`## ${badge.name}`);
        console.log(`![](${badge.svgUrl})`);
        console.log(`${badge.description}`);
        console.log('');
      });
    } else {
      console.log('🏆 Available Badges:\n');
      badges.forEach(badge => {
        console.log(`• ${badge.name}: ${badge.description}`);
        console.log(`  Badge: ${badge.markdown}`);
        console.log('');
      });
    }
  });

// README update command
program
  .command('update-readme')
  .description('Update README with earned badges from analysis')
  .option('--readme-path <path>', 'path to README file', '')
  .option('--create', 'create README if it does not exist')
  .option('--overwrite', 'overwrite existing README content')
  .option('--backup', 'create backup of original README')
  .option('--from-file <file>', 'JSON file with analysis results', '')
  .action(async (options) => {
    try {
      let suggestions: any[] = [];
      let scoreResult: ScoreResult | undefined;

      if (options.fromFile) {
        if (!fs.existsSync(options.fromFile)) {
          console.error(`❌ File not found: ${options.fromFile}`);
          process.exit(1);
        }
        
        const data = JSON.parse(await fs.promises.readFile(options.fromFile, 'utf8'));
        suggestions = data.suggestions || [];
        scoreResult = data.scoreResult;
      } else {
        console.error('❌ Please provide analysis results with --from-file');
        process.exit(1);
      }

      if (!scoreResult) {
        scoreResult = defaultScoringSystem.calculateScore(suggestions);
      }

      const earnedBadges = defaultBadgeSystem.getEarnedBadges(scoreResult);

      if (earnedBadges.length === 0 && scoreResult.totalScore === 0) {
        console.log('Perfect score (0) achieved! No suggestions found.');
      } else if (earnedBadges.length === 0) {
        console.log('No badges earned. Run analysis first to earn badges.');
        return;
      }

      const updateOptions: ReadmeUpdateOptions = {
        readmePath: options.readmePath || undefined,
        badges: earnedBadges,
        scoreResult: scoreResult,
        overwrite: options.overwrite,
        backup: options.backup,
      };

      if (options.create) {
        const result = defaultReadmeUpdater.createReadmeIfNotExists(earnedBadges, scoreResult);
        console.log(result.message);
        if (!result.success) {
          process.exit(1);
        }
      } else {
        const result = defaultReadmeUpdater.updateReadme(updateOptions);
        console.log(result.message);
        if (!result.success) {
          process.exit(1);
        }
      }

      console.log('\n🏆 Earned Badges:');
      earnedBadges.forEach(badge => {
        console.log(`  • ${badge.name}: ${badge.description}`);
      });

      if (scoreResult) {
        console.log(`\n🎯 Score: ${scoreResult.totalScore} - ${defaultScoringSystem.getScoreInterpretation(scoreResult.totalScore)}`);
      }

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Show badges command
program
  .command('show-badges')
  .description('Show badges that would be earned for a given score')
  .option('-s, --score <score>', 'target score to simulate', '0')
  .option('-j, --javascript <count>', 'JavaScript suggestions count', '0')
  .option('-c, --css <count>', 'CSS suggestions count', '0')
  .option('-h, --html <count>', 'HTML suggestions count', '0')
  .option('-p, --performance <count>', 'Performance suggestions count', '0')
  .option('-e, --errors <count>', 'Error severity count', '0')
  .option('-w, --warnings <count>', 'Warning severity count', '0')
  .option('-i, --info <count>', 'Info severity count', '0')
  .action((options) => {
    try {
      const mockScoreResult: ScoreResult = {
        totalScore: parseFloat(options.score),
        baselineApproved: parseFloat(options.score) >= -5,
        suggestionsCount: 
          parseInt(options.javascript) + 
          parseInt(options.css) + 
          parseInt(options.html) + 
          parseInt(options.performance),
        suggestionsByCategory: {
          javascript: parseInt(options.javascript),
          css: parseInt(options.css),
          html: parseInt(options.html),
          performance: parseInt(options.performance),
        },
        suggestionsBySeverity: {
          error: parseInt(options.errors),
          warn: parseInt(options.warnings),
          info: parseInt(options.info),
        },
        suggestionsByBaselineStatus: {
          high: 0,
          low: 0,
          limited: 0,
          'not supported': 0,
        },
      };

      const earnedBadges = defaultBadgeSystem.getEarnedBadges(mockScoreResult);

      console.log('🎯 Simulated Badges for Score:', options.score);
      console.log('📊 Statistics:');
      console.log(`  • JavaScript: ${options.javascript}`);
      console.log(`  • CSS: ${options.css}`);
      console.log(`  • HTML: ${options.html}`);
      console.log(`  • Performance: ${options.performance}`);
      console.log(`  • Errors: ${options.errors}`);
      console.log(`  • Warnings: ${options.warnings}`);
      console.log(`  • Info: ${options.info}`);
      console.log(`  • Baseline Approved: ${mockScoreResult.baselineApproved}`);

      if (earnedBadges.length === 0) {
        console.log('\nNo badges would be earned with these metrics.');
        return;
      }

      console.log('\n🏆 Would Earn These Badges:');
      earnedBadges.forEach(badge => {
        console.log(`  • ${badge.name}: ${badge.description}`);
      });

      console.log('\n📝 Badge Markdown:');
      console.log(defaultBadgeSystem.generateBadgesMarkdown(earnedBadges));

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();