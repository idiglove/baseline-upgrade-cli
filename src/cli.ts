#!/usr/bin/env node

import { Command } from 'commander';
import { FileScanner } from './scanner';
import { Reporter, ReportData } from './reporter';
import { version } from '../package.json';

const program = new Command();

program
  .name('baseline-upgrade')
  .description('CLI tool that scans codebases and suggests modern web feature upgrades using Baseline data')
  .version(version);

program
  .argument('[path]', 'path to scan', '.')
  .option('-v, --verbose', 'verbose output')
  .option('-f, --format <type>', 'output format (text, json)', 'text')
  .option('-i, --ignore <patterns>', 'ignore patterns (comma-separated)', 'node_modules/**,*.min.js,dist/**,build/**')
  .action(async (path: string, options) => {
    try {
      if (options.verbose) {
        console.log(`🚀 Scanning ${path} for modernization opportunities...`);
      }

      // Parse ignore patterns
      const ignorePatterns = options.ignore ? options.ignore.split(',').map((p: string) => p.trim()) : undefined;
      
      // Initialize scanner with content reading enabled
      const scanner = new FileScanner({ 
        ignorePatterns,
        readContents: true 
      });
      const scanResult = await scanner.scan(path);

      if (options.verbose) {
        console.log(`Found ${scanResult.files.length} files to analyze`);
        const totalSize = scanResult.fileContents.reduce((sum, file) => sum + file.size, 0);
        console.log(`Read ${(totalSize / 1024).toFixed(1)}KB of content`);
        if (scanResult.errors.length > 0) {
          console.warn('Scan errors:', scanResult.errors);
        }
      }

      // TODO: Implement rule engine and analysis
      // For now, create mock report data
      const totalContentSize = scanResult.fileContents.reduce((sum, file) => sum + file.size, 0);
      const reportData: ReportData = {
        suggestions: [], // Will be populated by rule engine
        totalFiles: scanResult.files.length,
        scannedFiles: scanResult.files,
        totalContentSize,
        errors: scanResult.errors
      };

      // Generate report
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