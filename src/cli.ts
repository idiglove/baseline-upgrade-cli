#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { Reporter, ReportData } from './reporter';
import { RuleEngine, builtinRules, defaultConfig } from './rules';
import { FileScanner } from './scanner';
import { version } from '../package.json';
import * as fs from 'fs';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('baseline-upgrade')
  .description(
    'CLI tool that suggests modern web feature upgrades using deterministic rule-based analysis'
  )
  .version(version);

// Per-file analysis command
program
  .command('file')
  .description('Analyze a single file for modernization opportunities')
  .argument('<filepath>', 'path to the file to analyze')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
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
      
      const suggestions = engine.analyzeFile(filepath, content);

      const reportData: ReportData = {
        suggestions,
        totalFiles: 1,
        scannedFiles: [filepath],
        totalContentSize: content.length,
        errors: [],
      };

      const reporter = new Reporter();
      const output = options.format === 'json'
        ? reporter.formatJson(reportData)
        : reporter.formatText(reportData);

      console.log(output);
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
  .action(async (commit: string, options) => {
    try {
      if (options.verbose) {
        console.log(`🚀 Analyzing git commit ${commit} for modernization opportunities...`);
      }

      // Get git diff for the commit
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

      // Initialize rule engine
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

      const reportData: ReportData = {
        suggestions: allSuggestions,
        totalFiles: changedFiles.length,
        scannedFiles: changedFiles,
        totalContentSize: 0,
        errors,
      };

      const reporter = new Reporter();
      const output = options.format === 'json'
        ? reporter.formatJson(reportData)
        : reporter.formatText(reportData);

      console.log(output);
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
  .option('--ignore <patterns>', 'comma-separated ignore patterns', 'node_modules/**,*.min.js,dist/**,build/**,.git/**,coverage/**')
  .option('--extensions <exts>', 'comma-separated file extensions', '.js,.ts,.jsx,.tsx')
  .option('--max-size <size>', 'maximum file size in KB', '1024')
  .action(async (scanPath: string, options) => {
    try {
      if (options.verbose) {
        console.log(`🚀 Scanning ${scanPath} for modernization opportunities...`);
      }

      // Parse options
      const ignorePatterns = options.ignore.split(',').map((p: string) => p.trim());
      const extensions = options.extensions.split(',').map((e: string) => e.trim().startsWith('.') ? e.trim() : `.${e.trim()}`);
      const maxFileSize = parseInt(options.maxSize) * 1024; // Convert KB to bytes

      // Initialize scanner
      const scanner = new FileScanner({
        ignorePatterns,
        extensions,
        readContents: true,
        maxFileSize,
      });

      // Scan directory
      const scanResult = await scanner.scan(scanPath);

      if (scanResult.errors.length > 0 && options.verbose) {
        console.log('⚠️  Scan warnings:');
        scanResult.errors.forEach(error => console.log(`   ${error}`));
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

      // Analyze each file
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

      const reportData: ReportData = {
        suggestions: allSuggestions,
        totalFiles: scanResult.fileContents.length,
        scannedFiles: scanResult.fileContents.map(f => f.path),
        totalContentSize,
        errors: [...scanResult.errors, ...processErrors],
      };

      const reporter = new Reporter();
      const output = options.format === 'json'
        ? reporter.formatJson(reportData)
        : reporter.formatText(reportData);

      console.log(output);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
