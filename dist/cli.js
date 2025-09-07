#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scanner_1 = require("./scanner");
const reporter_1 = require("./reporter");
const package_json_1 = require("../package.json");
const program = new commander_1.Command();
program
    .name('baseline-upgrade')
    .description('CLI tool that scans codebases and suggests modern web feature upgrades using Baseline data')
    .version(package_json_1.version);
program
    .argument('[path]', 'path to scan', '.')
    .option('-v, --verbose', 'verbose output')
    .option('-f, --format <type>', 'output format (text, json)', 'text')
    .option('-i, --ignore <patterns>', 'ignore patterns (comma-separated)', 'node_modules/**,*.min.js,dist/**,build/**')
    .action(async (path, options) => {
    try {
        if (options.verbose) {
            console.log(`🚀 Scanning ${path} for modernization opportunities...`);
        }
        // Parse ignore patterns
        const ignorePatterns = options.ignore
            ? options.ignore.split(',').map((p) => p.trim())
            : undefined;
        // Initialize scanner with content reading enabled
        const scanner = new scanner_1.FileScanner({
            ignorePatterns,
            readContents: true,
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
        const reportData = {
            suggestions: [], // Will be populated by rule engine
            totalFiles: scanResult.files.length,
            scannedFiles: scanResult.files,
            totalContentSize,
            errors: scanResult.errors,
        };
        // Generate report
        const reporter = new reporter_1.Reporter();
        const output = options.format === 'json'
            ? reporter.formatJson(reportData)
            : reporter.formatText(reportData);
        console.log(output);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map