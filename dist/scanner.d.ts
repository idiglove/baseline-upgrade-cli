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
    maxFileSize?: number;
}
export declare class FileScanner {
    private ignorePatterns;
    private extensions;
    private readContents;
    private maxFileSize;
    constructor(options?: ScanOptions);
    scan(targetPath: string): Promise<ScanResult>;
    private scanDirectory;
    private readFileContent;
    private shouldIgnore;
    private isTargetFile;
}
//# sourceMappingURL=scanner.d.ts.map