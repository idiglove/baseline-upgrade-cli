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
  private ignorePatterns: RegExp[];
  private extensions: Set<string>;
  private readContents: boolean;
  private maxFileSize: number;

  constructor(options: ScanOptions = {}) {
    this.ignorePatterns = (
      options.ignorePatterns || [
        'node_modules/**',
        '*.min.js',
        'dist/**',
        'build/**',
        '.git/**',
        'coverage/**',
      ]
    ).map(pattern => new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')));

    this.extensions = new Set(options.extensions || ['.js', '.ts', '.jsx', '.tsx']);
    this.readContents = options.readContents ?? false;
    this.maxFileSize = options.maxFileSize ?? 1024 * 1024; // 1MB default
  }

  async scan(targetPath: string): Promise<ScanResult> {
    const result: ScanResult = { files: [], fileContents: [], errors: [] };

    try {
      const resolvedPath = path.resolve(targetPath);
      const stats = await fs.promises.stat(resolvedPath);

      if (stats.isFile()) {
        if (this.isTargetFile(path.basename(resolvedPath))) {
          result.files.push(resolvedPath);
          
          if (this.readContents) {
            await this.readFileContent(resolvedPath, result);
          }
        } else {
          result.errors.push(`File type not supported: ${resolvedPath}`);
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
    let entries: fs.Dirent[];

    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      result.errors.push(`Cannot read directory ${dirPath}: ${error}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (this.shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, result);
      } else if (entry.isFile() && this.isTargetFile(entry.name)) {
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
    return this.ignorePatterns.some(pattern => pattern.test(filePath));
  }

  private isTargetFile(fileName: string): boolean {
    const ext = path.extname(fileName);
    return this.extensions.has(ext);
  }
}
