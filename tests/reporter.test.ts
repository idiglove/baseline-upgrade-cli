import { Reporter, ReportData } from '../src/reporter';
import { ModernizationSuggestion } from '../src/rules/types';

describe('Reporter', () => {
  let reporter: Reporter;

  beforeEach(() => {
    reporter = new Reporter();
  });

  describe('formatText', () => {
    test('should format empty suggestions', () => {
      const data: ReportData = {
        suggestions: [],
        totalFiles: 1,
        scannedFiles: ['test.js'],
        totalContentSize: 100,
        errors: []
      };

      const output = reporter.formatText(data);
      expect(output).toBe('✅ No modernization opportunities found. Your code is already modern!');
    });

    test('should format single suggestion', () => {
      const suggestion: ModernizationSuggestion = {
        file: 'test.js',
        line: 1,
        column: 0,
        oldCode: 'var message',
        newCode: 'const message',
        description: 'const is Baseline stable',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      };

      const data: ReportData = {
        suggestions: [suggestion],
        totalFiles: 1,
        scannedFiles: ['test.js'],
        totalContentSize: 100,
        errors: []
      };

      const output = reporter.formatText(data);
      expect(output).toContain('🚀 Found 1 modernization opportunities');
      expect(output).toContain('📁 test.js');
      expect(output).toContain('Line 1: var message → const message');
      expect(output).toContain('✨ const is Baseline stable');
      expect(output).toContain('💰 1 suggestions use Baseline stable features');
    });

    test('should format multiple suggestions from same file', () => {
      const suggestions: ModernizationSuggestion[] = [
        {
          file: 'test.js',
          line: 1,
          column: 0,
          oldCode: 'var name',
          newCode: 'const name',
          description: 'const is Baseline stable',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'var-to-const-let',
          severity: 'warn'
        },
        {
          file: 'test.js',
          line: 2,
          column: 0,
          oldCode: 'var age',
          newCode: 'const age',
          description: 'const is Baseline stable',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'var-to-const-let',
          severity: 'warn'
        }
      ];

      const data: ReportData = {
        suggestions,
        totalFiles: 1,
        scannedFiles: ['test.js'],
        totalContentSize: 100,
        errors: []
      };

      const output = reporter.formatText(data);
      expect(output).toContain('🚀 Found 2 modernization opportunities');
      expect(output).toContain('📁 test.js');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('💰 2 suggestions use Baseline stable features');
    });

    test('should format suggestions from multiple files', () => {
      const suggestions: ModernizationSuggestion[] = [
        {
          file: 'file1.js',
          line: 1,
          column: 0,
          oldCode: 'var x',
          newCode: 'const x',
          description: 'const is better',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'var-to-const-let',
          severity: 'warn'
        },
        {
          file: 'file2.js',
          line: 5,
          column: 10,
          oldCode: 'new XMLHttpRequest()',
          newCode: 'fetch()',
          description: 'fetch is modern',
          category: 'javascript',
          baselineStatus: 'high',
          ruleId: 'xhr-to-fetch',
          severity: 'warn'
        }
      ];

      const data: ReportData = {
        suggestions,
        totalFiles: 2,
        scannedFiles: ['file1.js', 'file2.js'],
        totalContentSize: 200,
        errors: []
      };

      const output = reporter.formatText(data);
      expect(output).toContain('📁 file1.js');
      expect(output).toContain('📁 file2.js');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 5:10');
    });

    test('should handle suggestions without column numbers', () => {
      const suggestion: ModernizationSuggestion = {
        file: 'test.js',
        line: 5,
        column: 0, // No column provided
        oldCode: 'var test',
        newCode: 'const test',
        description: 'const is better',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      };

      const data: ReportData = {
        suggestions: [suggestion],
        totalFiles: 1,
        scannedFiles: ['test.js'],
        totalContentSize: 100,
        errors: []
      };

      const output = reporter.formatText(data);
      expect(output).toContain('Line 5');
      expect(output).not.toContain('Line 5:undefined');
    });
  });

  describe('formatJson', () => {
    test('should format data as JSON', () => {
      const suggestion: ModernizationSuggestion = {
        file: 'test.js',
        line: 1,
        column: 0,
        oldCode: 'var message',
        newCode: 'const message',
        description: 'const is Baseline stable',
        category: 'javascript',
        baselineStatus: 'high',
        ruleId: 'var-to-const-let',
        severity: 'warn'
      };

      const data: ReportData = {
        suggestions: [suggestion],
        totalFiles: 1,
        scannedFiles: ['test.js'],
        totalContentSize: 100,
        errors: []
      };

      const output = reporter.formatJson(data);
      const parsed = JSON.parse(output);
      
      expect(parsed.suggestions).toHaveLength(1);
      expect(parsed.suggestions[0].ruleId).toBe('var-to-const-let');
      expect(parsed.totalFiles).toBe(1);
      expect(parsed.scannedFiles).toEqual(['test.js']);
    });

    test('should handle empty data', () => {
      const data: ReportData = {
        suggestions: [],
        totalFiles: 0,
        scannedFiles: [],
        totalContentSize: 0,
        errors: []
      };

      const output = reporter.formatJson(data);
      const parsed = JSON.parse(output);
      
      expect(parsed.suggestions).toEqual([]);
      expect(parsed.totalFiles).toBe(0);
    });
  });
});