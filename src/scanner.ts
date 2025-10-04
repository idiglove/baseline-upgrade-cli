import * as fs from 'fs';
import * as path from 'path';

export interface FileInfo {
  path: string;
  content: string;
  size: number;
}

export interface ScanResult {
  files: string[];
  fileContents: FileInfo[];
  errors: string[];
}

export interface ScanOptions {
  ignorePatterns?: string[];
  extensions?: string[];
  readContents?: boolean;
  maxFileSize?: number; // in bytes
}

export class FileScanner {
  private ignorePatterns: string[];
  private extensions: Set<string>;
  private readContents: boolean;
  private maxFileSize: number;

  constructor(options: ScanOptions = {}) {
    this.ignorePatterns = options.ignorePatterns || [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
      '.next',
      'out',
      '*.min.js',
      '*.min.css',
      'package-lock.json',
      'yarn.lock'
    ];

    this.extensions = new Set(options.extensions || ['.js', '.ts', '.jsx', '.tsx', '.css']);
    this.readContents = options.readContents ?? false;
    this.maxFileSize = options.maxFileSize ?? 1024 * 1024; // 1MB default
  }

  async scan(targetPath: string): Promise<ScanResult> {
    const result: ScanResult = { files: [], fileContents: [], errors: [] };

    try {
      const resolvedPath = path.resolve(targetPath);
      const stats = await fs.promises.stat(resolvedPath);

      if (stats.isFile()) {
        if (this.isTargetFile(resolvedPath) && !this.shouldIgnore(resolvedPath)) {
          result.files.push(resolvedPath);
          
          if (this.readContents) {
            await this.readFileContent(resolvedPath, result);
          }
        } else {
          if (this.shouldIgnore(resolvedPath)) {
            result.errors.push(`Ignored file: ${resolvedPath}`);
          } else {
            result.errors.push(`File type not supported: ${resolvedPath}`);
          }
        }
      } else if (stats.isDirectory()) {
        await this.scanDirectory(resolvedPath, result);
      } else {
        result.errors.push(`Path is not a file or directory: ${resolvedPath}`);
      }
    } catch (error) {
      result.errors.push(`Failed to scan ${targetPath}: ${error}`);
    }

    return result;
  }

  private async scanDirectory(dirPath: string, result: ScanResult): Promise<void> {
    // Check if this directory should be ignored
    if (this.shouldIgnore(dirPath)) {
      result.errors.push(`Ignored directory: ${dirPath}`);
      return;
    }

    let entries: fs.Dirent[];

    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      result.errors.push(`Cannot read directory ${dirPath}: ${error}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Check if this file/directory should be ignored
      if (this.shouldIgnore(fullPath)) {
        if (entry.isDirectory()) {
          result.errors.push(`Ignored directory: ${fullPath}`);
        } else {
          result.errors.push(`Ignored file: ${fullPath}`);
        }
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, result);
      } else if (entry.isFile() && this.isTargetFile(fullPath)) {
        result.files.push(fullPath);

        if (this.readContents) {
          await this.readFileContent(fullPath, result);
        }
      }
    }
  }

  private async readFileContent(filePath: string, result: ScanResult): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.size > this.maxFileSize) {
        result.errors.push(`File too large (${stats.size} bytes): ${filePath}`);
        return;
      }

      const content = await fs.promises.readFile(filePath, 'utf8');

      result.fileContents.push({
        path: filePath,
        content,
        size: stats.size,
      });
    } catch (error) {
      result.errors.push(`Cannot read file ${filePath}: ${error}`);
    }
  }

  private shouldIgnore(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    
    for (const pattern of this.ignorePatterns) {
      const normalizedPattern = pattern.toLowerCase();
      
      // Simple and reliable pattern matching
      if (normalizedPattern.includes('*')) {
        // Handle wildcard patterns like "*.min.js"
        const regexPattern = normalizedPattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        const regex = new RegExp(regexPattern);
        if (regex.test(path.basename(normalizedPath))) {
          return true;
        }
      } else {
        // Simple directory/file name matching
        if (normalizedPath.includes(`/${normalizedPattern}/`) || 
            normalizedPath.endsWith(`/${normalizedPattern}`) ||
            normalizedPath.includes(`\\${normalizedPattern}\\`) ||
            normalizedPath.endsWith(`\\${normalizedPattern}`)) {
          return true;
        }
        
        // Also check the basename
        const basename = path.basename(normalizedPath);
        if (basename === normalizedPattern) {
          return true;
        }
      }
    }
    
    return false;
  }

  private isTargetFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.extensions.has(ext);
  }
}