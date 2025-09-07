export interface Suggestion {
    file: string;
    line: number;
    column?: number;
    oldCode: string;
    newCode: string;
    message: string;
    category: 'javascript' | 'css' | 'html' | 'performance';
    baselineStatus: 'stable' | 'newly-available' | 'limited';
    confidence: 'high' | 'medium' | 'low';
}
export interface ReportData {
    suggestions: Suggestion[];
    totalFiles: number;
    scannedFiles: string[];
    totalContentSize: number;
    errors: string[];
}
export declare class Reporter {
    formatText(data: ReportData): string;
    formatJson(data: ReportData): string;
    private getStatusEmoji;
}
//# sourceMappingURL=reporter.d.ts.map